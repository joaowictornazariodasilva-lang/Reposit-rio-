import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { AlertTriangle, MessageSquareText, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Picture } from '@/components/ui/Picture';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { AnimatedText } from '@/components/ui/AnimatedNumber';
import { useCartSummary, type CartItemView } from '@/hooks/useCartSummary';
import { formatBRL, pluralize } from '@/lib/format';
import { useCart } from '@/stores/cart';
import { toast, useUi } from '@/stores/ui';
import { FreeDeliveryMeter } from './FreeDeliveryMeter';

function CartItem({ item, index }: { item: CartItemView; index: number }) {
  const { line, product, priced, problem } = item;
  const setQuantity = useCart((s) => s.setQuantity);
  const setNotes = useCart((s) => s.setNotes);
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draft, setDraft] = useState(line.notes);

  const onRemove = () => {
    const removed = remove(line.key);
    if (removed) {
      toast({
        title: `${product?.name ?? 'Item'} removido`,
        action: { label: 'Desfazer', onClick: () => restore(removed, index) },
      });
    }
  };

  return (
    <m.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3.5 border-b border-line py-4 last:border-b-0"
    >
      {product?.image ? (
        <Picture src={product.image} alt="" sizes="72px" className="size-[4.5rem] shrink-0 rounded-[var(--radius-sm)]" />
      ) : (
        <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-[var(--radius-sm)] bg-flour-deep font-display text-xl text-ink-soft" aria-hidden>
          {product?.name.charAt(0) ?? '?'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-ink">{product?.name ?? 'Item indisponível'}</p>
            {priced && (product?.variants.length ?? 0) > 1 && <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{priced.variantLabel}</p>}
          </div>
          {priced && <p className="tabular shrink-0 font-semibold text-ink"><AnimatedText value={formatBRL(priced.lineTotal)} /></p>}
        </div>

        {priced && priced.addons.length > 0 && (
          <p className="mt-1 text-[0.8125rem] leading-snug text-ink-soft">+ {priced.addons.map((a) => a.name).join(', ')}</p>
        )}
        {problem && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-tomato">
            <AlertTriangle className="size-3.5" aria-hidden /> {problem}
          </p>
        )}

        {editingNotes ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setNotes(line.key, draft);
              setEditingNotes(false);
            }}
          >
            <label className="sr-only" htmlFor={`notes-${line.key}`}>Observação para {product?.name}</label>
            <input
              id={`notes-${line.key}`}
              autoFocus
              maxLength={140}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex.: sem cebola"
              className="h-10 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm outline-none focus:border-ink"
            />
            <Button type="submit" size="sm" variant="secondary" className="h-10">Salvar</Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(line.notes);
              setEditingNotes(true);
            }}
            className="mt-1.5 flex items-center gap-1.5 text-left text-[0.8125rem] text-ink-muted hover:text-ink"
          >
            <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
            {line.notes ? <span className="italic">“{line.notes}”</span> : <span className="underline underline-offset-2">Adicionar observação</span>}
          </button>
        )}

        <div className="mt-3 flex items-center justify-between">
          <QuantityStepper
            size="sm"
            label={`Quantidade de ${product?.name ?? 'item'}`}
            value={line.quantity}
            onChange={(q) => setQuantity(line.key, q)}
            onRemove={onRemove}
          />
          {line.quantity > 1 && priced && <span className="tabular text-xs text-ink-muted">{formatBRL(priced.unitPrice)} cada</span>}
        </div>
      </div>
    </m.li>
  );
}

export function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  const navigate = useNavigate();
  const summary = useCartSummary();
  const belowMinimum = summary.subtotal < summary.minOrder;

  const goTo = (path: string) => {
    close();
    navigate(path);
  };

  return (
    <Dialog open={open} onClose={close} title="Seu carrinho" placement="right" className="[&>h2]:sr-only">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="font-display text-2xl leading-none text-ink" aria-hidden>Seu pedido</p>
          {summary.count > 0 && <p className="mt-1 text-[0.8125rem] text-ink-muted">{pluralize(summary.count, 'item', 'itens')}</p>}
        </div>
        <DialogClose onClose={close} tone="default" />
      </div>

      {summary.count === 0 ? (
        <EmptyState
          className="my-auto"
          icon={<ShoppingBag className="size-7" aria-hidden />}
          title="Seu carrinho está vazio"
          description="Que tal começar por uma das nossas pizzas de fermentação natural?"
          action={<Button onClick={() => goTo('/cardapio')}>Ver cardápio</Button>}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5">
            {summary.deliveryEnabled && (
              <div className="pt-4">
                <FreeDeliveryMeter subtotal={summary.subtotal} threshold={summary.freeDeliveryFrom} />
              </div>
            )}
            <ul>
              <AnimatePresence initial={false}>
                {summary.items.map((item, i) => (
                  <CartItem key={item.line.key} item={item} index={i} />
                ))}
              </AnimatePresence>
            </ul>
            <button type="button" onClick={() => goTo('/cardapio')} className="mb-6 text-sm font-semibold text-tomato underline-offset-4 hover:underline">
              + Adicionar mais itens
            </button>
          </div>

          <div className="border-t border-line bg-paper px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatBRL(summary.subtotal)}</dd>
              </div>
              {summary.deliveryEnabled ? (
                <div className="flex justify-between text-ink-soft">
                  <dt>Entrega</dt>
                  <dd className="tabular">{summary.deliveryFee === 0 ? <span className="font-semibold text-basil">Grátis</span> : formatBRL(summary.deliveryFee)}</dd>
                </div>
              ) : (
                <div className="flex justify-between text-ink-soft">
                  <dt>Retirada no balcão</dt>
                  <dd className="font-semibold text-basil">Sem taxa</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-semibold text-ink">
                <dt>{summary.deliveryEnabled ? 'Total estimado' : 'Total'}</dt>
                <dd className="tabular"><AnimatedText value={formatBRL(summary.subtotal + summary.deliveryFee)} /></dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-ink-muted">
              {summary.deliveryEnabled ? 'Cupons e retirada no balcão você escolhe no próximo passo.' : 'Cupom de desconto você aplica no próximo passo.'}
            </p>
            {belowMinimum && (
              <p className="mt-3 text-[0.8125rem] font-medium text-tomato">Pedido mínimo de {formatBRL(summary.minOrder)}.</p>
            )}
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={summary.hasProblems || belowMinimum}
              onClick={() => goTo('/checkout')}
            >
              Finalizar pedido
            </Button>
            {summary.hasProblems && (
              <p className="mt-2 text-center text-xs text-tomato">Remova os itens indisponíveis para continuar.</p>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
