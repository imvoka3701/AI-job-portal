import { BadgeDollarSign, Megaphone, Headset, Briefcase, Monitor, Landmark, Building2, Calculator, Brain, ShoppingCart, PenTool, Truck, Stethoscope, GraduationCap } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from "framer-motion";
import { useRef, useCallback, useState } from "react";
import { useJobStore } from "@/stores/jobStore";
import { fadeInUp, inViewport } from "../animations";

const INDUSTRIES = [
  { id: 1, name: "Kinh doanh - Bán hàng", keyword: "Kinh doanh", count: "9.959", icon: BadgeDollarSign },
  { id: 2, name: "Marketing - PR - Quảng cáo", keyword: "Marketing", count: "5.804", icon: Megaphone },
  { id: 3, name: "Chăm sóc khách hàng", keyword: "Chăm sóc khách hàng", count: "1.527", icon: Headset },
  { id: 4, name: "Nhân sự - Hành chính", keyword: "Nhân sự", count: "3.245", icon: Briefcase },
  { id: 5, name: "Công nghệ Thông tin", keyword: "IT", count: "1.891", icon: Monitor },
  { id: 6, name: "Tài chính - Ngân hàng", keyword: "Tài chính", count: "1.077", icon: Landmark },
  { id: 7, name: "Bất động sản", keyword: "Bất động sản", count: "401", icon: Building2 },
  { id: 8, name: "Kế toán - Kiểm toán", keyword: "Kế toán", count: "4.662", icon: Calculator },
  { id: 9, name: "Trí tuệ Nhân tạo - Dữ liệu", keyword: "AI", count: "853", icon: Brain },
  { id: 10, name: "Thương mại điện tử", keyword: "E-commerce", count: "2.104", icon: ShoppingCart },
  { id: 11, name: "Thiết kế - Sáng tạo", keyword: "Designer", count: "1.492", icon: PenTool },
  { id: 12, name: "Logistics - Chuỗi cung ứng", keyword: "Logistics", count: "986", icon: Truck },
  { id: 13, name: "Y tế - Chăm sóc sức khỏe", keyword: "Y tế", count: "1.230", icon: Stethoscope },
  { id: 14, name: "Giáo dục - Đào tạo", keyword: "Giáo dục", count: "3.511", icon: GraduationCap },
];

function TiltIndustryCard({ ind, onSelect }: { ind: typeof INDUSTRIES[0]; onSelect: (keyword: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const Icon = ind.icon;
  return (
    <motion.div
      ref={cardRef}
      onClick={() => onSelect(ind.keyword)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-white border border-[#E5EAF0] rounded-2xl p-6 text-center cursor-pointer group shrink-0 w-[260px] shadow-sm hover:border-emerald-300 transition-all select-none"
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,184,107,0.15)" }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#00B86B] transition-colors duration-300"
        whileHover={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-8 h-8 text-[#00B86B] group-hover:text-white transition-colors duration-300" />
      </motion.div>
      <h3 className="text-[16px] font-bold text-[#172033] mb-1 group-hover:text-[#00B86B] transition-colors">{ind.name}</h3>
      <p className="text-[14px] text-[#00B86B] font-medium">{ind.count} việc làm</p>
    </motion.div>
  );
}

export function TopIndustries() {
  const setFilters = useJobStore((s) => s.setFilters);

  const handleSelectIndustry = useCallback((keyword: string) => {
    setFilters({ keyword });
    window.scrollTo({ top: 480, behavior: "smooth" });
  }, [setFilters]);

  const row1 = [...INDUSTRIES, ...INDUSTRIES];
  const half = Math.floor(INDUSTRIES.length / 2);
  const shifted = [...INDUSTRIES.slice(half), ...INDUSTRIES.slice(0, half)];
  const row2 = [...shifted, ...shifted];

  const [isHovered1, setIsHovered1] = useState(false);
  const [isHovered2, setIsHovered2] = useState(false);

  const progressLeft = useMotionValue(0);
  const progressRight = useMotionValue(-50);

  const xLeft = useTransform(progressLeft, (v) => `${v}%`);
  const xRight = useTransform(progressRight, (v) => `${v}%`);

  useAnimationFrame((_, delta) => {
    const moveBy = 1.11 * (delta / 1000);

    if (!isHovered1) {
      let currentL = progressLeft.get() - moveBy;
      if (currentL <= -50) currentL += 50;
      progressLeft.set(currentL);
    }

    if (!isHovered2) {
      let currentR = progressRight.get() + moveBy;
      if (currentR >= 0) currentR -= 50;
      progressRight.set(currentR);
    }
  });

  return (
    <div className="mt-20">
      <motion.div
        className="flex items-end justify-between mb-8"
        initial="hidden"
        whileInView="visible"
        viewport={inViewport}
        variants={fadeInUp}
      >
        <div>
          <h2 className="text-2xl font-bold text-[#00B86B]">Top ngành nghề nổi bật</h2>
          <p className="text-[#64748B] mt-1 text-[15px]">Khám phá các vị trí tuyển dụng theo lĩnh vực quan tâm</p>
        </div>
      </motion.div>

      <div className="relative overflow-hidden py-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-col gap-6">
        <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-page-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-page-bg to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex gap-6 w-max"
          style={{ x: xLeft }}
          onMouseEnter={() => setIsHovered1(true)}
          onMouseLeave={() => setIsHovered1(false)}
        >
          {row1.map((ind, index) => (
            <TiltIndustryCard 
              key={`r1-${ind.id}-${index}`} 
              ind={ind} 
              onSelect={handleSelectIndustry}
            />
          ))}
        </motion.div>
        
        <motion.div 
          className="flex gap-6 w-max"
          style={{ x: xRight }}
          onMouseEnter={() => setIsHovered2(true)}
          onMouseLeave={() => setIsHovered2(false)}
        >
          {row2.map((ind, index) => (
            <TiltIndustryCard 
              key={`r2-${ind.id}-${index}`} 
              ind={ind} 
              onSelect={handleSelectIndustry}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
