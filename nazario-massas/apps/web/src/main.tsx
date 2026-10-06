import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LazyMotion, MotionConfig } from 'motion/react';
// Only the axes we use (weight + SOFT): ~60% lighter than the full variable font.
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/fraunces/soft-italic.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './styles/index.css';
import App from './App';
import { Toaster } from './components/ui/Toaster';
import './stores/catalog';

const loadMotionFeatures = () => import('./lib/motion-features').then((m) => m.default);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* LazyMotion + `m` components keep Motion's footprint small; reducedMotion respects the OS setting. */}
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
