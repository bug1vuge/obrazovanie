import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { routes } from './routes';

/**
 * Hash routing keeps deep links working on static hosting (GitHub Pages)
 * without server-side rewrites.
 */
const router = createHashRouter(routes);

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
