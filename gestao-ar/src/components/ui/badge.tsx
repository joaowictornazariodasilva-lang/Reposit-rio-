import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-medium leading-5 [&_svg]:size-3",
  {
    variants: {
      tom: {
        neutro: "bg-surface-3 text-fg-muted",
        primario: "bg-primary-soft text-primary-soft-fg",
        acento: "bg-accent-soft text-accent-soft-fg",
        sucesso: "bg-success-soft text-success",
        alerta: "bg-warning-soft text-warning",
        perigo: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        contorno: "border border-border text-fg-muted",
      },
    },
    defaultVariants: { tom: "neutro" },
  },
);

export type Tom = NonNullable<VariantProps<typeof badgeVariants>["tom"]>;

export function Badge({ className, tom, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tom }), className)} {...props} />;
}
