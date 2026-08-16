import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { JobType, ExperienceLevel } from "@/types/job";
import type { ApplicationStatus } from "@/types/application";

// ─── Variants ─────────────────────────────────────────────────────────────────
const badgeVariants = cva(
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

// ─── Props ────────────────────────────────────────────────────────────────────
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a colored dot before the text */
  dot?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// ─── Domain-specific Badge helpers ───────────────────────────────────────────
// These map backend enum values → the correct Badge variant automatically.

const JOB_TYPE_MAP: Record<JobType, { label: string; variant: BadgeProps["variant"] }> = {
  full_time:  { label: "Full-time",  variant: "primary" },
  part_time:  { label: "Part-time",  variant: "info" },
  internship: { label: "Internship", variant: "purple" },
  freelance:  { label: "Freelance",  variant: "warning" },
  remote:     { label: "Remote",     variant: "success" },
};

const EXPERIENCE_LEVEL_MAP: Record<ExperienceLevel, { label: string; variant: BadgeProps["variant"] }> = {
  fresher: { label: "Fresher", variant: "default" },
  junior:  { label: "Junior",  variant: "info" },
  middle:  { label: "Middle",  variant: "primary" },
  senior:  { label: "Senior",  variant: "warning" },
  lead:    { label: "Lead",    variant: "purple" },
};

const APPLICATION_STATUS_MAP: Record<ApplicationStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending:     { label: "Pending",     variant: "default" },
  reviewed:    { label: "Reviewed",    variant: "info" },
  shortlisted: { label: "Shortlisted", variant: "primary" },
  interview:   { label: "Interview",   variant: "warning" },
  accepted:    { label: "Accepted",    variant: "success" },
  rejected:    { label: "Rejected",    variant: "danger" },
};

export function JobTypeBadge({ type, ...props }: { type: JobType } & Omit<BadgeProps, "variant">) {
  const config = JOB_TYPE_MAP[type];
  return <Badge variant={config.variant} {...props}>{config.label}</Badge>;
}

export function ExperienceBadge({ level, ...props }: { level: ExperienceLevel } & Omit<BadgeProps, "variant">) {
  const config = EXPERIENCE_LEVEL_MAP[level];
  return <Badge variant={config.variant} {...props}>{config.label}</Badge>;
}

export function ApplicationStatusBadge({
  status,
  ...props
}: { status: ApplicationStatus } & Omit<BadgeProps, "variant">) {
  const config = APPLICATION_STATUS_MAP[status];
  return <Badge variant={config.variant} dot {...props}>{config.label}</Badge>;
}

export { badgeVariants };
