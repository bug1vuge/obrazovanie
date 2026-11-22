/**
 * Reference-counted page scroll lock for dialogs, drawers and popovers.
 *
 * The lock toggles `overflow: hidden` on <html>. Because <html> has
 * `scrollbar-gutter: stable`, the scrollbar space stays reserved and the
 * page does not shift sideways ("jump") when the scrollbar disappears.
 */
let locks = 0;

export function lockScroll(): () => void {
  locks += 1;
  if (locks === 1) document.documentElement.classList.add('scroll-locked');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.documentElement.classList.remove('scroll-locked');
  };
}

export const isScrollLocked = () => locks > 0;
