import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type AddonGroup } from '@nazario/shared';
import { addonGroupSchema } from '@nazario/shared/schemas';
import { Button, IconButton } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Choice';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import { ApiError } from '@/lib/api';
import { centsToInput, parseMoney, slugify } from '@/lib/format';
import { toast } from '@/stores/ui';
import { adminApi } from './session';
import { useAdminCatalog } from './useAdminCatalog';
import { PageHeader, Panel } from './ui';

interface OptionDraft {
  id: string;
  name: string;
  price: string;
  active: boolean;
}

function GroupEditor({ group, isNew, onSaved, onDeleted, usedBy }: { group: AddonGroup; isNew?: boolean; onSaved: (g: AddonGroup) => void; onDeleted: () => void; usedBy: number }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [min, setMin] = useState(String(group.minSelect));
  const [max, setMax] = useState(String(group.maxSelect));
  const [options, setOptions] = useState<OptionDraft[]>(group.options.map((o) => ({ ...o, price: centsToInput(o.price) })));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const candidate = {
      id: group.id || slugify(name),
      name: name.trim(),
      description: description.trim() || undefined,
      minSelect: Number(min) || 0,
      maxSelect: Math.max(1, Number(max) || 1),
      options: options.map((o) => ({ id: o.id || `${slugify(name)}-${slugify(o.name)}`, name: o.name.trim(), price: parseMoney(o.price) ?? -1, active: o.active })),
    };
    const parsed = addonGroupSchema.safeParse(candidate);
    if (!parsed.success) {
      toast({ tone: 'error', title: 'Revise o grupo', description: 'Informe nome, ao menos uma opção e preços válidos.' });
      return;
    }
    setSaving(true);
    try {
      onSaved(await adminApi.saveAddonGroup(parsed.data));
      toast({ tone: 'success', title: `“${parsed.data.name}” salvo` });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      if (!isNew) await adminApi.deleteAddonGroup(group.id);
      onDeleted();
      toast({ tone: 'success', title: 'Grupo excluído' });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao excluir' });
    }
  }

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-[1.5fr_1.5fr_6rem_6rem]">
        <Field label="Nome do grupo">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Borda recheada" />}</Field>
        <Field label="Instrução" optional>{(p) => <Input {...p} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Escolha até 1" />}</Field>
        <Field label="Mínimo">{(p) => <Input {...p} type="number" min={0} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />}</Field>
        <Field label="Máximo">{(p) => <Input {...p} type="number" min={1} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />}</Field>
      </div>

      <p className="mt-6 mb-2 text-sm font-semibold text-ink">Opções</p>
      <ul className="divide-y divide-line rounded-[var(--radius-md)] border border-line">
        {options.map((o, i) => (
          <li key={o.id || i} className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap">
            <input
              aria-label={`Nome da opção ${i + 1}`}
              value={o.name}
              onChange={(e) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className="h-10 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-[1rem] outline-none hover:border-line focus:border-ink"
              placeholder="Nome da opção"
            />
            <div className="flex items-center gap-1 text-sm text-ink-muted">
              R$
              <input
                aria-label={`Preço da opção ${i + 1}`}
                inputMode="decimal"
                value={o.price}
                onChange={(e) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                className="tabular h-10 w-20 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-[1rem] text-ink outline-none focus:border-ink"
              />
            </div>
            <Switch checked={o.active} onChange={(v) => setOptions((all) => all.map((x, j) => (j === i ? { ...x, active: v } : x)))} label={`${o.name || 'Opção'} disponível`} hideLabel />
            <IconButton size="sm" label={`Remover ${o.name || 'opção'}`} onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" aria-hidden />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="ghost" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => setOptions((all) => [...all, { id: '', name: '', price: '0,00', active: true }])}>
        Nova opção
      </Button>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-ink-muted">{isNew ? 'Novo grupo — salve para usar nos produtos.' : `Usado em ${usedBy} produto(s).`}</p>
        <div className="flex gap-2">
          {confirmDelete ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Manter</Button>
              <Button size="sm" variant="danger" onClick={remove}>Confirmar exclusão</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" className="text-tomato" onClick={() => setConfirmDelete(true)}>Excluir grupo</Button>
          )}
          <Button size="sm" loading={saving} onClick={save}>Salvar grupo</Button>
        </div>
      </div>
    </Panel>
  );
}

export default function AddonsPage() {
  const { data, error, load, set } = useAdminCatalog();
  const [drafts, setDrafts] = useState<AddonGroup[]>([]);

  useEffect(() => {
    if (!data) void load();
  }, [data, load]);

  if (error && !data) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <Skeleton className="mx-auto h-96 max-w-4xl rounded-[var(--radius-lg)]" />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Adicionais"
        description="Bordas, extras e complementos. Associe os grupos aos produtos no editor do cardápio."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setDrafts((d) => [{ id: '', name: '', minSelect: 0, maxSelect: 1, options: [{ id: '', name: '', price: 0, active: true }] }, ...d])}>
            Novo grupo
          </Button>
        }
      />
      <div className="space-y-4">
        {drafts.map((g, i) => (
          <GroupEditor
            key={`draft-${i}`}
            group={g}
            isNew
            usedBy={0}
            onSaved={(saved) => {
              set((c) => ({ ...c, addonGroups: [...c.addonGroups.filter((x) => x.id !== saved.id), saved] }));
              setDrafts((d) => d.filter((_, j) => j !== i));
            }}
            onDeleted={() => setDrafts((d) => d.filter((_, j) => j !== i))}
          />
        ))}
        {data.addonGroups.map((g) => (
          <GroupEditor
            key={g.id}
            group={g}
            usedBy={data.products.filter((p) => p.addonGroupIds.includes(g.id)).length}
            onSaved={(saved) => set((c) => ({ ...c, addonGroups: c.addonGroups.map((x) => (x.id === saved.id ? saved : x)) }))}
            onDeleted={() =>
              set((c) => ({
                ...c,
                addonGroups: c.addonGroups.filter((x) => x.id !== g.id),
                products: c.products.map((p) => ({ ...p, addonGroupIds: p.addonGroupIds.filter((x) => x !== g.id) })),
              }))
            }
          />
        ))}
        {data.addonGroups.length === 0 && drafts.length === 0 && <EmptyState title="Nenhum grupo de adicionais" description="Crie bordas, extras e complementos." />}
      </div>
    </div>
  );
}
