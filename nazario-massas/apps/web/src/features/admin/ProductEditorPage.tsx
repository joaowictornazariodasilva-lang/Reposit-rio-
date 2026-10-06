import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ChevronLeft, ImageUp, Plus, Trash2 } from 'lucide-react';
import { CATEGORY_IDS, PRODUCT_BADGES, type CategoryId, type ProductBadge, type ProductInput } from '@nazario/shared';
import { productInputSchema } from '@nazario/shared/schemas';
import { Button, IconButton } from '@/components/ui/Button';
import { CheckCard, Switch } from '@/components/ui/Choice';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Picture } from '@/components/ui/Picture';
import { productBadgeLabel } from '@/components/ui/Badge';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { centsToInput, parseMoney, slugify } from '@/lib/format';
import { toast } from '@/stores/ui';
import { adminApi } from './session';
import { useAdminCatalog } from './useAdminCatalog';
import { PageHeader, Panel } from './ui';

interface VariantDraft {
  id: string;
  label: string;
  detail: string;
  price: string;
}

const PRESETS: Record<CategoryId, VariantDraft[]> = {
  pizzas: [
    { id: 'p', label: 'Pequena', detail: '25 cm · 4 fatias', price: '' },
    { id: 'm', label: 'Média', detail: '30 cm · 6 fatias', price: '' },
    { id: 'g', label: 'Grande', detail: '35 cm · 8 fatias', price: '' },
  ],
  massas: [
    { id: 'individual', label: 'Individual', detail: 'Serve 1 pessoa', price: '' },
    { id: 'duo', label: 'Para dois', detail: 'Serve 2 pessoas', price: '' },
  ],
  bebidas: [{ id: 'un', label: 'Unidade', detail: '', price: '' }],
};

