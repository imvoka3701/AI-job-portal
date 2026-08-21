import { cva } from "class-variance-authority";

// ─── Variants ─────────────────────────────────────────────────────────────────
// Tách riêng khỏi Button.tsx để React Fast Refresh hoạt động tốt
// (một file chỉ nên export component hoặc chỉ export hằng số/hàm).
export const buttonVariants = cva(
  // Base styles — shared across all variants
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium text-sm whitespace-nowrap",
    "rounded-lg border transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none cursor-pointer",
  ],
  {
    variants: {
      variant: {
        // Primary — solid green, main CTA
        primary: [
          "bg-primary text-white border-primary",
          "hover:bg-primary-hover hover:border-primary-hover",
          "active:bg-primary-dark",
          "shadow-sm",
        ],
        // Secondary — white with gray border
        secondary: [
          "bg-white text-gray-700 border-gray-200",
          "hover:bg-gray-50 hover:border-gray-300",
          "active:bg-gray-100",
          "shadow-sm",
        ],
        // Destructive — for delete/danger actions
        destructive: [
          "bg-red-600 text-white border-red-600",
          "hover:bg-red-700 hover:border-red-700",
          "active:bg-red-800",
          "shadow-sm",
        ],
        // Ghost — no background, subtle hover
        ghost: [
          "bg-transparent text-gray-600 border-transparent",
          "hover:bg-gray-100 hover:text-gray-900",
          "active:bg-gray-200",
        ],
        // Link — looks like a text link
        link: [
          "bg-transparent text-primary border-transparent underline-offset-4",
          "hover:underline hover:text-primary-hover",
          "p-0 h-auto",
        ],
        // Outline — transparent bg, colored border
        outline: [
          "bg-transparent text-primary border-primary",
          "hover:bg-primary-soft",
          "active:bg-primary-light",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10 p-0 rounded-lg",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
