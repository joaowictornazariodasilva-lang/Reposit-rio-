import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { Banknote, Bike, ChevronDown, ChevronLeft, CreditCard, Lock, QrCode, ShoppingBag, Store, Tag } from 'lucide-react';
import { type CheckoutInput, type PaymentMethod, type PublicOrder } from '@nazario/shared';
import { checkoutSchema } from '@nazario/shared/schemas';
import { Button, ButtonLink } from '@/components/ui/Button';
import { RadioCards } from '@/components/ui/Choice';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import { Picture } from '@/components/ui/Picture';
import { Spinner } from '@/components/ui/Spinner';
import { AnimatedText } from '@/components/ui/AnimatedNumber';
import { useCartSummary } from '@/hooks/useCartSummary';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBRL, formatCep, formatCpf, formatPhone, parseMoney } from '@/lib/format';
import { useSeo } from '@/lib/seo';
import { useCart } from '@/stores/cart';
import { useCatalog } from '@/stores/catalog';
import { useCustomer } from '@/stores/customer';
import { toast } from '@/stores/ui';
import { useQuote } from '@/features/checkout/useQuote';
import { lookupCep } from '@/features/checkout/viacep';

type FieldKey = 'name' | 'phone' | 'document' | 'cep' | 'street' | 'number' | 'neighborhood' | 'city' | 'changeFor' | 'items';

const FIELD_LABEL: Record<FieldKey, string> = {
  name: 'Nome',
  phone: 'Telefone',
  document: 'CPF',
  cep: 'CEP',
  street: 'Rua',
  number: 'Número',
  neighborhood: 'Bairro',
  city: 'Cidade',
  changeFor: 'Troco',
  items: 'Carrinho',
};

function fieldFromPath(path: PropertyKey[]): FieldKey | undefined {
  const last = String(path[path.length - 1]);
  if (path[0] === 'items') return 'items';
  if (last in FIELD_LABEL) return last as FieldKey;
  return undefined;
}

