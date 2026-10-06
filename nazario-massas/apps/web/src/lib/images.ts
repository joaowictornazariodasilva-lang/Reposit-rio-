/** Keep in sync with scripts/fetch-images.mjs */
export const PRODUCT_WIDTHS = [400, 800, 1200] as const;
export const EDITORIAL_WIDTHS = [640, 1280, 1920] as const;

/** Local optimized assets look like "/images/pizza-margherita" (no extension). */
export function isOptimizedImage(src: string): boolean {
  return src.startsWith('/images/') && !/\.[a-z]{3,4}$/i.test(src);
}

export function srcSet(base: string, format: 'avif' | 'webp', widths: readonly number[]): string {
  return widths.map((w) => `${base}-${w}.${format} ${w}w`).join(', ');
}
