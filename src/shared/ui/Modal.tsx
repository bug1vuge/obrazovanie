import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { cn } from '@/shared/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/**
 * Bottom sheet on phones, centred dialog on larger screens. Locks page scroll
 * without a layout shift, traps focus and closes on Escape or backdrop click.
 */
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
  useScrollLock(open);
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'modal-panel surface flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl',
          maxWidth,
        )}
      >
        <div className="hairline-b flex shrink-0 items-center justify-between gap-3 px-5 py-4">
          <h3 id={titleId} className="font-display min-w-0 text-[15px]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="hover-dim -mr-2 shrink-0 rounded-full p-2"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && (
          <div className="hairline-t shrink-0 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
