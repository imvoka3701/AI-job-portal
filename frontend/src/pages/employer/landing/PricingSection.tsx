import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  period: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "default" | "primary" | "highlight";
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter Basic",
    tagline: "Cho doanh nghiệp vừa & nhỏ bắt đầu tuyển dụng",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "mãi mãi",
    features: [
      "Đăng tối đa 3 tin tuyển dụng cùng lúc",
      "Tiếp cận 9.5M+ ứng viên Toppy AI",
      "Quản lý hồ sơ ứng viên cơ bản",
      "Hỗ trợ email trong giờ hành chính",
    ],
    cta: "Bắt đầu miễn phí",
    ctaVariant: "default",
  },
  {
    id: "pro",
    name: "Pro Growth AI",
    tagline: "Cho doanh nghiệp đang mở rộng quy mô nhân sự nhanh",
    monthlyPrice: 1990000,
    yearlyPrice: 1590000,
    period: "/ tháng",
    badge: "Phổ biến nhất",
    popular: true,
    features: [
      "Đăng không giới hạn tin tuyển dụng",
      "AI Candidate Matching Score tự động",
      "Tặng 100 Credit mở khóa CV / tháng",
      "Hệ thống ATS kéo thả Kanban thông minh",
      "Phân quyền phỏng vấn đa phòng ban",
      "Hỗ trợ kỹ thuật ưu tiên 24/7",
    ],
    cta: "Dùng thử Pro 14 ngày",
    ctaVariant: "highlight",
  },
  {
    id: "enterprise",
    name: "Enterprise Custom",
    tagline: "Giải pháp nhân sự toàn diện cho tập đoàn lớn",
    monthlyPrice: 5990000,
    yearlyPrice: 4790000,
    period: "/ tháng",
    features: [
      "Toàn bộ quyền lợi gói Pro Growth",
      "Tùy chỉnh thuật toán AI Matching theo yêu cầu",
      "Tích hợp API với hệ thống HRIS nội bộ",
      "Xây dựng trang Employer Branding chuyên sâu",
      "Account Manager riêng & SLA 99.9%",
      "Ký hợp đồng & Xuất hóa đơn VAT linh hoạt",
    ],
    cta: "Liên hệ tư vấn Enterprise",
    ctaVariant: "primary",
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="py-24 bg-page-bg relative overflow-hidden" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
            Bảng Giá Minh Bạch
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-4 leading-tight">
            Đầu tư thông minh,{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              tối đa hiệu quả
            </span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mt-4 font-normal leading-relaxed">
            Chọn gói dịch vụ phù hợp với mục tiêu và quy mô tuyển dụng của bạn. Không phí ẩn, linh hoạt nâng cấp bất kỳ lúc nào.
          </p>

          {/* Billing Toggle (Monthly / Yearly -20%) */}
          <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-full bg-white border border-gray-200 shadow-xs">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                !isYearly
                  ? "bg-gray-900 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Thanh toán tháng
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isYearly
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Thanh toán năm</span>
              <span className="bg-emerald-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 3-Column Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_TIERS.map((tier, idx) => {
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  tier.popular
                    ? "bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 text-white shadow-2xl border-2 border-emerald-500/80 scale-[1.02] lg:-translate-y-2"
                    : "bg-white text-gray-900 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300"
                }`}
              >
                {/* Popular Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-gray-950 text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                    {tier.badge}
                  </div>
                )}

                <div>
                  {/* Tier Title & Tagline */}
                  <div className="mb-6">
                    <h3 className={`text-xl font-black ${tier.popular ? "text-white" : "text-gray-900"}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-xs mt-1.5 leading-relaxed ${tier.popular ? "text-gray-300" : "text-gray-500"}`}>
                      {tier.tagline}
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="mb-8 pb-6 border-b border-gray-200/60 dark:border-gray-800">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-4xl font-black tracking-tight ${tier.popular ? "text-emerald-400" : "text-gray-900"}`}>
                        {price === 0 ? "0 đ" : `${(price / 1000).toLocaleString("vi-VN")}K`}
                      </span>
                      <span className={`text-xs font-semibold ${tier.popular ? "text-gray-400" : "text-gray-500"}`}>
                        {tier.period}
                      </span>
                    </div>
                    {isYearly && price > 0 && (
                      <p className={`text-[11px] font-semibold mt-1 ${tier.popular ? "text-emerald-300" : "text-emerald-600"}`}>
                        Thanh toán {((price * 12) / 1000000).toFixed(1)} triệu / năm (Đã giảm 20%)
                      </p>
                    )}
                    {price === 0 && (
                      <p className={`text-[11px] font-semibold mt-1 ${tier.popular ? "text-emerald-300" : "text-emerald-600"}`}>
                        Miễn phí mãi mãi · Không cần thẻ tín dụng
                      </p>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 mb-8">
                    <p className={`text-xs font-bold uppercase tracking-wider ${tier.popular ? "text-gray-300" : "text-gray-700"}`}>
                      Quyền lợi bao gồm:
                    </p>
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs font-medium leading-relaxed">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          tier.popular ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </div>
                        <span className={tier.popular ? "text-gray-200" : "text-gray-700"}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div>
                  <a
                    href={tier.id === "enterprise" ? "#contact" : "/register"}
                    className={`w-full h-13 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                      tier.ctaVariant === "highlight"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-gray-950 hover:brightness-110 shadow-lg shadow-emerald-500/25"
                        : tier.ctaVariant === "primary"
                        ? "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise Trust Guarantee Footer */}
        <div className="mt-14 p-6 rounded-3xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Cam kết bảo mật & SLA 99.9% chuẩn Enterprise</p>
              <p className="text-xs text-gray-500">Mã hóa dữ liệu 256-bit AES, tuân thủ tiêu chuẩn bảo vệ dữ liệu nhân sự.</p>
            </div>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-4 py-2 rounded-xl border border-gray-200 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Cần tư vấn gói riêng?</span>
          </a>
        </div>

      </div>
    </section>
  );
}
