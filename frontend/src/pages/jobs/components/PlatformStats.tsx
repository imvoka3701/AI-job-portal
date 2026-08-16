import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/** Animated counter: counts up from 0 to target when in view */
function AnimatedCounter({ value, className }: { value: string; className?: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numericStr = value.replace(/[^0-9]/g, "");
          const suffix = value.replace(/[0-9]/g, "");
          const target = parseInt(numericStr, 10);
          if (isNaN(target)) { setDisplay(value); return; }

          const duration = 2000; // 2 seconds for dramatic effect
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            setDisplay(current.toLocaleString("vi-VN") + suffix);
            if (progress < 1) requestAnimationFrame(step);
            else setDisplay(value); // Ensure final value is exact
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref} className={className}>{display}</span>;
}

/** Bento Card with Spotlight Mouse effect (Idea 1) */
function BentoCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("group relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 backdrop-blur-sm", className)}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 184, 107, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {/* Subtle grain/grid on hover */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

/** Abstract Nodes SVG Background (Idea 2) */
function NetworkNodesBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity duration-700">
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B86B" stopOpacity="0" />
            <stop offset="50%" stopColor="#00B86B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00B86B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Animated laser lines */}
        <motion.line x1="-20%" y1="-20%" x2="120%" y2="120%" stroke="url(#lineGrad)" strokeWidth="1" 
          initial={{ strokeDasharray: "200, 1000", strokeDashoffset: 1200 }}
          animate={{ strokeDashoffset: -1200 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.line x1="120%" y1="-20%" x2="-20%" y2="120%" stroke="url(#lineGrad)" strokeWidth="1" 
          initial={{ strokeDasharray: "150, 1000", strokeDashoffset: 1200 }}
          animate={{ strokeDashoffset: -1200 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
        />
        
        {/* Static nodes */}
        <circle cx="20%" cy="30%" r="3" fill="#00B86B" className="animate-pulse" />
        <circle cx="80%" cy="40%" r="2" fill="#00B86B" />
        <circle cx="40%" cy="80%" r="4" fill="#00B86B" className="animate-pulse" />
        <circle cx="70%" cy="85%" r="2" fill="#00B86B" />
        
        {/* Static connections */}
        <line x1="20%" y1="30%" x2="80%" y2="40%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="20%" y1="30%" x2="40%" y2="80%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="80%" y1="40%" x2="70%" y2="85%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="40%" y1="80%" x2="70%" y2="85%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function PlatformStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax scroll effect for large background numbers (Idea 3)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const yBgLeft = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const yBgRight = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <div ref={containerRef} className="w-full bg-[#0B1320] py-24 relative overflow-hidden mt-20 border-t border-white/5">
      {/* Multi-layer radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      {/* Dot-grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Nền tảng tuyển dụng AI thế hệ mới
          </div>
          <p className="text-white/80 text-[18px] md:text-[20px] leading-relaxed font-light">
            Sở hữu hơn 8 triệu người dùng và 200.000+ doanh nghiệp tin dùng, AI Job Portal khao khát kiến tạo một cầu nối có giá trị vững bền để những nhân tố đủ tầm chạm đến nhau: <span className="text-white font-medium">đúng người, đúng thời, đúng hướng.</span>
          </p>
        </motion.div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          
          {/* Box 1: Nhà tuyển dụng (Span 2 cols) */}
          <BentoCard className="md:col-span-2 min-h-[280px]">
             {/* Idea 3: Massive Typography Parallax in BG */}
            <motion.div 
              style={{ y: yBgLeft }}
              className="absolute -top-10 -left-10 text-[180px] font-black text-white/[0.02] pointer-events-none tracking-tighter leading-none select-none"
            >
              540K
            </motion.div>
            
            <div>
              <h3 className="text-[56px] md:text-[72px] font-bold text-white tracking-tight leading-none mb-4">
                <AnimatedCounter value="540.000+" />
              </h3>
              <p className="text-[#00B86B] font-medium text-xl md:text-2xl mb-4">Nhà tuyển dụng uy tín</p>
            </div>
            <p className="text-white/60 text-base md:text-lg max-w-md font-light leading-relaxed">
              Các nhà tuyển dụng lớn nhỏ đến từ tất cả các ngành nghề, được xác thực danh tính 100% để đảm bảo môi trường an toàn.
            </p>
          </BentoCard>

          {/* Box 2: Doanh nghiệp hàng đầu (Span 1 col) */}
          <BentoCard className="min-h-[280px] bg-gradient-to-br from-white/5 to-transparent">
            <NetworkNodesBg /> {/* Idea 2: Global Network Nodes */}
            <div className="relative z-10">
              <h3 className="text-[48px] font-bold text-white tracking-tight leading-none mb-3">
                <AnimatedCounter value="200.000+" />
              </h3>
              <p className="text-[#00B86B] font-medium text-lg mb-4">Doanh nghiệp</p>
            </div>
            <p className="text-white/60 text-sm md:text-base font-light leading-relaxed relative z-10">
              Nhiều tập đoàn lớn tin tưởng đồng hành như Samsung, Viettel, FPT, VNG...
            </p>
          </BentoCard>

          {/* Box 3: Việc làm kết nối (Span 1 col) */}
          <BentoCard className="min-h-[280px]">
            <div>
              <h3 className="text-[48px] font-bold text-white tracking-tight leading-none mb-3">
                <AnimatedCounter value="2.000.000+" />
              </h3>
              <p className="text-[#00B86B] font-medium text-lg mb-4">Việc làm kết nối</p>
            </div>
            <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
              Thuật toán AI độc quyền giúp hàng triệu ứng viên tìm thấy công việc mơ ước nhanh hơn gấp 3 lần.
            </p>
          </BentoCard>

          {/* Box 4: Lượt tải ứng dụng (Span 2 cols) */}
          <BentoCard className="md:col-span-2 min-h-[280px] flex justify-end">
            {/* Idea 3: Massive Typography Parallax in BG (moves opposite direction) */}
            <motion.div 
              style={{ y: yBgRight }}
              className="absolute -bottom-10 -right-10 text-[180px] font-black text-white/[0.02] pointer-events-none tracking-tighter leading-none select-none"
            >
              1.2M
            </motion.div>
            
            <div className="relative z-10 text-right w-full flex flex-col items-end">
              <h3 className="text-[56px] md:text-[72px] font-bold text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-white tracking-tight leading-none mb-4">
                <AnimatedCounter value="1.200.000+" />
              </h3>
              <p className="text-[#00B86B] font-medium text-xl md:text-2xl mb-4">Lượt tải ứng dụng</p>
              <p className="text-white/60 text-base md:text-lg max-w-md font-light leading-relaxed text-right">
                Cộng đồng nhân tài đông đảo. Hơn 60% người dùng trên nền tảng là nhân sự có kinh nghiệm từ Mid-level trở lên.
              </p>
            </div>
          </BentoCard>

        </div>

        {/* Animated Play Button */}
        <motion.div
          className="flex flex-col items-center pb-32 mt-16"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            className="relative w-24 h-24 rounded-full flex items-center justify-center text-white overflow-visible mb-6 group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Ambient rotating glows */}
            <motion.div 
              className="absolute inset-[-20%] rounded-full bg-gradient-to-tr from-emerald-500/40 to-teal-400/0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Pulsing rings */}
            <motion.span
              className="absolute inset-0 rounded-full border border-[#00B86B]"
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-[#00B86B]"
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
            />
            
            {/* Core button */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00B86B] to-emerald-700 shadow-xl group-hover:shadow-[0_0_50px_rgba(0,184,107,0.6)] transition-shadow duration-500" />
            <Play className="relative z-10 w-10 h-10 ml-1 fill-white drop-shadow-md" />
          </motion.button>
          
          <span className="text-white/90 font-medium text-xl tracking-wide">Tiếp lợi thế, nối thành công</span>
        </motion.div>
      </div>
    </div>
  );
}
