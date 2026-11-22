import { useCallback } from 'react';
import { useCurrentUser } from '@/store/hooks';
import { useAuthDialog } from './authDialogStore';

/** Returns a guard: `true` when signed in, otherwise opens the sign-in dialog. */
export function useRequireAuth() {
  const user = useCurrentUser();
  const open = useAuthDialog((state) => state.open);
  return useCallback(() => {
    if (user) return true;
    open();
    return false;
  }, [user, open]);
}
