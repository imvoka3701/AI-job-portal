import { cva } from "class-variance-authority";

// ─── Variants ─────────────────────────────────────────────────────────────────
// Tách riêng khỏi Badge.tsx để React Fast Refresh hoạt động tốt
// (một file chỉ nên export component hoặc chỉ export hằng số/hàm).
export const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "font-medium rounded-full border",
    "whitespace-nowrap leading-none",
  ],
  {
    variants: {
      variant: {
        // Semantic colors
        default:     "bg-gray-100 text-gray-600 border-gray-200",
        primary:     "bg-primary-light text-primary-dark border-primary/20",
        success:     "bg-green-50 text-green-700 border-green-200",
        warning:     "bg-amber-50 text-amber-700 border-amber-200",
        danger:      "bg-red-50 text-red-700 border-red-200",
        info:        "bg-sky-50 text-sky-700 border-sky-200",
        purple:      "bg-purple-50 text-purple-700 border-purple-200",
        // Solid variants (for strong emphasis)
        "solid-primary":  "bg-primary text-white border-primary",
        "solid-success":  "bg-green-600 text-white border-green-600",
        "solid-danger":   "bg-red-600 text-white border-red-600",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1",
      },
      dot: {
        true: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
