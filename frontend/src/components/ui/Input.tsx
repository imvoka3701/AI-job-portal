import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input */
  label?: string;
  /** Helper text rendered below the input */
  hint?: string;
  /** Error message — triggers red error state */
  error?: string;
  /** Icon rendered on the left inside the input */
  leftIcon?: React.ReactNode;
  /** Icon or element rendered on the right inside the input (e.g. show/hide password) */
  rightElement?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      leftIcon,
      rightElement,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate a stable id for label ↔ input association if none provided
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none",
              hasError ? "text-red-600" : "text-gray-700",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input wrapper — needed for icon positioning */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span
              className="absolute left-3 flex items-center justify-center text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                  ? `${inputId}-hint`
                  : undefined
            }
            className={cn(
              // Base
              "w-full h-10 rounded-lg border bg-white text-sm text-gray-900",
              "placeholder:text-gray-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              // Padding — adjust for icons
              leftIcon ? "pl-9 pr-3" : "px-3",
              rightElement ? "pr-10" : "",
              // Normal state
              !hasError && [
                "border-gray-200",
                "hover:border-gray-300",
                "focus:border-primary focus:ring-primary/20",
              ],
              // Error state
              hasError && [
                "border-red-400",
                "hover:border-red-500",
                "focus:border-red-500 focus:ring-red-500/20",
                "bg-red-50/30",
              ],
              // Disabled state
              disabled && "opacity-50 cursor-not-allowed bg-gray-50",
              className
            )}
            {...props}
          />

          {/* Right element (e.g. password toggle icon) */}
          {rightElement && (
            <span className="absolute right-3 flex items-center justify-center text-gray-400">
              {rightElement}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Hint text — only shown when no error */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
