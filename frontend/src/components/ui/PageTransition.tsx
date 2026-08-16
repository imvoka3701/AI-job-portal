import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────
interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * Wraps page content with a subtle fade-in + slide-up animation.
 * Respects `prefers-reduced-motion` via CSS (globals.css §21).
 */
export function PageTransition({
  children,
  className,
  ...props
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