function Section({ step, title, children, aside }: { step: number; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] bg-paper p-5 shadow-soft sm:p-7" aria-labelledby={`step-${step}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`step-${step}`} className="flex items-center gap-3 font-display text-2xl tracking-[-0.02em] text-ink">
          <span className="grid size-7 place-items-center rounded-full bg-ink font-sans text-xs font-bold text-flour" aria-hidden>
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function CheckoutPage() {
  useSeo({ title: 'Finalizar pedido', noindex: true, path: '/checkout' });
  const navigate = useNavigate();
  const summary = useCartSummary();
  const lines = useCart((s) => s.lines);
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const clearCart = useCart((s) => s.clear);
  const catalog = useCatalog((s) => s.data);
  const saved = useCustomer();
  const formRef = useRef<HTMLFormElement>(null);
  const wide = useMediaQuery('(min-width: 1024px)');

  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>(saved.fulfillment);
  const [name, setName] = useState(saved.name);
  const [phone, setPhone] = useState(formatPhone(saved.phone));
  const [documentNumber, setDocumentNumber] = useState(saved.document ? formatCpf(saved.document) : '');
  const [address, setAddress] = useState(saved.address);
  const [payment, setPayment] = useState<PaymentMethod>(saved.paymentMethod);
  const [changeFor, setChangeFor] = useState('');
  const [couponDraft, setCouponDraft] = useState(couponCode);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [cepState, setCepState] = useState<'idle' | 'loading' | 'notfound'>('idle');
  const [summaryOpen, setSummaryOpen] = useState(false);

  const items = useMemo(
    () => lines.map(({ productId, variantId, quantity, addonOptionIds, notes }) => ({ productId, variantId, quantity, addonOptionIds, notes })),
    [lines],
  );
  const { quote, loading: quoteLoading, error: quoteError } = useQuote(items, fulfillment, couponCode);
  const total = quote?.total ?? summary.subtotal + (fulfillment === 'delivery' ? summary.deliveryFee : 0);
  const needsDocument = Boolean(catalog?.payments.requiresDocument && payment === 'pix');
  const errorList = Object.entries(errors) as [FieldKey, string][];

  // ViaCEP autofill once 8 digits are typed.
  useEffect(() => {
    const digits = address.cep.replace(/\D/g, '');
    if (digits.length !== 8 || fulfillment !== 'delivery') return;
    const controller = new AbortController();
    setCepState('loading');
    lookupCep(digits, controller.signal)
      .then((r) => {
        if (!r) return setCepState('notfound');
        setCepState('idle');
        setAddress((a) => ({
          ...a,
          street: r.street || a.street,
          neighborhood: r.neighborhood || a.neighborhood,
          city: r.city || a.city,
        }));
        setErrors((e) => ({ ...e, cep: undefined, street: undefined, neighborhood: undefined, city: undefined }));
        if (r.street) document.getElementById('f-number')?.focus();
      })
      .catch(() => !controller.signal.aborted && setCepState('idle'));
    return () => controller.abort();
  }, [address.cep, fulfillment]);

  const setAddr = (key: keyof typeof address, value: string) => {
    setAddress((a) => ({ ...a, [key]: value }));
    if (errors[key as FieldKey]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusField = (key: FieldKey) => {
    const el = document.getElementById(`f-${key}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(undefined);
    const payload: CheckoutInput = {
      customer: { name, phone, document: needsDocument ? documentNumber : undefined },
      fulfillment: fulfillment === 'delivery' ? { type: 'delivery', address } : { type: 'pickup' },
      items,
      payment: { method: payment, changeFor: payment === 'cash' ? (parseMoney(changeFor) ?? undefined) : undefined },
      couponCode: couponCode || undefined,
    };
    const parsed = checkoutSchema.safeParse(payload);
    const next: Partial<Record<FieldKey, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = fieldFromPath(issue.path);
        if (key && !next[key]) next[key] = issue.message.startsWith('Invalid') || issue.message.startsWith('Too') ? `${FIELD_LABEL[key]} inválido` : issue.message;
      }
    }
    if (needsDocument && documentNumber.replace(/\D/g, '').length !== 11) next.document = 'Informe um CPF válido para gerar o Pix';
    if (payment === 'cash' && changeFor && (parseMoney(changeFor) ?? 0) < total) next.changeFor = 'O troco deve ser maior que o total';
    setErrors(next);
    const firstError = Object.keys(next)[0] as FieldKey | undefined;
    if (firstError || !parsed.success) {
      if (firstError) focusField(firstError);
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.post<PublicOrder>('/orders', parsed.data as unknown as Record<string, unknown>);
      saved.save({
        name,
        phone: phone.replace(/\D/g, ''),
        document: documentNumber.replace(/\D/g, ''),
        fulfillment,
        address,
        paymentMethod: payment,
      });
      saved.rememberOrder({ token: order.token, number: order.number, createdAt: order.createdAt });
      clearCart();
      navigate(`/pedido/${order.token}`, { replace: true, state: { justPlaced: true } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Não foi possível enviar o pedido.';
      setServerError(message);
      toast({ tone: 'error', title: 'Pedido não enviado', description: message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0 && !submitting) {
    return (
      <div className="container-page pt-32 pb-24">
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden />}
          title="Seu carrinho está vazio"
          description="Adicione algo do cardápio para finalizar o pedido."
          action={<ButtonLink to="/cardapio">Ver cardápio</ButtonLink>}
        />
      </div>
    );
  }

  // Not a <form>: on phones this block lives inside the checkout form (nested forms are invalid).
  const applyCoupon = () => setCoupon(couponDraft);
  const couponBlock = (
    <div className="mt-4">
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">
          Cupom de desconto
        </label>
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            id="coupon"
            value={couponDraft}
            onChange={(e) => setCouponDraft(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCoupon();
              }
            }}
            placeholder="Cupom de desconto"
            autoComplete="off"
            className="h-11 w-full rounded-full border border-line bg-paper pr-3 pl-10 text-[1rem] uppercase outline-none placeholder:normal-case focus:border-ink"
          />
        </div>
        {couponCode && couponCode === couponDraft ? (
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => {
              setCoupon('');
              setCouponDraft('');
            }}
          >
            Remover
          </Button>
        ) : (
          <Button variant="secondary" className="h-11" disabled={!couponDraft} onClick={applyCoupon}>
            Aplicar
          </Button>
        )}
      </div>
      {quote?.couponMessage && <p className="mt-2 text-xs font-medium text-tomato" role="status">{quote.couponMessage}</p>}
      {quote?.couponCode && <p className="mt-2 text-xs font-semibold text-basil" role="status">Cupom {quote.couponCode} aplicado.</p>}
    </div>
  );

  const summaryBlock = (
    <div>
      <ul className="divide-y divide-line">
        {summary.items.map(({ line, product, priced }) => (
          <li key={line.key} className="flex gap-3 py-3">
            {product?.image && <Picture src={product.image} alt="" sizes="48px" className="size-12 shrink-0 rounded-[var(--radius-sm)]" />}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-ink">
                {line.quantity}× {product?.name}
              </p>
              <p className="text-ink-muted">
                {[priced && (product?.variants.length ?? 0) > 1 ? priced.variantLabel : null, ...(priced?.addons.map((a) => a.name) ?? [])]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {line.notes && <p className="italic text-ink-muted">“{line.notes}”</p>}
            </div>
            <p className="tabular text-sm font-semibold text-ink">{priced && formatBRL(priced.lineTotal)}</p>
          </li>
        ))}
      </ul>

      {wide && couponBlock}

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between text-ink-soft">
          <dt>Subtotal</dt>
          <dd className="tabular">{formatBRL(quote?.subtotal ?? summary.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink-soft">
          <dt>{fulfillment === 'delivery' ? 'Entrega' : 'Retirada no balcão'}</dt>
          <dd className="tabular">
            {(quote?.deliveryFee ?? 0) === 0 ? <span className="font-semibold text-basil">Grátis</span> : formatBRL(quote!.deliveryFee)}
          </dd>
        </div>
        {(quote?.discount ?? 0) > 0 && (
          <div className="flex justify-between font-medium text-basil">
            <dt>Desconto</dt>
            <dd className="tabular">− {formatBRL(quote!.discount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line pt-3 text-lg font-semibold text-ink">
          <dt>Total</dt>
          <dd className="tabular flex items-center gap-2">
            {quoteLoading && <Spinner className="size-4 text-ink-muted" />}
            <AnimatedText value={formatBRL(total)} />
          </dd>
        </div>
      </dl>
      {quoteError && <p className="mt-2 text-xs text-tomato" role="alert">{quoteError}</p>}
    </div>
  );

  return (
    <div className="container-page pt-24 pb-36 sm:pt-28 lg:pb-24">
      <Link to="/cardapio" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden /> Continuar comprando
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-[-0.035em] text-ink sm:text-6xl">Finalizar pedido</h1>

      {/* Mobile: collapsible order summary */}
      {!wide && (
      <div className="mt-6 rounded-[var(--radius-lg)] bg-paper shadow-soft">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          aria-expanded={summaryOpen}
          aria-controls="mobile-summary"
          onClick={() => setSummaryOpen((o) => !o)}
        >
          <span className="text-sm font-semibold text-ink">
            {summaryOpen ? 'Ocultar resumo' : 'Ver resumo'} · {summary.count} {summary.count === 1 ? 'item' : 'itens'}
          </span>
          <span className="flex items-center gap-2 font-semibold tabular text-ink">
            {formatBRL(total)}
            <ChevronDown className={cn('size-4 transition-transform', summaryOpen && 'rotate-180')} aria-hidden />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <m.div
              id="mobile-summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-line px-5 pb-5">{summaryBlock}</div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_27rem]">
        <form ref={formRef} id="checkout-form" noValidate onSubmit={onSubmit} className="space-y-5">
          {(serverError || errorList.length > 1) && (
            <div role="alert" className="rounded-[var(--radius-lg)] border border-tomato/30 bg-tomato-tint px-5 py-4 text-sm text-tomato-deep">
              {serverError ? (
                <p className="font-semibold">{serverError}</p>
              ) : (
                <>
                  <p className="font-semibold">Confira os campos destacados:</p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3">
                    {errorList.map(([key]) => (
                      <li key={key}>
                        <button type="button" className="underline underline-offset-2" onClick={() => focusField(key)}>
                          {FIELD_LABEL[key]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <Section step={1} title="Como você quer receber?">
            <RadioCards
              name="fulfillment"
              legend="Tipo de pedido"
              hideLegend
              columns={2}
              value={fulfillment}
              onChange={setFulfillment}
              options={[
                {
                  value: 'delivery',
                  label: 'Entrega',
                  description: catalog ? `${catalog.settings.deliveryEstimate}` : undefined,
                  icon: <Bike className="size-5" aria-hidden />,
                },
                {
                  value: 'pickup',
                  label: 'Retirada no local',
                  description: catalog ? `Pronto em ${catalog.settings.pickupEstimate} · sem taxa` : undefined,
                  icon: <Store className="size-5" aria-hidden />,
                },
              ]}
            />
          </Section>

          <Section step={2} title="Seus dados">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="f-name" label="Nome" error={errors.name}>
                {(p) => (
                  <Input
                    {...p}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                    }}
                    placeholder="Como podemos te chamar?"
                  />
                )}
              </Field>
              <Field id="f-phone" label="Telefone (WhatsApp)" error={errors.phone && 'Informe um telefone com DDD'}>
                {(p) => (
                  <Input
                    {...p}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => {
                      setPhone(formatPhone(e.target.value));
                      if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
                    }}
                    placeholder="(11) 90000-0000"
                  />
                )}
              </Field>
            </div>
          </Section>

          <AnimatePresence initial={false}>
            {fulfillment === 'delivery' && (
              <m.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
              >
                <Section step={3} title="Endereço de entrega">
                  <div className="grid gap-4 sm:grid-cols-6">
                    <Field
                      id="f-cep"
                      label="CEP"
                      className="sm:col-span-2"
                      error={errors.cep && 'CEP inválido'}
                      hint={cepState === 'notfound' ? 'CEP não encontrado — preencha manualmente.' : undefined}
                    >
                      {(p) => (
                        <div className="relative">
                          <Input
                            {...p}
                            inputMode="numeric"
                            autoComplete="postal-code"
                            value={formatCep(address.cep)}
                            onChange={(e) => setAddr('cep', e.target.value)}
                            placeholder="00000-000"
                          />
                          {cepState === 'loading' && <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted" label="Buscando CEP" />}
                        </div>
                      )}
                    </Field>
                    <Field id="f-street" label="Rua" className="sm:col-span-4" error={errors.street}>
                      {(p) => <Input {...p} autoComplete="address-line1" value={address.street} onChange={(e) => setAddr('street', e.target.value)} />}
                    </Field>
                    <Field id="f-number" label="Número" className="sm:col-span-2" error={errors.number}>
                      {(p) => <Input {...p} inputMode="numeric" value={address.number} onChange={(e) => setAddr('number', e.target.value)} />}
                    </Field>
                    <Field label="Complemento" optional className="sm:col-span-4">
                      {(p) => (
                        <Input {...p} autoComplete="address-line2" value={address.complement} onChange={(e) => setAddr('complement', e.target.value)} placeholder="Apto, bloco, casa…" />
                      )}
                    </Field>
                    <Field id="f-neighborhood" label="Bairro" className="sm:col-span-3" error={errors.neighborhood}>
                      {(p) => <Input {...p} value={address.neighborhood} onChange={(e) => setAddr('neighborhood', e.target.value)} />}
                    </Field>
                    <Field id="f-city" label="Cidade" className="sm:col-span-3" error={errors.city}>
                      {(p) => <Input {...p} autoComplete="address-level2" value={address.city} onChange={(e) => setAddr('city', e.target.value)} />}
                    </Field>
                    <Field label="Ponto de referência" optional className="sm:col-span-6">
                      {(p) => <Input {...p} value={address.reference} onChange={(e) => setAddr('reference', e.target.value)} placeholder="Ex.: portão verde, ao lado da padaria" />}
                    </Field>
                  </div>
                </Section>
              </m.div>
            )}
          </AnimatePresence>

          <Section
            step={fulfillment === 'delivery' ? 4 : 3}
            title="Pagamento"
            aside={
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Lock className="size-3.5" aria-hidden /> Seguro
              </span>
            }
          >
            <RadioCards
              name="payment"
              legend="Forma de pagamento"
              hideLegend
              value={payment}
              onChange={setPayment}
              options={[
                {
                  value: 'pix',
                  label: 'Pix',
                  description: 'Aprovação na hora · QR Code na próxima tela',
                  icon: <QrCode className="size-5" aria-hidden />,
                  aside: <span className="rounded-full bg-basil-tint px-2 py-0.5 text-[0.6875rem] font-semibold text-basil">Mais rápido</span>,
                },
                {
                  value: 'card',
                  label: 'Cartão',
                  description: fulfillment === 'delivery' ? 'Crédito ou débito na maquininha, na entrega' : 'Crédito ou débito no balcão',
                  icon: <CreditCard className="size-5" aria-hidden />,
                },
                {
                  value: 'cash',
                  label: 'Dinheiro',
                  description: fulfillment === 'delivery' ? 'Pague ao entregador' : 'Pague na retirada',
                  icon: <Banknote className="size-5" aria-hidden />,
                },
              ]}
            />
            <AnimatePresence initial={false}>
              {payment === 'cash' && (
                <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Field id="f-changeFor" label="Troco para quanto?" optional className="mt-4 max-w-xs" error={errors.changeFor} hint="Deixe em branco se não precisar de troco.">
                    {(p) => (
                      <Input {...p} inputMode="decimal" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} placeholder="R$ 100,00" />
                    )}
                  </Field>
                </m.div>
              )}
              {needsDocument && (
                <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Field id="f-document" label="CPF" className="mt-4 max-w-xs" error={errors.document} hint="Exigido pelo banco para emitir o Pix.">
                    {(p) => (
                      <Input {...p} inputMode="numeric" value={documentNumber} onChange={(e) => setDocumentNumber(formatCpf(e.target.value))} placeholder="000.000.000-00" />
                    )}
                  </Field>
                </m.div>
              )}
            </AnimatePresence>
          </Section>

          {!wide && (
            <section className="rounded-[var(--radius-xl)] bg-paper p-5 shadow-soft" aria-labelledby="coupon-title">
              <h2 id="coupon-title" className="font-display text-xl text-ink">Tem um cupom?</h2>
              {couponBlock}
            </section>
          )}

          <Button type="submit" size="lg" className="hidden w-full lg:flex" loading={submitting} disabled={summary.hasProblems}>
            Fazer pedido · {formatBRL(total)}
          </Button>
          <p className="hidden text-center text-xs text-ink-muted lg:block">
            Ao confirmar, você concorda em receber atualizações do pedido pelo telefone informado.
          </p>
        </form>

        {wide && (
          <aside className="sticky top-28 rounded-[var(--radius-xl)] bg-paper p-6 shadow-soft" aria-label="Resumo do pedido">
            <h2 className="font-display text-2xl text-ink">Resumo</h2>
            <div className="mt-2">{summaryBlock}</div>
          </aside>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <Button type="submit" form="checkout-form" size="lg" className="w-full justify-between px-6" loading={submitting} disabled={summary.hasProblems}>
          <span>Fazer pedido</span>
          <span className="tabular">{formatBRL(total)}</span>
        </Button>
      </div>
    </div>
  );
}
