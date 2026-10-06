import { Link } from 'react-router';
import { Clock, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useCatalog } from '@/stores/catalog';

export function SiteFooter() {
  const settings = useCatalog((s) => s.data?.settings);
  const year = new Date().getFullYear();

  return (
    <footer className="grain grain-dark mt-auto bg-oven text-flour">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <Logo tone="light" />
          <p className="mt-6 max-w-sm font-display text-2xl leading-snug text-flour/90">
            Massa lenta, forno quente e ingredientes que valem a espera.
          </p>
        </div>

        <div>
          <h2 className="eyebrow text-olive">Visite</h2>
          <ul className="mt-5 space-y-4 text-sm text-ash">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-flour" aria-hidden />
              {settings?.address ?? 'Vila Madalena, São Paulo · SP'}
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-flour" aria-hidden />
              {settings?.hours ?? 'Terça a domingo, 18h às 23h30'}
            </li>
            {settings?.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-flour" aria-hidden />
                <a className="link-underline hover:text-flour" href={`tel:+55${settings.phone.replace(/\D/g, '')}`}>
                  {settings.phone}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow text-olive">Cardápio</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              ['/cardapio/pizzas', 'Pizzas'],
              ['/cardapio/massas', 'Massas'],
              ['/cardapio/bebidas', 'Bebidas'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to!} className="link-underline text-ash hover:text-flour">
                  {label}
                </Link>
              </li>
            ))}
            {settings?.whatsapp && (
              <li>
                <a
                  className="link-underline text-ash hover:text-flour"
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fale conosco no WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-oven-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ash sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Nazário Massas. Todos os direitos reservados.</p>
          <Link to="/admin" className="link-underline w-fit hover:text-flour">
            Área do restaurante
          </Link>
        </div>
      </div>
    </footer>
  );
}
