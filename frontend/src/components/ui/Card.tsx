import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ─── Card (container) ─────────────────────────────────────────────────────────
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift the card on hover — useful for clickable job cards */
  hoverable?: boolean;
  /** Remove all padding (useful when Card wraps a full-bleed image) */
  noPadding?: boolean;
  /** Render a subtle selected/active ring */
  selected?: boolean;
}

export function Card({
  className,
  hoverable = false,
  noPadding = false,
  selected = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        // Base — TopCV-inspired: white bg, gray-200 border, soft shadow
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        // Padding
        !noPadding && "p-5",
        // Hoverable state
        hoverable && [
          "transition-all duration-200 cursor-pointer",
          "hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5",
        ],
        // Selected state
        selected && "border-primary ring-2 ring-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a bottom border separating header from body */
  withDivider?: boolean;
}

export function CardHeader({
  className,
  withDivider = false,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        withDivider && "pb-4 mb-4 border-b border-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardTitle ────────────────────────────────────────────────────────────────
export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-gray-900 leading-snug", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─── CardDescription ─────────────────────────────────────────────────────────
export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-gray-500 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// ─── CardContent ──────────────────────────────────────────────────────────────
export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-gray-700", className)} {...props}>
      {children}
    </div>
  );
}

// ─── CardFooter ───────────────────────────────────────────────────────────────
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a top border separating footer from body */
  withDivider?: boolean;
}

export function CardFooter({
  className,
  withDivider = false,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        withDivider && "pt-4 mt-4 border-t border-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
