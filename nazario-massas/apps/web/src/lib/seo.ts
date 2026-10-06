import { useEffect } from 'react';

const SITE = 'https://nazariomassas.com.br';
const DEFAULT_TITLE = 'Nazário Massas — Pizzas de fermentação natural e massas frescas';

interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: object;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Per-route title, description, canonical, Open Graph and structured data. */
export function useSeo({ title, description, path, image, noindex, jsonLd }: SeoOptions) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const fullTitle = title ? `${title} · Nazário Massas` : DEFAULT_TITLE;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
    if (path !== undefined) {
      const url = `${SITE}${path}`;
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', url);
      setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    }
    if (image) setMeta('meta[property="og:image"]', 'property', 'og:image', `${SITE}${image}`);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    let script: HTMLScriptElement | undefined;
    if (jsonLdText) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.route = 'true';
      script.textContent = jsonLdText;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, path, image, noindex, jsonLdText]);
}
