import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Zap, Award, Sparkles, BarChart2, Users, Check, ExternalLink } from "lucide-react";
import { Card3DTilt } from "@/components/ui/Card3DTilt";

const SERVICES = [
  {
    tag: "DỊCH VỤ ĐĂNG TIN",
    title: "Top Jobs — Đăng tin tuyển dụng nổi bật",
    desc: "Tiếp cận ngay 9.5M+ ứng viên tiềm năng trên toàn quốc. Tin tuyển dụng được AI tự động tối ưu hiển thị và đề xuất cho ứng viên phù hợp nhất.",
    features: [
      "Hiển thị ưu tiên tại vị trí Top Đề xuất công việc",
      "Gửi email gợi ý việc làm tự động tới ứng viên phù hợp",
      "Hỗ trợ chỉnh sửa nội dung bài đăng chuẩn SEO",
      "Lọc tự động CV trùng lặp và CV ảo",
    ],
    cta: "Khám phá Top Jobs",
    badgeIcon: Zap,
    imageOrder: "left" as const,
    accentColor: "emerald",
    serviceType: "jobs-mockup",
  },
  {
    tag: "DỊCH VỤ TIỆN ÍCH",
    title: "Top Credit — Mở khóa CV & AI Match",
    desc: "Chủ động tìm kiếm và kết nối với nguồn ứng viên chủ động chất lượng cao. AI Match Score chấm điểm % phù hợp chính xác theo khung tiêu chí của doanh nghiệp.",
    features: [
      "Tìm kiếm CV theo từ khóa, kỹ năng và mức lương",
      "AI Match Score chấm điểm % phù hợp của từng ứng viên",
      "Cơ chế mở khóa điểm linh hoạt, tiết kiệm chi phí",
      "Chat & Email trực tiếp với ứng viên trong nền tảng",
    ],
    cta: "Trải nghiệm Top Credit",
    badgeIcon: Sparkles,
    imageOrder: "right" as const,
    accentColor: "blue",
    serviceType: "credit-mockup",
  },
  {
    tag: "THƯƠNG HIỆU TUYỂN DỤNG",
    title: "Top Branding — Quảng bá thương hiệu Nhà tuyển dụng",
    desc: "Xây dựng thương hiệu nhà tuyển dụng (Employer Branding) uy tín, chuyên nghiệp. Định vị doanh nghiệp là môi trường làm việc lý tưởng hàng đầu trong ngành.",
    features: [
      "Trang Công ty tùy chỉnh logo, banner và văn hóa doanh nghiệp",
      "Truyền thông thương hiệu trên kênh báo chí & mạng xã hội",
      "Banner quảng bá nổi bật tại trang chủ và trang ngành nghề",
      "Báo cáo phân tích lượt truy cập và mức độ quan tâm",
    ],
    cta: "Tư vấn Top Branding",
    badgeIcon: Award,
    imageOrder: "left" as const,
    accentColor: "violet",
    serviceType: "branding-mockup",
  },
];

const ACCENT_MAP: Record<string, { bg: string; text: string; border: string; badge: string; glow: string; barGrad: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    glow: "from-emerald-950 via-gray-900 to-emerald-950",
    barGrad: "from-emerald-500 to-teal-500",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    glow: "from-blue-950 via-gray-900 to-indigo-950",
    barGrad: "from-blue-500 to-indigo-500",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-800",
    glow: "from-purple-950 via-gray-900 to-violet-950",
    barGrad: "from-violet-500 to-purple-500",
  },
};

