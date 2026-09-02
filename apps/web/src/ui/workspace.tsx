import { AlertTriangle, Search, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from './cn';
import { Input } from './primitives';

interface WorkspaceHeaderProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function WorkspaceHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: WorkspaceHeaderProps) {
  return (
    <header className={cn('flex min-w-0 items-start gap-2.5 px-1', className)}>
      {Icon !== undefined && (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
          <Icon size={14} strokeWidth={1.7} aria-hidden="true" />
        </span>
      )}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h1 className="m-0 text-[15px] font-semibold tracking-[-0.02em] text-cs-text">{title}</h1>
        {description !== undefined && (
          <div className="text-[10px] leading-4 text-cs-muted">{description}</div>
        )}
      </div>
      {actions !== undefined && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

interface InlineFeedbackProps {
  children: ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
}

export function InlineFeedback({ children, tone = 'neutral', className }: InlineFeedbackProps) {
  const danger = tone === 'danger';
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border p-2 text-[9px] leading-4',
        danger
          ? 'border-red-500/20 bg-red-500/[0.06] text-cs-danger'
          : 'border-cs-border bg-cs-surface text-cs-muted',
        className,
      )}
      role={danger ? 'alert' : 'status'}
    >
      {danger && <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  'aria-label': string;
  className?: string;
}

export function SearchField({
  value,
  onValueChange,
  placeholder,
  'aria-label': ariaLabel,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cs-subtle"
        size={11}
        aria-hidden="true"
      />
      <Input
        className="w-full pl-6 pr-2"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </div>
  );
}