export default function ProductEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { data, error, load, set } = useAdminCatalog();
  const existing = data?.products.find((p) => p.id === id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<ProductInput, 'variants'>>();
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [ingredients, setIngredients] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) void load();
  }, [data, load]);

  // Initialize the form once the catalog is available.
  useEffect(() => {
    if (!data || form) return;
    if (existing) {
      const { id: _id, variants: v, ...rest } = existing;
      setForm(rest);
      setVariants(v.map((x) => ({ id: x.id, label: x.label, detail: x.detail ?? '', price: centsToInput(x.price) })));
      setIngredients(existing.ingredients.join(', '));
      setSlugTouched(true);
    } else if (isNew) {
      setForm({
        slug: '',
        categoryId: 'pizzas',
        name: '',
        shortDescription: '',
        description: '',
        ingredients: [],
        image: '',
        imageAlt: '',
        badges: [],
        featured: false,
        active: true,
        sortOrder: data.products.length,
        addonGroupIds: ['borda', 'extras-pizza'].filter((g) => data.addonGroups.some((x) => x.id === g)),
      });
      setVariants(PRESETS.pizzas);
    }
  }, [data, existing, isNew, form]);

  if (error && !data) return <ErrorState message={error} onRetry={() => void load()} />;
  if (data && !isNew && !existing) {
    return <ErrorState message="Produto não encontrado." onRetry={() => navigate('/admin/cardapio')} />;
  }
  if (!data || !form) return <Skeleton className="mx-auto h-[70vh] max-w-4xl rounded-[var(--radius-lg)]" />;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await adminApi.upload(file);
      update('image', url);
      toast({ tone: 'success', title: 'Foto enviada' });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Falha no envio da imagem' });
    } finally {
      setUploading(false);
    }
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...form!,
      image: form!.image || undefined,
      imageAlt: form!.imageAlt || undefined,
      ingredients: ingredients.split(',').map((s) => s.trim()).filter(Boolean),
      variants: variants.map((v, i) => ({
        id: v.id || `v${i + 1}`,
        label: v.label.trim(),
        detail: v.detail.trim() || undefined,
        price: parseMoney(v.price) ?? -1,
      })),
    };
    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === 'variants' ? 'variants' : String(issue.path[0]);
        next[key] ??= key === 'variants' ? 'Preencha nome e preço de cada tamanho.' : issue.message.startsWith('Too small') || issue.message.startsWith('Invalid') ? 'Campo obrigatório' : issue.message;
      }
      setErrors(next);
      toast({ tone: 'error', title: 'Revise os campos destacados' });
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await adminApi.createProduct(parsed.data);
        set((c) => ({ ...c, products: [...c.products, created] }));
        toast({ tone: 'success', title: `${created.name} criado` });
      } else {
        const updated = await adminApi.updateProduct(id!, parsed.data);
        set((c) => ({ ...c, products: c.products.map((p) => (p.id === id ? updated : p)) }));
        toast({ tone: 'success', title: 'Alterações salvas' });
      }
      navigate('/admin/cardapio');
    } catch (e) {
      toast({ tone: 'error', title: 'Não foi possível salvar', description: e instanceof ApiError ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl">
      <Link to="/admin/cardapio" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden /> Cardápio
      </Link>
      <PageHeader
        title={isNew ? 'Novo produto' : form.name || 'Editar produto'}
        actions={
          <>
            <Switch checked={form.active} onChange={(v) => update('active', v)} label={form.active ? 'Visível na loja' : 'Oculto da loja'} />
            <Button type="submit" loading={saving}>
              {isNew ? 'Criar produto' : 'Salvar'}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Informações">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" error={errors.name} className="sm:col-span-2">
                {(p) => (
                  <Input
                    {...p}
                    value={form.name}
                    onChange={(e) => {
                      update('name', e.target.value);
                      if (!slugTouched) update('slug', slugify(e.target.value));
                    }}
                  />
                )}
              </Field>
              <Field label="Categoria">
                {(p) => (
                  <Select
                    {...p}
                    value={form.categoryId}
                    onChange={(e) => {
                      const cat = e.target.value as CategoryId;
                      update('categoryId', cat);
                      if (isNew) setVariants(PRESETS[cat]);
                    }}
                  >
                    {CATEGORY_IDS.map((c) => (
                      <option key={c} value={c}>
                        {data.categories.find((x) => x.id === c)?.name ?? c}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Endereço (URL)" error={errors.slug} hint={`/produto/${form.slug || '…'}`}>
                {(p) => (
                  <Input
                    {...p}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      update('slug', slugify(e.target.value));
                    }}
                  />
                )}
              </Field>
              <Field label="Descrição curta" error={errors.shortDescription} hint="Aparece nos cards (até 120 caracteres)." className="sm:col-span-2">
                {(p) => <Input {...p} maxLength={120} value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />}
              </Field>
              <Field label="Descrição completa" optional className="sm:col-span-2">
                {(p) => <Textarea {...p} maxLength={600} rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} />}
              </Field>
              <Field label="Ingredientes" optional hint="Separe por vírgula." className="sm:col-span-2">
                {(p) => <Input {...p} value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Mozzarella, manjericão, tomate" />}
              </Field>
            </div>
          </Panel>

          <Panel
            title="Tamanhos e preços"
            action={
              variants.length < 6 && (
                <Button size="sm" variant="ghost" icon={<Plus className="size-4" aria-hidden />} onClick={() => setVariants((v) => [...v, { id: `v${Date.now().toString(36)}`, label: '', detail: '', price: '' }])}>
                  Adicionar
                </Button>
              )
            }
          >
            {errors.variants && (
              <p className="mb-3 text-sm font-medium text-tomato" role="alert">
                {errors.variants}
              </p>
            )}
            <ul className="space-y-3">
              {variants.map((v, i) => (
                <li key={v.id + i} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2 sm:grid-cols-[1fr_1.2fr_8rem_auto]">
                  <Field label={i === 0 ? 'Nome' : ' '} className="[&_label]:min-h-5">
                    {(p) => <Input {...p} aria-label={`Nome do tamanho ${i + 1}`} value={v.label} onChange={(e) => setVariants((all) => all.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />}
                  </Field>
                  <Field label={i === 0 ? 'Detalhe' : ' '} className="hidden sm:flex [&_label]:min-h-5">
                    {(p) => <Input {...p} aria-label={`Detalhe do tamanho ${i + 1}`} value={v.detail} placeholder="30 cm · 6 fatias" onChange={(e) => setVariants((all) => all.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} />}
                  </Field>
                  <Field label={i === 0 ? 'Preço (R$)' : ' '} className="[&_label]:min-h-5">
                    {(p) => (
                      <Input
                        {...p}
                        aria-label={`Preço do tamanho ${i + 1}`}
                        inputMode="decimal"
                        className="tabular"
                        value={v.price}
                        placeholder="0,00"
                        onChange={(e) => setVariants((all) => all.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                      />
                    )}
                  </Field>
                  <IconButton
                    label={`Remover tamanho ${v.label || i + 1}`}
                    className="mb-0.5"
                    disabled={variants.length === 1}
                    onClick={() => setVariants((all) => all.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Adicionais disponíveis">
            {data.addonGroups.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum grupo criado. <Link to="/admin/adicionais" className="font-semibold text-tomato">Criar adicionais</Link></p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.addonGroups.map((g) => (
                  <CheckCard
                    key={g.id}
                    checked={form.addonGroupIds.includes(g.id)}
                    onChange={(c) => update('addonGroupIds', c ? [...form.addonGroupIds, g.id] : form.addonGroupIds.filter((x) => x !== g.id))}
                    label={
                      <span>
                        {g.name}
                        <span className="block text-xs font-normal text-ink-muted">{g.options.length} opções · {g.id}</span>
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4 lg:sticky lg:top-8">
          <Panel title="Foto">
            <Picture src={form.image || undefined} alt={form.imageAlt || form.name} sizes="380px" className="aspect-square rounded-[var(--radius-md)]" />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              aria-label="Enviar foto do produto"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
                e.target.value = '';
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" loading={uploading} icon={<ImageUp className="size-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
              Enviar nova foto
            </Button>
            <Field label="ou URL da imagem" optional className="mt-3">
              {(p) => <Input {...p} value={form.image ?? ''} onChange={(e) => update('image', e.target.value)} placeholder="https://…" />}
            </Field>
            <Field label="Texto alternativo" optional hint="Descreva a foto para leitores de tela." className="mt-3">
              {(p) => <Input {...p} value={form.imageAlt ?? ''} onChange={(e) => update('imageAlt', e.target.value)} />}
            </Field>
          </Panel>

          <Panel title="Vitrine">
            <Switch checked={form.featured} onChange={(v) => update('featured', v)} label="Mostrar em “Os favoritos da Nazário”" />
            <p className="mt-5 mb-2 text-sm font-semibold text-ink">Selos</p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_BADGES.map((b) => {
                const on = form.badges.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && form.badges.length >= 4}
                    onClick={() => update('badges', (on ? form.badges.filter((x) => x !== b) : [...form.badges, b]) as ProductBadge[])}
                    className={cn('h-9 rounded-full border px-3.5 text-sm font-medium transition-colors', on ? 'border-ink bg-ink text-flour' : 'border-line text-ink-soft hover:border-ink/40')}
                  >
                    {productBadgeLabel(b)}
                  </button>
                );
              })}
            </div>
            <Field label="Ordem no cardápio" hint="Números menores aparecem primeiro." className="mt-5 max-w-40">
              {(p) => <Input {...p} type="number" inputMode="numeric" value={form.sortOrder} onChange={(e) => update('sortOrder', Number(e.target.value) || 0)} />}
            </Field>
          </Panel>
        </div>
      </div>
    </form>
  );
}
