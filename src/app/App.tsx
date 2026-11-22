import { HashRouter } from 'react-router-dom';
import { AuthDialog } from '@/features/auth/AuthDialog';
import { AppRoutes } from './routes';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Hash routing keeps deep links working on static hosting (GitHub Pages)
 * without server-side rewrites.
 */
export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
        <AuthDialog />
      </HashRouter>
    </ErrorBoundary>
  );
}
