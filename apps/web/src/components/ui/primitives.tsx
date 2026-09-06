import { Check, ChevronDown } from 'lucide-react';
import {
  Checkbox as RadixCheckbox,
  Select as RadixSelect,
  Slot,
  Tabs as RadixTabs,
} from 'radix-ui';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-cs-primary bg-cs-primary text-cs-primary-contrast hover:opacity-90',
  secondary: 'border-cs-border bg-cs-control text-cs-text hover:bg-cs-hover',
  ghost:
    'border-transparent bg-transparent text-cs-muted hover:bg-cs-hover hover:text-cs-text',
  danger:
    'border-cs-danger-border bg-cs-danger-surface text-cs-danger hover:brightness-110',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[11px]',
  md: 'h-9 px-3 text-[11px]',
  icon: 'size-8 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'secondary',
      size = 'sm',
      className,
      type = 'button',
      asChild = false,
      children,
      ...props
    },
    ref,
  ) {
    const classes = cn(
      'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[5px] border font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-focus/70 disabled:pointer-events-none disabled:opacity-45',
      buttonVariantClasses[variant],
      buttonSizeClasses[size],
      className,
    );

    if (asChild) {
      return (
        <Slot.Root ref={ref} className={classes} {...props}>
          {children}
        </Slot.Root>
      );
    }

    return (
      <button ref={ref} type={type} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function IconButton({ className, ...props }, ref) {
    return (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        className={className}
        {...props}
      />
    );
  },
);

const controlClass =
  'h-8 min-w-0 rounded-[3px] border border-cs-border bg-cs-control px-2.5 text-[11px] text-cs-text outline-none transition-colors duration-100 placeholder:text-cs-subtle focus:border-cs-focus focus:ring-2 focus:ring-cs-focus/25 disabled:cursor-not-allowed disabled:opacity-50';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClass, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-w-0 rounded-[3px] border border-cs-border bg-cs-control px-2.5 py-2 text-[11px] leading-5 text-cs-text outline-none transition-colors duration-100 placeholder:text-cs-subtle focus:border-cs-focus focus:ring-2 focus:ring-cs-focus/25 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  'aria-label': string;
}

const EMPTY_SELECT_VALUE = '__codeflow_empty_select_value__';

function radixValue(value: string): string {
  return value === '' ? EMPTY_SELECT_VALUE : value;
}

export const Select = ({
  value,
  options,
  onValueChange,
  className,
  disabled = false,
  'aria-label': ariaLabel,
}: SelectProps) => (
  <RadixSelect.Root
    value={radixValue(value)}
    disabled={disabled}
    onValueChange={(next) =>
      onValueChange(next === EMPTY_SELECT_VALUE ? '' : next)
    }
  >
    <RadixSelect.Trigger
      aria-label={ariaLabel}
      className={cn(
        controlClass,
        'inline-flex w-full items-center justify-between gap-2 pr-2.5 text-left',
        className,
      )}
    >
      <RadixSelect.Value />
      <RadixSelect.Icon className="shrink-0 text-cs-muted">
        <ChevronDown size={12} aria-hidden="true" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
    <RadixSelect.Portal>
      <RadixSelect.Content
        position="popper"
        sideOffset={4}
        className="z-[80] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[6px] border border-cs-border bg-cs-panel p-1.5 text-cs-text shadow-[var(--shadow-overlay)]"
      >
        <RadixSelect.Viewport>
          {options.map((option) => (
            <RadixSelect.Item
              key={option.value}
              value={radixValue(option.value)}
              disabled={option.disabled ?? false}
              className="relative flex h-8 cursor-default select-none items-center rounded-[4px] px-7 pr-2.5 text-[11px] text-cs-muted outline-none data-[highlighted]:bg-cs-hover data-[highlighted]:text-cs-text data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
            >
              <RadixSelect.ItemIndicator className="absolute left-2.5 grid place-items-center text-cs-text">
                <Check size={11} aria-hidden="true" />
              </RadixSelect.ItemIndicator>
              <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
            </RadixSelect.Item>
          ))}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  </RadixSelect.Root>
);

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  'aria-label': string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  disabled = false,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-[3px] border border-cs-border bg-cs-control text-cs-text outline-none transition-colors duration-100 hover:bg-cs-hover focus-visible:ring-2 focus-visible:ring-cs-focus/70 data-[state=checked]:border-cs-primary data-[state=checked]:bg-cs-primary data-[state=checked]:text-cs-primary-contrast disabled:opacity-45',
        className,
      )}
      onCheckedChange={(next) => onCheckedChange(next === true)}
    >
      <RadixCheckbox.Indicator>
        <Check size={11} strokeWidth={2.2} aria-hidden="true" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[6px] border border-cs-border bg-cs-panel',
        className,
      )}
      {...props}
    />
  );
}

export function SectionLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-[10px] font-medium text-cs-muted', className)}
      {...props}
    />
  );
}

export function Muted({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-cs-muted', className)} {...props} />;
}

export function Tabs(props: ComponentPropsWithoutRef<typeof RadixTabs.Root>) {
  return <RadixTabs.Root {...props} />;
}

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('flex min-w-0 gap-0 border-b border-cs-border', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'relative h-8 min-w-0 px-2.5 text-[11px] font-medium text-cs-muted outline-none transition-colors duration-100 hover:text-cs-text focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cs-focus/70 data-[state=active]:text-cs-text data-[state=active]:after:absolute data-[state=active]:after:inset-x-2.5 data-[state=active]:after:bottom-0 data-[state=active]:after:h-px data-[state=active]:after:bg-cs-focus',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn(
        'min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cs-focus/70',
        className,
      )}
      {...props}
    />
  );
}
