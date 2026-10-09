import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-[#2F47CC]",
        secondary: "bg-white text-ink ring-1 ring-inset ring-border hover:bg-spaceMist/60",
        soft: "bg-spaceMist text-blueInk hover:bg-[#DDE2FF]",
        ghost: "text-ink hover:bg-ink/5",
        whatsapp: "bg-whatsapp text-white hover:bg-[#157540]",
        danger: "text-destructive hover:bg-destructive/10",
        ink: "bg-ink text-white hover:bg-black",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[0.95rem]",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 px-0",
        iconLg: "h-12 w-12 px-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Estado de carga único para todos los botones: spinner al inicio, deshabilitado y con aria-busy. */
  loading?: boolean;
  /** Texto mientras carga (por ejemplo «Guardando…»). Si no se da, se queda el texto normal. */
  loadingText?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, loading, loadingText, children, disabled, ...props }, ref) => {
  if (asChild) return <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Slot>;
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {/* En botones de solo ícono el spinner reemplaza al ícono. */}
      {loading && (size === "icon" || size === "iconLg") ? null : loading && loadingText !== undefined ? loadingText : children}
    </button>
  );
});
Button.displayName = "Button";

export { buttonVariants };
