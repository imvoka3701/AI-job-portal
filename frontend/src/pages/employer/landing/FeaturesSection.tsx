import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Target, BarChart3, ArrowRight } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  imagePosition: "left" | "right";
}

function FeatureBlock({ icon, title, description, imagePosition }: FeatureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
        imagePosition === "right" ? "lg:grid-flow-dense" : ""
      }`}
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: imagePosition === "left" ? 30 : -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={imagePosition === "right" ? "lg:col-start-1" : ""}
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-6">
          {icon}
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-lg text-gray-600 leading-relaxed mb-6">{description}</p>
        <button className="group inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
          Khám phá thêm
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Image/Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={imagePosition === "right" ? "lg:col-start-2" : ""}
      >
        <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 shadow-xl border border-gray-200 overflow-hidden">
          {/* Placeholder content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-white/80 backdrop-blur shadow-inner" />
          </div>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const features = [
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "Đề xuất bởi AI",
      description:
        "Topppy AI tự động quét hàng triệu CV, phân tích hành vi ứng viên và chấm điểm phù hợp theo từng vị trí. Tiết kiệm đến 80% thời gian sàng lọc hồ sơ.",
      imagePosition: "right" as const,
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "Quản lý chiến dịch thông minh",
      description:
        "Theo dõi phễu tuyển dụng từ đăng tin, nhận CV, sàng lọc đến phỏng vấn. Đo lường hiệu quả từng nguồn ứng viên và tối ưu chi phí tuyển dụng.",
      imagePosition: "left" as const,
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: "Hệ thống báo cáo chi tiết",
      description:
        "Dashboard trực quan với biểu đồ thời gian thực. Theo dõi chi phí mỗi ứng viên (Cost per Hire), tỷ lệ chuyển đổi và dự báo nguồn ứng tuyển.",
      imagePosition: "right" as const,
    },
  ];

  return (
    <section ref={ref} className="py-20 sm:py-32 bg-white" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">
            Tính năng cốt lõi
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            Tại sao chọn Smart Recruitment Platform?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nền tảng tuyển dụng toàn diện, kết hợp AI và dữ liệu lớn giúp doanh nghiệp tìm được nhân tài phù hợp nhất.
          </p>
        </motion.div>

        {/* Feature Blocks */}
        <div className="space-y-32">
          {features.map((feature, i) => (
            <FeatureBlock key={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
