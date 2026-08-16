import { ArrowRight, FileText, CheckCircle2, Sparkles, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useRef } from "react";
import { fadeInUp, slideInLeft, inViewport } from "../animations";

function CVBuilderCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Glare effect
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(0, 184, 107, 0.25) 0%, transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative w-64 h-80 md:w-80 md:h-[420px] shrink-0 z-20" style={{ perspective: 1200 }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full relative cursor-pointer"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ y: 0 }}
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Main Card */}
        <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
          
          {/* Holographic Glare */}
          <motion.div 
            className="absolute inset-0 z-40 pointer-events-none"
            style={{ background: glareBackground }}
          />

          {/* AI Scanner Laser */}
          <motion.div 
            className="absolute left-0 right-0 h-[2px] bg-[#00B86B] z-30"
            style={{ boxShadow: "0 0 20px 4px rgba(0,184,107,0.5)" }}
            animate={{ top: ["-10%", "110%", "-10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#00B86B]/20 z-20 pointer-events-none"
            animate={{ top: ["-10%", "110%", "-10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* CV Content */}
          <div className="p-6 md:p-8 flex flex-col h-full z-10 relative bg-white/50">
            <div className="flex gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                <FileText className="w-8 h-8 text-[#00B86B]" />
              </div>
              <div className="flex flex-col justify-center gap-3 w-full">
                <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
              </div>
            </div>
            
            <div className="space-y-4 flex-1 mt-4">
              <div className="h-2 w-full bg-gray-100 rounded-full" />
              <div className="h-2 w-5/6 bg-gray-100 rounded-full" />
              <div className="h-2 w-4/6 bg-emerald-100 rounded-full" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
              <div className="h-2 w-2/3 bg-gray-100 rounded-full" />
              <div className="h-2 w-5/6 bg-emerald-100 rounded-full" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>

            {/* AI Highlighted Tags */}
            <div className="flex flex-wrap gap-2 mt-auto pt-6">
              <div className="px-3 py-1.5 bg-[#00B86B]/10 border border-[#00B86B]/30 text-[#00B86B] text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3" /> ATS-Friendly
              </div>
              <div className="px-3 py-1.5 bg-[#00B86B]/10 border border-[#00B86B]/30 text-[#00B86B] text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> AI Optimized
              </div>
            </div>
          </div>
        </div>

        {/* Floating Badges outside the card - Uses transformZ for 3D Pop */}
        <div className="absolute -top-6 -right-6 pointer-events-none" style={{ transform: "translateZ(60px)" }}>
          <motion.div 
            className="bg-white px-4 py-2 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <ScanLine className="w-4 h-4 text-[#00B86B]" />
            <span className="text-xs font-bold text-gray-800">Auto Scan</span>
          </motion.div>
        </div>

        <div className="absolute -bottom-4 -left-8 pointer-events-none" style={{ transform: "translateZ(80px)" }}>
          <motion.div 
            className="bg-white px-4 py-2 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <span className="text-xs font-bold text-gray-800">Score:</span>
            <span className="text-sm font-black text-[#00B86B]">99/100</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function CVBuilderPromo() {
  return (
    <div className="mt-32 mb-20 flex flex-col items-center">
      <motion.h2
        className="text-2xl md:text-3xl font-bold text-[#172033] mb-10 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={inViewport}
        variants={fadeInUp}
      >
        Cùng AI Job Portal xây dựng <span className="text-[#00B86B]">thương hiệu cá nhân</span>
      </motion.h2>

      <motion.div
        className="w-full max-w-5xl bg-gradient-to-br from-[#f8fafc] to-[#e0f8ea] rounded-[2rem] p-8 sm:p-14 relative overflow-visible border border-[#00B86B]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-16"
        initial="hidden"
        whileInView="visible"
        viewport={inViewport}
        variants={fadeInUp}
      >
        {/* Left content */}
        <motion.div
          className="relative z-10 w-full md:max-w-[420px] flex flex-col items-center md:items-start text-center md:text-left"
          variants={slideInLeft}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-[#00B86B] text-sm font-bold rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Feature
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-[#172033] mb-5">
            CV Builder <span className="text-[#00B86B]">2.0</span>
          </h3>
          <p className="text-[#64748B] text-[16px] leading-relaxed mb-8">
            Hệ thống AI của chúng tôi sẽ tự động phân tích và tối ưu hóa từ khóa, giúp CV của bạn dễ dàng vượt qua vòng lọc khắt khe nhất của mọi hệ thống ATS.
          </p>
          <Link to="/cv" className="inline-block">
            <motion.button
              className="group relative flex items-center gap-2 bg-[#00B86B] hover:bg-[#00A35E] text-white px-8 py-4 rounded-xl font-bold overflow-hidden shadow-xl shadow-[#00B86B]/30 cursor-pointer"
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,184,107,0.3)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700" />
              Trải nghiệm ngay <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Right: Holographic 3D AI Card */}
        <Link to="/cv" className="relative z-10 flex justify-center w-full md:w-auto block">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-[#00B86B] blur-[100px] opacity-20 rounded-full transform scale-150" />
          <CVBuilderCard />
        </Link>
      </motion.div>
    </div>
  );
}
