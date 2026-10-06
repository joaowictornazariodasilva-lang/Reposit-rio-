import { useLocation, useNavigate, useParams, Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { startingPrice } from '@nazario/shared';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';
import { useSeo } from '@/lib/seo';
import { useCatalog } from '@/stores/catalog';
import { ProductConfigurator } from './ProductConfigurator';

function useProduct() {
  const { slug } = useParams();
  const { status, data, error, load } = useCatalog();
  const product = data?.products.find((p) => p.slug === slug);
  return { product, status, error, load, category: data?.categories.find((c) => c.id === product?.categoryId) };
}

/** Rendered over the menu when navigated from inside the app. */
export function ProductSheet() {
  const navigate = useNavigate();
  const { product, status } = useProduct();
  const close = () => navigate(-1);

  return (
    <Dialog open={status !== 'loading'} onClose={close} title={product?.name ?? 'Produto'} hideTitle placement="sheet" className="[--dialog-width:62rem]">
      <DialogClose onClose={close} className="absolute top-3 right-3 z-20" />
      {product ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:overflow-hidden">
          <ProductConfigurator product={product} layout="sheet" onAdded={close} />
        </div>
      ) : (
        <EmptyState title="Produto indisponível" description="Este item saiu do cardápio." />
      )}
    </Dialog>
  );
}

/** Direct visit / shared link: a full, indexable product page. */
export function ProductPage() {
  const { product, category, status, error, load } = useProduct();
  const location = useLocation();

  useSeo({
    title: product ? `${product.name}${category ? ` — ${category.name}` : ''}` : 'Produto',
    description: product?.description || product?.shortDescription,
    path: location.pathname,
    image: product?.image ? `${product.image}-1200.webp` : undefined,
    jsonLd: product && {
      '@context': 'https://schema.org',
      '@type': 'MenuItem',
      name: product.name,
      description: product.description || product.shortDescription,
      image: product.image ? `https://nazariomassas.com.br${product.image}-1200.webp` : undefined,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        lowPrice: (startingPrice(product) / 100).toFixed(2),
        highPrice: (Math.max(...product.variants.map((v) => v.price)) / 100).toFixed(2),
      },
      suitableForDiet: product.badges.includes('vegetariano') ? 'https://schema.org/VegetarianDiet' : undefined,
    },
  });

  return (
    <div className="container-page pt-24 pb-24 sm:pt-28">
      <Link to={category ? `/cardapio/${category.id}` : '/cardapio'} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden /> {category ? category.name : 'Cardápio'}
      </Link>
      {status === 'error' ? (
        <ErrorState message={error ?? ''} onRetry={() => void load(true)} />
      ) : product ? (
        <ProductConfigurator product={product} layout="page" />
      ) : status === 'ready' ? (
        <EmptyState
          title="Produto não encontrado"
          description="Ele pode ter saído do cardápio. Veja as outras opções da casa."
          action={<ButtonLink to="/cardapio">Ver cardápio</ButtonLink>}
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-[var(--radius-xl)]" />
          <div className="space-y-4">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="mt-8 h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
