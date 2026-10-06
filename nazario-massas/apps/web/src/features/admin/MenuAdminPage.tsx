import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { CATEGORY_IDS, startingPrice, type CategoryId, type Product } from '@nazario/shared';
import { ButtonLink, IconButton } from '@/components/ui/Button';
import { Segmented, Switch } from '@/components/ui/Choice';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Picture } from '@/components/ui/Picture';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBRL } from '@/lib/format';
import { toast } from '@/stores/ui';
import { adminApi } from './session';
import { useAdminCatalog } from './useAdminCatalog';
import { PageHeader } from './ui';

type Tab = CategoryId | 'all';

export default function MenuAdminPage() {
  const { data, error, load, set } = useAdminCatalog();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [toDelete, setToDelete] = useState<Product>();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.products ?? []).filter((p) => (tab === 'all' || p.categoryId === tab) && (!q || p.name.toLowerCase().includes(q)));
  }, [data, tab, query]);

  async function patch(product: Product, change: Partial<Product>, message: string) {
    set((c) => ({ ...c, products: c.products.map((p) => (p.id === product.id ? { ...p, ...change } : p)) }));
    try {
      await adminApi.updateProduct(product.id, change);
      toast({ tone: 'success', title: message });
    } catch (e) {
      set((c) => ({ ...c, products: c.products.map((p) => (p.id === product.id ? product : p)) }));
      toast({ tone: 'error', title: 'Não foi possível salvar', description: e instanceof ApiError ? e.message : undefined });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(toDelete.id);
      set((c) => ({ ...c, products: c.products.filter((p) => p.id !== toDelete.id) }));
      toast({ tone: 'success', title: `${toDelete.name} excluído` });
      setToDelete(undefined);
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao excluir' });
    } finally {
      setDeleting(false);
    }
  }

  const categoryName = (id: CategoryId) => data?.categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Cardápio"
        description="Preços, descrições, fotos e disponibilidade. As mudanças aparecem na loja na hora."
        actions={
          <ButtonLink to="/admin/cardapio/novo" icon={<Plus className="size-4" aria-hidden />}>
            Novo produto
          </ButtonLink>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Tab>
          label="Categoria"
          value={tab}
          onChange={setTab}
          className="w-full overflow-x-auto sm:w-auto"
          options={[{ value: 'all', label: 'Todos' }, ...CATEGORY_IDS.map((id) => ({ value: id, label: categoryName(id) }))]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            className="h-11 w-full rounded-full border border-line bg-paper pr-4 pl-10 text-[1rem] outline-none focus:border-ink"
          />
        </div>
      </div>

      {error && !data && <ErrorState message={error} onRetry={() => void load()} />}
      {!data && !error && <Skeleton className="h-96 rounded-[var(--radius-lg)]" />}
      {data && products.length === 0 && <EmptyState title="Nenhum produto" description="Ajuste a busca ou crie um novo produto." />}

      {data && products.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-soft">
          {products.map((p) => (
            <li key={p.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap', !p.active && 'bg-flour/50')}>
              <Picture src={p.image} alt="" sizes="56px" className={cn('size-14 shrink-0 rounded-[var(--radius-sm)]', !p.active && 'opacity-50')} />
              <div className="min-w-0 flex-1">
                <Link to={`/admin/cardapio/${p.id}`} className="font-semibold text-ink hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-ink-muted">
                  {categoryName(p.categoryId)} ·{' '}
                  <span className="tabular">
                    {p.variants.length > 1 ? p.variants.map((v) => `${v.label.charAt(0)} ${formatBRL(v.price)}`).join(' · ') : formatBRL(startingPrice(p))}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-pressed={p.featured}
                  onClick={() => patch(p, { featured: !p.featured }, p.featured ? 'Removido dos destaques' : 'Adicionado aos destaques')}
                  className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors', p.featured ? 'bg-[#f3ead3] text-olive-ink' : 'text-ink-muted hover:bg-ink/[0.05]')}
                >
                  <Star className={cn('size-4', p.featured && 'fill-current')} aria-hidden /> Destaque
                </button>
                <Switch checked={p.active} onChange={(v) => patch(p, { active: v }, v ? `${p.name} ativado` : `${p.name} desativado`)} label={p.active ? 'Ativo' : 'Inativo'} />
                <div className="flex">
                  <Link to={`/admin/cardapio/${p.id}`} aria-label={`Editar ${p.name}`} className="grid size-10 place-items-center rounded-full text-ink-soft hover:bg-ink/[0.06]">
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  <IconButton size="sm" label={`Excluir ${p.name}`} className="size-10 text-ink-soft hover:text-tomato" onClick={() => setToDelete(p)}>
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(undefined)} title="Excluir produto" className="p-6 [--dialog-width:26rem] [&>h2]:font-display [&>h2]:text-2xl">
        <p className="mt-2 text-sm text-ink-soft">
          Excluir <strong className="text-ink">{toDelete?.name}</strong> remove o item do cardápio. Pedidos antigos continuam com o registro. Se for algo temporário, prefira desativar.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(undefined)}>
            Manter
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            Excluir
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
