import type { ReactNode } from "react";
import { ParticleBackground } from "@/components/ui";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg relative overflow-hidden">
      {/* Network Particles Background */}
      <ParticleBackground />

      {/* Main Content (Elevated above particles) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 z-10 relative">
        {children}
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-gray-400">
        © 2026. All Rights Reserved. AI Job Portal Vietnam JSC.
      </div>
    </div>
  );
}
