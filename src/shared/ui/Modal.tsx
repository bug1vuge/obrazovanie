import { X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/** Bottom sheet on mobile, centred dialog on desktop (as in the original design). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      '[autofocus], input, textarea, select',
    );
    (focusTarget ?? panelRef.current)?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'surface flex max-h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl outline-none md:rounded-3xl',
          maxWidth,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hairline-b flex shrink-0 items-center justify-between px-5 py-4">
          <h3 id={titleId} className="font-display text-[15px]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="hover-dim -mr-2 rounded-full p-2"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="hairline-t shrink-0 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
