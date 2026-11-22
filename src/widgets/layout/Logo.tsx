import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Study Pro — на главную">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
        style={{
          background:
            'linear-gradient(140deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
        }}
      >
        <GraduationCap size={19} aria-hidden />
      </span>
      {!compact && <span className="font-display text-[17px] tracking-tight">Study Pro</span>}
    </Link>
  );
}
