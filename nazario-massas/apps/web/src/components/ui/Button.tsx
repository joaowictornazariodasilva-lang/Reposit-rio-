import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outline-light' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] ' +
  'transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-soft)] ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-offset-2';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-tomato text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-10px_rgb(180_50_31/0.7)] hover:bg-tomato-deep',
  secondary: 'border border-ink/15 bg-paper text-ink hover:border-ink/40 hover:bg-white',
  ghost: 'text-ink hover:bg-ink/[0.06]',
  light: 'bg-flour text-ink hover:bg-white',
  'outline-light': 'border border-flour/30 text-flour hover:border-flour/70 hover:bg-flour/[0.06]',
  danger: 'border border-tomato/30 bg-paper text-tomato hover:bg-tomato hover:text-white',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-14 px-7 text-base',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, typeof className === 'string' ? className : undefined)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'light' | 'solid';
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = 'default', size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-90 disabled:opacity-40',
        size === 'md' ? 'size-11' : 'size-9',
        tone === 'default' && 'text-ink hover:bg-ink/[0.07]',
        tone === 'light' && 'text-flour hover:bg-flour/10',
        tone === 'solid' && 'bg-paper text-ink shadow-soft hover:bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
