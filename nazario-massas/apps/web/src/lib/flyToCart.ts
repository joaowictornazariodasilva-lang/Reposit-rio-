/**
 * Sends a copy of the product photo into the header cart (Web Animations API,
 * transform + opacity only). Silently does nothing without a visible source/target
 * or when the visitor prefers reduced motion.
 */
export function flyToCart(from?: Element | null) {
  if (!from || typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = from.closest('[data-fly-root]')?.querySelector('img');
  const target = document.querySelector('[data-cart-target]');
  if (!img || !target || !img.currentSrc) return;

  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !b.width) return;

  const size = Math.min(a.width, a.height, 160);
  const startX = a.left + a.width / 2 - size / 2;
  const startY = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - (startX + size / 2);
  const dy = b.top + b.height / 2 - (startY + size / 2);

  const ghost = document.createElement('img');
  ghost.src = img.currentSrc;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '999px',
    zIndex: '120',
    pointerEvents: 'none',
    boxShadow: '0 18px 40px -12px rgb(28 23 20 / 0.45)',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(ghost);

  // Arc: rise first, then dive into the bag.
  const lift = Math.min(120, Math.abs(dy) * 0.35 + 40);
  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.3 - lift}px) scale(0.6)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' },
  );
  const cleanup = () => ghost.remove();
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}
