import { cn } from "@/lib/utils";

export interface MessengerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
  className?: string;
}

export function MessengerAvatar({
  name,
  avatarUrl,
  companyLogo,
  size = "md",
  isOnline,
  className,
}: MessengerAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const badgeSizes = {
    sm: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
    md: "w-4 h-4 -bottom-1 -right-1",
    lg: "w-5 h-5 -bottom-1 -right-1",
  };

  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <div className={cn("relative shrink-0 inline-block select-none", className)}>
      {/* Main Portrait / Avatar */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white shadow-xs overflow-hidden border-2 border-white",
          sizeClasses[size],
          avatarUrl ? "bg-slate-100" : "bg-gradient-to-br from-emerald-500 to-teal-700"
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initial if image fails
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {/* Embedded Company Logo Badge for HR / Employers */}
      {companyLogo && (
        <div
          title="Công ty chủ quản"
          className={cn(
            "absolute rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden p-0.5 ring-1 ring-white",
            badgeSizes[size]
          )}
        >
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Online indicator if no company logo and isOnline is true */}
      {!companyLogo && isOnline && (
        <span
          className={cn(
            "absolute rounded-full border-2 border-white bg-emerald-500",
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
}
