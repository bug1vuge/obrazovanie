import { create } from 'zustand';

interface AuthDialogState {
  isOpen: boolean;
  /**
   * `true` when sign-in was requested by an action on the current page (buy,
   * enroll…): after signing in the visitor stays there to finish it.
   */
  stayOnPage: boolean;
  /** Opened from «Войти»: after signing in the visitor goes to the cabinet. */
  open: () => void;
  /** Opened by an action that needs an account. */
  openForAction: () => void;
  close: () => void;
}

export const useAuthDialog = create<AuthDialogState>()((set) => ({
  isOpen: false,
  stayOnPage: false,
  open: () => set({ isOpen: true, stayOnPage: false }),
  openForAction: () => set({ isOpen: true, stayOnPage: true }),
  close: () => set({ isOpen: false }),
}));
