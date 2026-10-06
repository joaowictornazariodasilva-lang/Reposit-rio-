import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import { assetUrl, EDITORIAL_WIDTHS, isOptimizedImage, PRODUCT_WIDTHS, srcSet } from '@/lib/images';
import { DEMO } from '@/lib/env';

interface PictureProps {
  src?: string;
  alt: string;
  sizes: string;
  kind?: 'product' | 'editorial';
  /** Intrinsic ratio to reserve space and avoid layout shift. */
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * AVIF → WebP responsive image with reserved space (no CLS), native lazy
 * loading and a soft fade-in. External URLs (admin uploads) render as-is.
 */
export function Picture({ src, alt, sizes, kind = 'product', width = 1, height = 1, priority, className, imgClassName }: PictureProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const widths = kind === 'editorial' ? EDITORIAL_WIDTHS : PRODUCT_WIDTHS;
  const img = cn(
    'size-full object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-out-soft)]',
    loaded || priority ? 'opacity-100' : 'opacity-0',
    imgClassName,
  );
  const common = {
    alt,
    width: width * 100,
    height: height * 100,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: priority ? ('sync' as const) : ('async' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
    onLoad: () => setLoaded(true),
    onError: () => setFailed(true),
    className: img,
  };

  return (
    <div className={cn('relative overflow-hidden bg-flour-deep', className)}>
      {!src || failed ? (
        <div className="grid size-full place-items-center text-ink-muted/60" role="img" aria-label={alt}>
          <UtensilsCrossed className="size-8" aria-hidden />
        </div>
      ) : isOptimizedImage(src) ? (
        <picture>
          {/* The demo bundle ships WebP only to stay light. */}
          {!DEMO && <source type="image/avif" srcSet={srcSet(src, 'avif', widths)} sizes={sizes} />}
          <source type="image/webp" srcSet={srcSet(src, 'webp', widths)} sizes={sizes} />
          <img src={`${assetUrl(src)}-${widths[1]}.webp`} {...common} />
        </picture>
      ) : (
        <img src={src} {...common} />
      )}
    </div>
  );
}
