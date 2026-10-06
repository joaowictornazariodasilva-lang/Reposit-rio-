/** Keep in sync with scripts/fetch-images.mjs */
export const PRODUCT_WIDTHS = [400, 800, 1200] as const;
export const EDITORIAL_WIDTHS = [640, 1280, 1920] as const;

/** Local optimized assets look like "/images/pizza-margherita" (no extension). */
export function isOptimizedImage(src: string): boolean {
  return src.startsWith('/images/') && !/\.[a-z]{3,4}$/i.test(src);
}

/** Resolves "/images/…" against the deploy base (the demo build is served from a sub-path). */
export function assetUrl(path: string): string {
  return path.startsWith('/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
}

export function srcSet(base: string, format: 'avif' | 'webp', widths: readonly number[]): string {
  return widths.map((w) => `${assetUrl(base)}-${w}.${format} ${w}w`).join(', ');
}
