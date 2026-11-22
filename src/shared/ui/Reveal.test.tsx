import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows content immediately when IntersectionObserver is unavailable', () => {
    render(<Reveal>Контент</Reveal>);
    expect(screen.getByText('Контент')).toHaveClass('reveal', 'is-revealed');
  });

  it('reveals content once it scrolls into view', async () => {
    let trigger: (entries: Partial<IntersectionObserverEntry>[]) => void = () => undefined;
    const unobserve = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          trigger = callback;
        }
        observe = vi.fn();
        unobserve = unobserve;
        disconnect = vi.fn();
      },
    );
    // A fresh module instance picks up the stubbed observer.
    vi.resetModules();
    const { Reveal: FreshReveal } = await import('./Reveal');
    render(<FreshReveal delay={70}>Карточка</FreshReveal>);
    const element = screen.getByText('Карточка');
    expect(element).not.toHaveClass('is-revealed');
    expect(element.style.getPropertyValue('--reveal-delay')).toBe('70ms');
    act(() => trigger([{ target: element, isIntersecting: true }]));
    expect(element).toHaveClass('is-revealed');
    expect(unobserve).toHaveBeenCalledWith(element);
  });
});
