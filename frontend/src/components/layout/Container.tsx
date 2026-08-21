import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className, id }: ContainerProps) {
  return (
    <div 
      id={id}
      className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full", className)}
    >
      {children}
    </div>
  );
}
