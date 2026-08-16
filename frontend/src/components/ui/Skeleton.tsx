import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ─── Base Skeleton ────────────────────────────────────────────────────────────
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as a circle — useful for avatars */
  circle?: boolean;
}

export function Skeleton({ className, circle = false, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        "animate-pulse bg-gray-200",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      {...props}
    />
  );
}

// ─── Skeleton Text (multi-line) ───────────────────────────────────────────────
export interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Make the last line shorter (more natural look) */
  lastLineShort?: boolean;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineShort = true,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            lastLineShort && i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

// ─── Pre-built Skeletons for domain objects ───────────────────────────────────

/**
 * Skeleton for a Job Card in the job listing page.
 * Mirrors the layout of the real JobCard component.
 */
export function JobCardSkeleton() {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
      aria-hidden="true"
    >
      {/* Header: logo + title + company */}
      <div className="flex items-start gap-3 mb-4">
        <Skeleton circle className="w-12 h-12 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {/* Badges row */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* Description */}
      <SkeletonText lines={2} className="mb-4" />
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the Job Detail page hero section.
 */
export function JobDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6" aria-hidden="true">
      <div className="flex items-start gap-4 mb-6">
        <Skeleton circle className="w-16 h-16 shrink-0" />
        <div className="flex-1 flex flex-col gap-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-lg shrink-0" />
      </div>
      <SkeletonText lines={5} />
    </div>
  );
}

/**
 * Skeleton for a user profile / application list item.
 */
export function ApplicationRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
      aria-hidden="true"
    >
      <Skeleton circle className="w-10 h-10 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );
}
