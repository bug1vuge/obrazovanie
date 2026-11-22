import { useEffect } from 'react';
import { lockScroll } from '@/shared/lib/scrollLock';

/** Locks page scroll while `active` is true. */
export function useScrollLock(active: boolean) {
  useEffect(() => (active ? lockScroll() : undefined), [active]);
}
