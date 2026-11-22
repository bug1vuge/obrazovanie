import { Check, ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

const GAP = 6;
const MAX_HEIGHT = 300;
const VIEWPORT_MARGIN = 12;

/**
 * Accessible single-select styled like the rest of the site (the native
 * dropdown list cannot be styled). Implements the ARIA combobox/listbox
 * pattern: arrows, Home/End, Enter/Space, Escape, Tab and type-ahead.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  id,
  className,
  disabled,
  ...aria
}: SelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const listId = `${generatedId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<Position | null>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = rect.top - VIEWPORT_MARGIN;
    const placement = below < 180 && above > below ? 'top' : 'bottom';
    const space = placement === 'bottom' ? below : above;
    const width = Math.max(rect.width, 180);
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    setPosition({
      top: placement === 'bottom' ? rect.bottom + GAP : rect.top - GAP,
      left,
      width,
      maxHeight: Math.max(120, Math.min(MAX_HEIGHT, space - GAP)),
      placement,
    });
  }, []);

  const openList = (index = selectedIndex) => {
    if (disabled) return;
    setActive(index);
    place();
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus({ preventScroll: true });
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!listRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const findByText = (key: string) => {
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.at > 700 ? key : state.text + key;
    state.at = now;
    const query = state.text.toLowerCase();
    const start = open ? active : selectedIndex;
    const ordered = [...options.slice(start + 1), ...options.slice(0, start + 1)];
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(query));
    return match ? options.indexOf(match) : -1;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (open) setActive((index) => Math.min(last, index + 1));
        else openList();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) setActive((index) => Math.max(0, index - 1));
        else openList();
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActive(last);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case 'Escape':
        if (open) {
          // Keep an enclosing dialog open: only the list closes.
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        if (open) close(false);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const index = findByText(event.key);
          if (index >= 0) {
            if (open) setActive(index);
            else if (options[index]) onChange(options[index].value);
          }
        }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          'inp flex items-center justify-between gap-2 text-left disabled:opacity-50',
          open &&
            'border-[rgb(var(--color-primary)/0.55)] shadow-[0_0_0_3px_rgb(var(--color-primary)/0.14)]',
          className,
        )}
        {...aria}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ''}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn('muted shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open &&
        position &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            tabIndex={-1}
            className="popover surface bd fixed z-[60] overflow-y-auto overscroll-contain rounded-2xl p-1.5 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)]"
            style={{
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              ...(position.placement === 'bottom'
                ? { top: position.top }
                : { top: position.top, transform: 'translateY(-100%)' }),
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors',
                    index === active && 'soft-bg',
                    isSelected && 'font-semibold',
                  )}
                >
                  <span className="min-w-0">{option.label}</span>
                  {isSelected && (
                    <Check size={15} className="shrink-0 text-secondary" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
