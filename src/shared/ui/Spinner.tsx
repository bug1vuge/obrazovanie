import { LoaderCircle } from 'lucide-react';

export function Spinner({ label = 'Загружаем…' }: { label?: string }) {
  return (
    <div role="status" className="muted flex items-center justify-center gap-2 py-16 text-sm">
      <LoaderCircle size={18} className="animate-spin" aria-hidden />
      {label}
    </div>
  );
}
