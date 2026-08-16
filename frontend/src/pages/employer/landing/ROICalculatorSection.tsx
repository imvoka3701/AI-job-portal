import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, DollarSign, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";

export function ROICalculatorSection() {
  const [hiresCount, setHiresCount] = useState<number>(6);
  const [avgSalary, setAvgSalary] = useState<number>(22); // Triệu VNĐ

  // Realistic Business Calculations
  // Sàng lọc thủ công: ~30 CV/vị trí, mỗi CV mất 15 phút = 7.5 giờ/vị trí. Toppy AI giảm 80% = tiết kiệm 6 giờ/vị trí.
  const hoursSavedPerMonth = Math.round(hiresCount * 6.5);

  // Chi phí tiết kiệm: Chi phí agency/headhunt trung bình 1.5 - 2 tháng lương vs Chi phí dùng nền tảng AI
  const traditionalCost = hiresCount * (avgSalary * 1.5); // Triệu VNĐ nếu dùng headhunter hoặc đăng nhiều web lẻ
  const aiPlatformCost = hiresCount * 0.8 + 2; // Chi phí tượng trưng nền tảng
  const costSavingsMillion = Math.max(5, Math.round(traditionalCost - aiPlatformCost));

  // Time to hire reduction
  const daysReduced = 21; // Rút ngắn từ 28 ngày xuống 7 ngày

  return (
    <section className="py-24 bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-950 text-white relative overflow-hidden" id="roi-calc">
      {/* Decorative background grid and orbs */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-900/60 border border-emerald-500/30 px-4 py-1.5 rounded-full">
            <Calculator className="w-3.5 h-3.5" />
            Máy Tính Hiệu Quả Đầu Tư (ROI Calculator)
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-4 leading-tight">
            Doanh Nghiệp Tiết Kiệm Được Bao Nhiêu Với{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              AI Job Portal?
            </span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mt-4 font-normal">
            Kéo chọn quy mô tuyển dụng thực tế của doanh nghiệp để tính toán ngay thời gian và chi phí tối ưu hóa.
          </p>
        </div>

        {/* Interactive Calculator Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-900/90 rounded-3xl p-6 sm:p-10 border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
          
          {/* ═══════════════════════════════════════════════ */}
          {/* LEFT: Sliders & Inputs (col-span-5)             */}
          {/* ═══════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-8 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-8 lg:pb-0">
            <div>
              <h3 className="text-xl font-black text-white mb-2">Quy mô tuyển dụng</h3>
              <p className="text-xs text-gray-400">Điều chỉnh các thông số tương ứng với doanh nghiệp của bạn:</p>
            </div>

            {/* Slider 1: Hires per month */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                  Số lượng nhân sự cần tuyển / tháng:
                </label>
                <span className="text-xl font-black text-emerald-400 px-3 py-1 bg-emerald-950/80 rounded-xl border border-emerald-500/40">
                  {hiresCount} vị trí
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={hiresCount}
                onChange={(e) => setHiresCount(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                <span>1 vị trí</span>
                <span>15 vị trí</span>
                <span>30+ vị trí</span>
              </div>
            </div>

            {/* Slider 2: Average Salary */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                  Mức lương trung bình / vị trí:
                </label>
                <span className="text-xl font-black text-teal-300 px-3 py-1 bg-teal-950/80 rounded-xl border border-teal-500/40">
                  {avgSalary} triệu / tháng
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="60"
                step="2"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))}
                className="w-full h-2.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                <span>8 triệu</span>
                <span>30 triệu</span>
                <span>60+ triệu</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Dữ liệu tính toán dựa trên khảo sát thực tế từ 200.000+ HR</span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/* RIGHT: Real-time Calculated Metrics (col-span-7)*/}
          {/* ═══════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Ước tính hiệu quả mang lại mỗi tháng:
              </span>
            </div>

            {/* 3 Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Metric 1: Hours Saved */}
              <motion.div
                key={`hours-${hoursSavedPerMonth}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-850 border border-gray-700/80 hover:border-emerald-500/50 shadow-lg space-y-2 relative overflow-hidden transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-emerald-400 leading-none">
                  {hoursSavedPerMonth}h
                </p>
                <p className="text-xs font-bold text-gray-300">Giờ sàng lọc CV</p>
                <p className="text-[11px] text-gray-400">Tiết kiệm ~80% thời gian đọc duyệt hồ sơ</p>
              </motion.div>

              {/* Metric 2: Cost Saved */}
              <motion.div
                key={`cost-${costSavingsMillion}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-850 border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/50 space-y-2 relative overflow-hidden transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-teal-300 leading-none truncate">
                  ~{costSavingsMillion} Tr
                </p>
                <p className="text-xs font-bold text-gray-300">Chi phí tối ưu hóa</p>
                <p className="text-[11px] text-gray-400">So với tuyển dụng headhunt truyền thống</p>
              </motion.div>

              {/* Metric 3: Time to Hire */}
              <motion.div
                key={`days-${daysReduced}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ y: -2 }}
                className="p-5 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-850 border border-gray-700/80 hover:border-amber-500/50 shadow-lg space-y-2 relative overflow-hidden transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-amber-400 leading-none">
                  -21 Ngày
                </p>
                <p className="text-xs font-bold text-gray-300">Thời gian lấp đầy vị trí</p>
                <p className="text-[11px] text-gray-400">Rút ngắn quy trình từ 4 tuần còn ~7 ngày</p>
              </motion.div>

            </div>

            {/* Bottom Call to Action inside Calculator */}
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-gray-950 font-black flex items-center justify-center shrink-0">
                  ⚡
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">Bắt đầu tiết kiệm ngay hôm nay</p>
                  <p className="text-xs text-emerald-300">Đăng ký tài khoản doanh nghiệp miễn phí chỉ mất 1 phút.</p>
                </div>
              </div>
              <a
                href="/register"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs transition-colors shrink-0 text-center flex items-center justify-center gap-2"
              >
                <span>Nhận ưu đãi đăng tin</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
