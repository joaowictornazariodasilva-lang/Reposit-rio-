// Must run first: in the demo build it answers /api calls inside the browser (a no-op stub otherwise).
import '@/demo/install';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router';
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

/** Demo runs inside a sandboxed frame: keep routing in memory; a bare `#admin` link opens the panel. */
function Router({ children }: { children: React.ReactNode }) {
  if (!DEMO) return <BrowserRouter>{children}</BrowserRouter>;
  const start = location.hash.replace(/^#\/?/, '');
  return <MemoryRouter initialEntries={[start ? `/${start}` : '/']}>{children}</MemoryRouter>;
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
