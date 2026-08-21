import { type HTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { badgeVariants } from "./badgeVariants";
import type { JobType, ExperienceLevel } from "@/types/job";
import type { ApplicationStatus } from "@/types/application";

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
