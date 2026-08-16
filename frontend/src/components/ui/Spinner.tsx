import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Variants ─────────────────────────────────────────────────────────────────
const spinnerVariants = cva("animate-spin rounded-full border-2 shrink-0", {
  variants: {
    size: {
      xs: "w-3 h-3",
      sm: "w-4 h-4",
      md: "w-6 h-6 border-[3px]",
      lg: "w-8 h-8 border-[3px]",
      xl: "w-12 h-12 border-4",
    },
    color: {
      blue:  "border-blue-600 border-t-transparent",
      white: "border-white border-t-transparent",
      gray:  "border-gray-400 border-t-transparent",
      green: "border-green-600 border-t-transparent",
    },
  },
  defaultVariants: {
    size: "md",
    color: "blue",
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────
export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  /** Screen-reader label */
  label?: string;
  className?: string;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({
  className,
  size,
  color,
  label = "Loading...",
  ...props
}: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)} {...props}>
      <span className={cn(spinnerVariants({ size, color }))} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Full-page / section overlay spinner ─────────────────────────────────────
export interface PageSpinnerProps {
  /** Text shown below the spinner */
  message?: string;
  /** Fill the entire viewport (default) vs. fill the nearest relative container */
  fullPage?: boolean;
}

export function PageSpinner({
  message = "Loading...",
  fullPage = true,
}: PageSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm z-50",
        fullPage ? "fixed inset-0" : "absolute inset-0 rounded-lg"
      )}
    >
      <Spinner size="xl" color="blue" label={message} />
      {message && (
        <p className="text-sm text-gray-500 font-medium" aria-hidden="true">
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Inline loading row (e.g. inside a button-less section) ──────────────────
export function InlineSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-8 text-gray-400"
    >
      <Spinner size="sm" color="gray" label={message} />
      <span className="text-sm" aria-hidden="true">{message}</span>
    </div>
  );
}
