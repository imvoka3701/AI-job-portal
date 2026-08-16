import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  color: string;
  opacity: number;
  layer: "bg" | "mid" | "fg";
  isSpecial: boolean;
  pulseTimer: number;
  angle: number;
}

interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  life: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const isMobile = width < 768;
    const targetParticleCount = isMobile ? 120 : 250;
    const particles: Particle[] = [];
    const pulses: Pulse[] = [];

    const mouse = { x: -1000, y: -1000, active: false };

    // Initialize particles
    for (let i = 0; i < targetParticleCount; i++) {
      const isSpecial = i < (isMobile ? 4 : 7);
      let layer: "bg" | "mid" | "fg";
      const rand = Math.random();
      if (rand < 0.5) layer = "bg";
      else if (rand < 0.85) layer = "mid";
      else layer = "fg";

      let radius = 1.5;
      let opacity = 0.4;
      let speedMult = 0.5;

      if (layer === "bg") {
        radius = Math.random() * 0.8 + 0.8;
        opacity = Math.random() * 0.2 + 0.3;
        speedMult = 0.3;
      } else if (layer === "mid") {
        radius = Math.random() * 1.5 + 1.2;
        opacity = Math.random() * 0.3 + 0.4;
        speedMult = 0.6;
      } else {
        radius = Math.random() * 2 + 1.5;
        opacity = Math.random() * 0.3 + 0.6;
        speedMult = 1;
      }

      if (isSpecial) {
        radius = Math.random() * 1.5 + 2.5;
        opacity = 0.8;
        layer = "fg";
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.3 + 0.1) * speedMult;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseVx: Math.cos(angle) * speed,
        baseVy: Math.sin(angle) * speed,
        radius,
        color: isSpecial ? "#10b981" : "#059669",
        opacity,
        layer,
        isSpecial,
        pulseTimer: Math.random() * 100,
        angle,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      pulses.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 150 + Math.random() * 100,
        opacity: 0.3,
        life: 1.0,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    let lastTime = performance.now();

    const draw = (time: number) => {
      // Calculate delta time, capped to avoid large jumps if tab is inactive
      let dt = (time - lastTime) / 16.66;
      if (dt > 3) dt = 3;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Atmospheric gradients
      const bgGrad1 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.2,
        0,
        width * 0.2,
        height * 0.2,
        width * 0.6
      );
      bgGrad1.addColorStop(0, "rgba(16, 185, 129, 0.04)"); // subtle emerald
      bgGrad1.addColorStop(1, "rgba(245, 247, 248, 0)");

      const bgGrad2 = ctx.createRadialGradient(
        width * 0.8,
        height * 0.8,
        0,
        width * 0.8,
        height * 0.8,
        width * 0.6
      );
      bgGrad2.addColorStop(0, "rgba(6, 182, 212, 0.03)"); // subtle cyan
      bgGrad2.addColorStop(1, "rgba(245, 247, 248, 0)");

      ctx.fillStyle = bgGrad1;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = bgGrad2;
      ctx.fillRect(0, 0, width, height);

      // Mouse subtle glow
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          250
        );
        mouseGlow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
        mouseGlow.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw AI Pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.radius += 4 * dt;
        p.life -= 0.015 * dt;

        if (p.life <= 0) {
          pulses.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${p.opacity * p.life})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      let connections = 0;

      const centerX = width / 2;
      const centerY = height / 2;
      // The card is usually around 480px wide (max-w-[480px]) -> radius ~240
      const cardRadius = isMobile ? 180 : 280;

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Organic movement (Simplex noise feel)
        p.angle += (Math.random() - 0.5) * 0.05 * dt;
        const currentSpeed = Math.hypot(p.baseVx, p.baseVy);
        p.baseVx = Math.cos(p.angle) * currentSpeed;
        p.baseVy = Math.sin(p.angle) * currentSpeed;

        let targetVx = p.baseVx;
        let targetVy = p.baseVy;

        // 2. Mouse interaction (Flow field)
        if (mouse.active && p.layer !== "bg") {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 220) {
            const force = (220 - dist) / 220;
            // Calculate perpendicular vector for flowing around
            const perpX = -dy / dist;
            const perpY = dx / dist;

            const reactionStrength = p.layer === "fg" ? 1.5 : 0.7;

            // Move tangentially and slightly toward
            targetVx +=
              (perpX * 0.8 + (dx / dist) * 0.2) * force * reactionStrength;
            targetVy +=
              (perpY * 0.8 + (dy / dist) * 0.2) * force * reactionStrength;
          }
        }

        // 3. Pulse interaction
        pulses.forEach((pulse) => {
          const dx = p.x - pulse.x;
          const dy = p.y - pulse.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dist - pulse.radius) < 30) {
            // Push outwards gently
            targetVx += (dx / dist) * 0.8;
            targetVy += (dy / dist) * 0.8;
          }
        });

        // 4. Smooth velocity and position update
        p.vx += (targetVx - p.vx) * 0.05 * dt;
        p.vy += (targetVy - p.vy) * 0.05 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Screen wrap
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // 5. Quiet Zone calculation
        let quietZoneMultiplier = 1;
        const distToCenter = Math.hypot(p.x - centerX, p.y - centerY);
        if (distToCenter < cardRadius + 120) {
          // Fade out near the center card
          quietZoneMultiplier = Math.max(
            0.4,
            (distToCenter - cardRadius) / 120
          );
        }

        // Hover brightness boost
        let hoverMultiplier = 1;
        if (mouse.active) {
          const distToMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (distToMouse < 220) {
            hoverMultiplier = 1 + ((220 - distToMouse) / 220) * 1.5;
          }
        }

        let currentOpacity = Math.min(1, p.opacity * quietZoneMultiplier * hoverMultiplier);
        if (currentOpacity <= 0) continue; // Skip drawing if fully invisible

        // 6. Connections (Sparse and intentional)
        const MAX_CONNECTIONS_PER_FRAME = 40;
        if (connections < MAX_CONNECTIONS_PER_FRAME && quietZoneMultiplier > 0.3) {
          for (let j = i + 1; j < particles.length; j++) {
            if (connections >= MAX_CONNECTIONS_PER_FRAME) break;
            const p2 = particles[j];

            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 120) {
              // Check if they are moving in a similar direction
              const dir1 = Math.atan2(p.vy, p.vx);
              const dir2 = Math.atan2(p2.vy, p2.vx);
              let angleDiff = Math.abs(dir1 - dir2);
              if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

              // Only connect if moving in roughly same direction
              if (angleDiff < 1.2) {
                const connOpacity = (1 - dist / 120) * 0.3 * quietZoneMultiplier;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(16, 185, 129, ${connOpacity})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                connections++;
              }
            }
          }
        }

        // 7. Draw the particle
        ctx.beginPath();

        if (p.isSpecial) {
          p.pulseTimer += dt;
          const pulseEffect = Math.sin(p.pulseTimer * 0.05) * 0.2 + 0.8;
          currentOpacity = Math.min(1, p.opacity * pulseEffect * quietZoneMultiplier);

          // Draw AI Halo
          ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${currentOpacity * 0.25})`;
          ctx.fill();
          ctx.beginPath();
        }

        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 150, 105, ${currentOpacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-page-bg">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
