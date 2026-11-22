import { describe, expect, it } from 'vitest';
import { isScrollLocked, lockScroll } from './scrollLock';

describe('scrollLock', () => {
  it('is reference counted and releases each lock only once', () => {
    const html = document.documentElement;
    const first = lockScroll();
    const second = lockScroll();
    expect(html).toHaveClass('scroll-locked');
    first();
    first();
    expect(isScrollLocked()).toBe(true);
    second();
    expect(isScrollLocked()).toBe(false);
    expect(html).not.toHaveClass('scroll-locked');
  });
});
