import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { cn } from '@/shared/lib/cn';

/** Side panel sliding in from the right; locks page scroll and traps focus. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);
  useFocusTrap(panelRef, open, onClose);
  if (!open) return null;

  return createPortal(
    <div
      className={cn('modal-backdrop fixed inset-0 z-50 flex bg-black/50', className)}
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
        className="drawer-panel surface ml-auto flex h-full w-[86%] max-w-sm flex-col shadow-2xl outline-none"
      >
        <div className="hairline-b flex shrink-0 items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
          <span id={titleId} className="font-display text-[14px]">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover-dim rounded-full p-2"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
