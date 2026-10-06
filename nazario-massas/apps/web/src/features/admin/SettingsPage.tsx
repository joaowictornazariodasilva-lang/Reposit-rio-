import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type Category, type Coupon, type StoreSettings } from '@nazario/shared';
import { storeSettingsSchema } from '@nazario/shared/schemas';
import { Button, IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Choice';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { ApiError } from '@/lib/api';
import { centsToInput, parseMoney } from '@/lib/format';
import { toast } from '@/stores/ui';
import { adminApi } from './session';
import { useAdminCatalog } from './useAdminCatalog';
import { PageHeader, Panel } from './ui';

type Money = 'deliveryFee' | 'freeDeliveryFrom' | 'minOrder';

function CategoryRow({ category, onSaved }: { category: Category; onSaved: (c: Category) => void }) {
  const [draft, setDraft] = useState(category);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(category);
  const save = async () => {
    setSaving(true);
    try {
      onSaved(await adminApi.saveCategory(draft));
      toast({ tone: 'success', title: `Categoria ${draft.name} salva` });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[10rem_1fr_5rem_auto] sm:items-end">
      <Field label="Nome">{(p) => <Input {...p} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />}</Field>
      <Field label="Chamada">{(p) => <Input {...p} value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />}</Field>
      <Field label="Ordem">{(p) => <Input {...p} type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />}</Field>
      <div className="flex items-center gap-3 pb-2.5">
        <Switch checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} label="Ativa" />
        <Button size="sm" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty} loading={saving} onClick={save}>
          Salvar
        </Button>
      </div>
    </li>
  );
}