export function TopServicesSection() {
  return (
    <section className="py-24 bg-white" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
            Giải Pháp Tuyển Dụng Chuyên Sâu
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-4 leading-tight">
            3 Gói Dịch Vụ{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Phù Hợp Mọi Nhu Cầu
            </span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mt-4 font-normal leading-relaxed">
            Hệ thống giải pháp tuyển dụng toàn diện được thiết kế chuyên biệt cho mọi giai đoạn phát triển của doanh nghiệp.
          </p>
        </div>

        {/* Z-Pattern List */}
        <div className="space-y-28">
          {SERVICES.map((item) => {
            const BadgeIcon = item.badgeIcon;
            const isImageLeft = item.imageOrder === "left";
            const accent = ACCENT_MAP[item.accentColor];

            return (
              <div
                key={item.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  !isImageLeft ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* ═══════════════════════════════════════════════ */}
                {/* Visual / 3D Perspective Mockup Column          */}
                {/* ═══════════════════════════════════════════════ */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={!isImageLeft ? "lg:col-start-2" : ""}
                >
                  <Card3DTilt
                    intensity={20}
                    floating={true}
                    className={`rounded-3xl bg-gradient-to-br ${accent.glow} text-white p-7 sm:p-8 border border-gray-800 shadow-2xl overflow-hidden`}
                  >
                    {/* Background Grid Pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{ backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
                    />

                    {/* Top Bar inside Mockup */}
                    <div className="relative flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                      <div className="flex items-center gap-2 bg-gray-800/80 px-3.5 py-1.5 rounded-full border border-gray-700 shadow-xs">
                        <BadgeIcon className={`w-4 h-4 ${accent.text}`} />
                        <span className="text-xs font-bold text-gray-200">{item.tag}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Engine</span>
                      </div>
                    </div>

                    {/* ── Mockup 1: Top Jobs Interactive Visual ── */}
                    {item.serviceType === "jobs-mockup" && (
                      <div className="space-y-4 my-2">
                        <div className="p-4 rounded-2xl bg-gray-800/90 border border-gray-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                              Top Việc Làm Nổi Bật #1
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">Đăng 2 giờ trước</span>
                          </div>
                          <div>
                            <p className="text-base font-extrabold text-white">Senior Fullstack Developer (React/Node)</p>
                            <p className="text-xs text-gray-400 mt-0.5">35 - 50 Triệu VNĐ · Hà Nội / Hybrid</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-700/60 text-xs">
                            <span className="text-gray-300 font-medium">847 lượt xem hôm nay</span>
                            <span className="font-bold text-emerald-400">+42 CV ứng tuyển</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">Tỷ lệ xem tin</p>
                            <p className="text-xl font-black text-emerald-400 mt-0.5">×3.5 Lần</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">CV đạt chuẩn</p>
                            <p className="text-xl font-black text-teal-300 mt-0.5">92.4%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Mockup 2: Top Credit Interactive Visual ── */}
                    {item.serviceType === "credit-mockup" && (
                      <div className="space-y-4 my-2">
                        <div className="p-4 rounded-2xl bg-gray-800/90 border border-gray-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                                TL
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">Trần Thùy Linh</p>
                                <p className="text-[11px] text-gray-400">Product Lead · 5 năm kn</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-blue-400 bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 rounded-lg">
                                94% Match
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-700/60">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              <span>Sẵn sàng phỏng vấn ngay</span>
                            </div>
                            <span className="text-[11px] text-blue-300 font-bold bg-blue-900/60 px-2 py-0.5 rounded">
                              Mở khóa: 1 Credit
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">Kho hồ sơ chủ động</p>
                            <p className="text-xl font-black text-blue-400 mt-0.5">9.5M+ CV</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">Tỷ lệ phản hồi</p>
                            <p className="text-xl font-black text-teal-300 mt-0.5">85%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Mockup 3: Top Branding Interactive Visual ── */}
                    {item.serviceType === "branding-mockup" && (
                      <div className="space-y-4 my-2">
                        <div className="p-4 rounded-2xl bg-gray-800/90 border border-gray-700/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-gray-950 font-black text-xs">
                                TECH
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">Doanh Nghiệp Tiêu Biểu</p>
                                <p className="text-[10px] text-emerald-400">✓ Verified Employer Brand</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>

                          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-3/4 rounded-full" />
                          </div>

                          <div className="flex justify-between text-xs text-gray-300 font-medium">
                            <span>Độ nhận diện thương hiệu:</span>
                            <span className="font-bold text-purple-300">+300% Lượt theo dõi</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">Lượt xem trang công ty</p>
                            <p className="text-xl font-black text-purple-400 mt-0.5">×3.0</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-gray-800/60 border border-gray-700/60">
                            <p className="text-[10px] text-gray-400 font-semibold">Gia tăng ứng tuyển</p>
                            <p className="text-xl font-black text-pink-400 mt-0.5">+250%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom divider metric */}
                    <div className="relative mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>Tối ưu ROI tuyển dụng</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Toppy AI 2.0</span>
                      </div>
                    </div>
                  </Card3DTilt>
                </motion.div>

                {/* ═══════════════════════════════════════════════ */}
                {/* Content Text Column                            */}
                {/* ═══════════════════════════════════════════════ */}
                <motion.div
                  initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: 0.2 }}
                  className={!isImageLeft ? "lg:col-start-1" : ""}
                >
                  <span className={`text-xs font-black ${accent.text} uppercase tracking-widest ${accent.bg} px-3.5 py-1.5 rounded-lg border ${accent.border}`}>
                    {item.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mt-4 mb-4 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed mb-7 font-normal">
                    {item.desc}
                  </p>

                  {/* Feature Checkmarks */}
                  <ul className="space-y-3.5 mb-9">
                    {item.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${accent.barGrad} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <motion.a
                    href="#contact"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`inline-flex items-center gap-2.5 h-13 px-7 rounded-2xl bg-gradient-to-r ${accent.barGrad} text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all`}
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                </motion.div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
