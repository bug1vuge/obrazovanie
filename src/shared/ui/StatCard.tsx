import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="card p-4">
      <Icon size={15} className="muted" aria-hidden />
      <p className="font-display mt-1.5 text-xl leading-none">{value}</p>
      <p className="muted mt-1 text-[11.5px]">{label}</p>
      {hint && <div className="mt-1.5 text-[11.5px]">{hint}</div>}
    </div>
  );
}