export default function SettingsPage() {
  const { data, error, load, set } = useAdminCatalog();
  const [settings, setSettings] = useState<StoreSettings>();
  const [money, setMoney] = useState<Record<Money, string>>({ deliveryFee: '', freeDeliveryFrom: '', minOrder: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) void load();
  }, [data, load]);

  useEffect(() => {
    if (data && !settings) {
      setSettings(data.settings);
      setMoney({
        deliveryFee: centsToInput(data.settings.deliveryFee),
        freeDeliveryFrom: centsToInput(data.settings.freeDeliveryFrom),
        minOrder: centsToInput(data.settings.minOrder),
      });
    }
  }, [data, settings]);

  if (error && !data) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data || !settings) return <Skeleton className="mx-auto h-96 max-w-4xl rounded-[var(--radius-lg)]" />;

  const up = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setSettings((s) => (s ? { ...s, [key]: value } : s));
  const upCoupon = (i: number, patch: Partial<Coupon>) => up('coupons', settings.coupons.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function persist(next: StoreSettings, message: string) {
    const parsed = storeSettingsSchema.safeParse(next);
    if (!parsed.success) {
      toast({ tone: 'error', title: 'Revise os valores', description: 'Taxas e cupons precisam de valores válidos (código com 3+ letras).' });
      return;
    }
    setSaving(true);
    try {
      const saved = await adminApi.saveSettings(parsed.data);
      set((c) => ({ ...c, settings: saved }));
      setSettings(saved);
      toast({ tone: 'success', title: message });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  }

  const saveAll = () =>
    persist(
      {
        ...settings,
        deliveryFee: parseMoney(money.deliveryFee) ?? -1,
        freeDeliveryFrom: parseMoney(money.freeDeliveryFrom) ?? -1,
        minOrder: parseMoney(money.minOrder) ?? -1,
        coupons: settings.coupons.map((c) => ({ ...c, code: c.code.trim().toUpperCase() })),
      },
      'Configurações salvas',
    );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Loja" description="Funcionamento, taxas, cupons e categorias." actions={<Button loading={saving} onClick={saveAll}>Salvar alterações</Button>} />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-ink">{settings.isOpen ? 'Loja aberta para pedidos' : 'Loja fechada'}</p>
            <p className="text-sm text-ink-muted">Com a loja fechada, o site continua no ar mas não aceita pedidos.</p>
          </div>
          <Switch
            checked={settings.isOpen}
            label={settings.isOpen ? 'Aberta' : 'Fechada'}
            onChange={(v) => {
              const next = { ...settings, isOpen: v };
              setSettings(next);
              void persist(next, v ? 'Loja aberta' : 'Loja fechada');
            }}
          />
        </div>
      </Panel>

      <Panel title="Entrega e pedido">
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ['deliveryFee', 'Taxa de entrega (R$)'],
              ['freeDeliveryFrom', 'Entrega grátis a partir de (R$)'],
              ['minOrder', 'Pedido mínimo (R$)'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} hint={key === 'freeDeliveryFrom' ? 'Use 0 para desativar.' : undefined}>
              {(p) => <Input {...p} inputMode="decimal" className="tabular" value={money[key]} onChange={(e) => setMoney((m) => ({ ...m, [key]: e.target.value }))} />}
            </Field>
          ))}
          <Field label="Tempo de entrega">{(p) => <Input {...p} value={settings.deliveryEstimate} onChange={(e) => up('deliveryEstimate', e.target.value)} />}</Field>
          <Field label="Tempo de retirada">{(p) => <Input {...p} value={settings.pickupEstimate} onChange={(e) => up('pickupEstimate', e.target.value)} />}</Field>
        </div>
      </Panel>

      <Panel title="Contato e endereço">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Endereço" className="sm:col-span-2">{(p) => <Input {...p} value={settings.address} onChange={(e) => up('address', e.target.value)} />}</Field>
          <Field label="Horário de funcionamento" className="sm:col-span-2">{(p) => <Input {...p} value={settings.hours} onChange={(e) => up('hours', e.target.value)} />}</Field>
          <Field label="Telefone">{(p) => <Input {...p} value={settings.phone} onChange={(e) => up('phone', e.target.value)} />}</Field>
          <Field label="WhatsApp" hint="Com DDI e DDD, só números: 5511999999999">
            {(p) => <Input {...p} inputMode="numeric" value={settings.whatsapp} onChange={(e) => up('whatsapp', e.target.value.replace(/\D/g, ''))} />}
          </Field>
        </div>
      </Panel>

      <Panel
        title="Cupons"
        action={
          <Button size="sm" variant="ghost" icon={<Plus className="size-4" aria-hidden />} onClick={() => up('coupons', [...settings.coupons, { code: '', kind: 'percent', value: 10, minSubtotal: 0, active: true, description: '' }])}>
            Novo cupom
          </Button>
        }
      >
        <p className="mb-3 text-xs text-ink-muted">Os códigos nunca são enviados à loja pública — o servidor valida cada cupom.</p>
        <ul className="space-y-3">
          {settings.coupons.map((c, i) => (
            <li key={i} className="grid gap-3 rounded-[var(--radius-md)] border border-line p-3 sm:grid-cols-[8rem_7rem_6rem_7rem_1fr_auto] sm:items-end">
              <Field label="Código">{(p) => <Input {...p} className="uppercase" value={c.code} onChange={(e) => upCoupon(i, { code: e.target.value.toUpperCase() })} />}</Field>
              <Field label="Tipo">
                {(p) => (
                  <Select {...p} value={c.kind} onChange={(e) => upCoupon(i, { kind: e.target.value as Coupon['kind'] })}>
                    <option value="percent">%</option>
                    <option value="fixed">R$</option>
                  </Select>
                )}
              </Field>
              <Field label="Valor">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    className="tabular"
                    value={c.kind === 'percent' ? String(c.value) : centsToInput(c.value)}
                    onChange={(e) => upCoupon(i, { value: c.kind === 'percent' ? Number(e.target.value.replace(/\D/g, '')) || 0 : (parseMoney(e.target.value) ?? 0) })}
                  />
                )}
              </Field>
              <Field label="Mínimo (R$)">
                {(p) => <Input {...p} inputMode="decimal" className="tabular" value={centsToInput(c.minSubtotal)} onChange={(e) => upCoupon(i, { minSubtotal: parseMoney(e.target.value) ?? 0 })} />}
              </Field>
              <Field label="Descrição">{(p) => <Input {...p} value={c.description} onChange={(e) => upCoupon(i, { description: e.target.value })} />}</Field>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={c.active} onChange={(v) => upCoupon(i, { active: v })} label={`Cupom ${c.code || i + 1} ativo`} hideLabel />
                <IconButton size="sm" label={`Remover cupom ${c.code}`} onClick={() => up('coupons', settings.coupons.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Categorias">
        <ul className="divide-y divide-line">
          {data.categories.map((c) => (
            <CategoryRow key={c.id} category={c} onSaved={(saved) => set((cat) => ({ ...cat, categories: cat.categories.map((x) => (x.id === saved.id ? saved : x)) }))} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}
