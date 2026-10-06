// Must run first: in the demo build it answers /api calls inside the browser (a no-op stub otherwise).
import '@/demo/install';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router';
import { DEMO } from './lib/env';
import { LazyMotion, MotionConfig } from 'motion/react';
// Only the axes we use (weight + SOFT): ~60% lighter than the full variable font.
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './styles/index.css';
import App from './App';
import { Toaster } from './components/ui/Toaster';
import './stores/catalog';

/**
 * Demo is a static page: routes live in the hash (#/cardapio) so the browser's back button
 * walks through them. A bare `#admin` (the owner's private link) is normalised to `#/admin`.
 */
function Router({ children }: { children: React.ReactNode }) {
  if (!DEMO) return <BrowserRouter>{children}</BrowserRouter>;
  if (location.hash && !location.hash.startsWith('#/')) {
    history.replaceState(null, '', `#/${location.hash.slice(1)}`);
  }
  return <HashRouter>{children}</HashRouter>;
}

const loadMotionFeatures = () => import('./lib/motion-features').then((m) => m.default);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* LazyMotion + `m` components keep Motion's footprint small; reducedMotion respects the OS setting. */}
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <Router>
          <App />
        </Router>
        <Toaster />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
