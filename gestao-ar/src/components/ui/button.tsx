import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-xs hover:bg-primary-hover",
        accent: "bg-accent text-accent-fg shadow-xs hover:bg-accent-hover",
        secondary: "border border-border bg-surface text-fg shadow-xs hover:border-border-strong hover:bg-surface-2",
        ghost: "text-fg-muted hover:bg-surface-3 hover:text-fg",
        danger: "bg-danger text-white shadow-xs hover:opacity-90 dark:text-[#1a0503]",
        soft: "bg-primary-soft text-primary-soft-fg hover:brightness-95 dark:hover:brightness-125",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs sm:h-8",
        md: "h-11 px-4 text-sm sm:h-9",
        lg: "h-12 px-5 text-base sm:h-11",
        icon: "size-11 sm:size-9",
        "icon-sm": "size-9 sm:size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; carregando?: boolean };

export function Button({ className, variant, size, asChild, carregando, children, disabled, ...props }: Props) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {carregando ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {children}
        </>
      )}
    </Comp>
  );
}
