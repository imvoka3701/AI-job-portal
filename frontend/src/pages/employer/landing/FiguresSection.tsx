import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Briefcase, Clock, Award, Globe } from "lucide-react";

interface FigureItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  color: string;
}

const FIGURES: FigureItem[] = [
  {
    icon: Users,
    value: 9.5,
    suffix: "M+",
    label: "Hồ sơ ứng viên",
    sublabel: "sẵn sàng kết nối với doanh nghiệp",
    color: "from-emerald-400 to-teal-400",
  },
  {
    icon: Briefcase,
    value: 200,
    suffix: "K+",
    label: "Doanh nghiệp",
    sublabel: "đang tuyển dụng trên toàn quốc",
    color: "from-blue-400 to-indigo-400",
  },
  {
    icon: TrendingUp,
    value: 9,
    suffix: "M+",
    label: "Lượt ứng tuyển / tháng",
    sublabel: "tăng trưởng 250% so với cùng kỳ",
    color: "from-violet-400 to-purple-400",
  },
  {
    icon: Clock,
    value: 30,
    suffix: " Phút",
    label: "Thời gian duyệt tin",
    sublabel: "tự động kiểm duyệt chuẩn nội dung",
    color: "from-amber-400 to-orange-400",
  },
  {
    icon: Award,
    value: 98,
    suffix: "%",
    label: "Hài lòng với AI Match",
    sublabel: "đánh giá từ hơn 50.000 HR Managers",
    color: "from-rose-400 to-pink-400",
  },
  {
    icon: Globe,
    value: 34,
    suffix: " Tỉnh/Thành",
    label: "Phủ sóng Toàn quốc",
    sublabel: "kết nối nhân tài trên 34 tỉnh/thành phố",
    color: "from-teal-400 to-cyan-400",
  },
];

function AnimatedCounter({ end, suffix, decimals = 0 }: { end: number; suffix: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const steps = 40;
    const increment = end / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <span ref={ref} className="tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

export function FiguresSection() {
  return (
    <section className="relative py-24 bg-gray-950 text-white overflow-hidden" id="figures">
      {/* Background ambient orbs & mesh */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-4 py-1.5 rounded-full">
            Quy Mô Nền Tảng Hàng Đầu
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-4 leading-tight">
            Những Con Số{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Biết Nói
            </span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mt-4 font-normal">
            Bảo chứng cho năng lực kết nối và hiệu quả chuyển đổi thực tế từ nền tảng tuyển dụng AI số 1 Việt Nam.
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIGURES.map((item, idx) => {
            const Icon = item.icon;
            const hasDecimals = item.value % 1 !== 0;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.4)" }}
                className="group relative rounded-3xl bg-gray-900/90 border border-gray-800 p-8 transition-all duration-300 overflow-hidden"
              >
                {/* Hover gradient glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-300`} />

                <div className="relative z-10 space-y-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-gray-950 font-black shadow-lg shadow-black/30`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Value Counter */}
                  <p className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent leading-none`}>
                    <AnimatedCounter end={item.value} suffix={item.suffix} decimals={hasDecimals ? 1 : 0} />
                  </p>

                  {/* Text */}
                  <div>
                    <p className="text-base font-extrabold text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">{item.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
