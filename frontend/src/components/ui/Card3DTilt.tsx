import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  floating?: boolean;
}

export function Card3DTilt({
  children,
  className,
  intensity = 22,
  glare = true,
  floating = false,
}: Card3DTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 450, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 450, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
    setGlarePos({
      x: Math.round((mouseX / rect.width) * 100),
      y: Math.round((mouseY / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <div style={{ perspective: 900 }} className="w-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={
          floating && !isHovered
            ? {
                y: [-4, 4, -4],
                rotateZ: [-0.4, 0.4, -0.4],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }
            : {}
        }
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative transition-all duration-150 transform-gpu cursor-pointer",
          isHovered ? "scale-[1.04] z-20 shadow-2xl" : "shadow-lg",
          className
        )}
      >
        {/* Dynamic Light Glare Follower */}
        {glare && isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl z-30 transition-opacity duration-200 opacity-60 mix-blend-overlay"
            style={{
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.45), transparent 70%)`,
            }}
          />
        )}

        {/* 3D Elevated Content Layer */}
        <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
