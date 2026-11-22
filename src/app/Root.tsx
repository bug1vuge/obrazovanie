import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AuthDialog } from '@/features/auth/AuthDialog';

/** Root of every screen: scroll restoration (top on navigation, saved on back) and global dialogs. */
export function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      <AuthDialog />
    </>
  );
}
