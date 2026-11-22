import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { buildSeed } from '@/data/seed';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import { useAppStore } from '@/store/appStore';

/** Fixed clock for deterministic demo data in tests. */
export const TEST_NOW = new Date('2026-11-20T12:00:00.000Z');

export function resetStore(userId: string | null = null) {
  useAppStore.setState({ db: buildSeed(TEST_NOW), session: { userId } });
  useAuthDialog.setState({ isOpen: false });
}

export function renderApp(path = '/', { userId = null }: { userId?: string | null } = {}) {
  resetStore(userId);
  const user = userEvent.setup();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(<RouterProvider router={router} />);
  return { user, router, ...utils };
}
