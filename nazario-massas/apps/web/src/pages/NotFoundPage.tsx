import { ButtonLink } from '@/components/ui/Button';
import { useSeo } from '@/lib/seo';

export default function NotFoundPage() {
  useSeo({ title: 'Página não encontrada', noindex: true });
  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center pt-24 text-center">
      <p className="eyebrow text-tomato">Erro 404</p>
      <h1 className="mt-4 font-display text-6xl tracking-[-0.035em] text-ink sm:text-7xl">Essa página não saiu do forno.</h1>
      <p className="mt-5 max-w-md text-ink-soft">O endereço pode ter mudado. Mas o cardápio continua quentinho.</p>
      <ButtonLink to="/cardapio" size="lg" className="mt-8">
        Ver cardápio
      </ButtonLink>
    </div>
  );
}
