import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { buildSeed } from '@/data/seed';
import { AuthDialog } from '@/features/auth/AuthDialog';
import { AppRoutes } from '@/app/routes';
import { useAppStore } from '@/store/appStore';

/** Fixed clock for deterministic demo data in tests. */
export const TEST_NOW = new Date('2026-11-20T12:00:00.000Z');

export function resetStore(userId: string | null = null) {
  useAppStore.setState({ db: buildSeed(TEST_NOW), session: { userId } });
}

export function renderApp(path = '/', { userId = null }: { userId?: string | null } = {}) {
  resetStore(userId);
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <AuthDialog />
    </MemoryRouter>,
  );
  return { user, ...utils };
}
