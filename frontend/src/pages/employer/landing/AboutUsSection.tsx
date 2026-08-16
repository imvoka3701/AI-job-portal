import { motion } from "framer-motion";
import { Sparkles, Users, Award, ShieldCheck, Zap } from "lucide-react";

export function AboutUsSection() {
  return (
    <section className="py-24 bg-white" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card Wrapper */}
        <div className="bg-gray-50 rounded-lg p-8 sm:p-12 lg:p-16 border border-gray-200/80 shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* LEFT COLUMN — Text Content (col-span-7) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ABOUT US</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Về chúng tôi
              </h2>

              <p className="text-base sm:text-lg text-gray-700 font-semibold leading-relaxed">
                AI Job Portal là đơn vị tiên phong trong lĩnh vực HR Tech tại Việt Nam, xoay quanh hệ sinh thái nhân sự toàn diện với 4 sản phẩm chủ lực:
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong className="text-gray-900 font-bold">Nền tảng tuyển dụng thông minh (AI Job Portal):</strong> Kết nối ứng viên và nhà tuyển dụng bằng công nghệ AI Matching tiên tiến.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong className="text-gray-900 font-bold">Nền tảng thiết lập và đánh giá năng lực (TestCenter):</strong> Đo lường chính xác khung năng lực và kỹ năng ứng viên.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong className="text-gray-900 font-bold">Nền tảng quản lý và gia tăng trải nghiệm nhân viên (HappyTime):</strong> Số hóa chấm công, tính lương và vinh danh nội bộ.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <strong className="text-gray-900 font-bold">Giải pháp quản trị tuyển dụng hiệu suất cao (SHiring):</strong> Tự động hóa phễu tuyển dụng cho doanh nghiệp quy mô lớn.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed pt-2">
                Thông qua việc nghiên cứu và không ngừng phát triển năng lực công nghệ lõi vượt trội (đặc biệt là Trí tuệ nhân tạo - AI), chúng tôi kỳ vọng mang tới giải pháp nhân sự hiệu quả cho thị trường tuyển dụng Việt Nam.
              </p>
            </motion.div>

            {/* RIGHT COLUMN — Ecosystem Green Circle Graphic (col-span-5) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 flex items-center justify-center relative"
            >
              {/* Outer Glow */}
              <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-emerald-200/50 absolute blur-2xl" />

              {/* Main Green Ring Graphic */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-emerald-500 bg-white p-4 shadow-2xl flex flex-col items-center justify-center text-center group hover:scale-105 transition-transform duration-300">
                
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-lg mb-3">
                  <Users className="w-12 h-12" />
                </div>
                <span className="text-xl font-extrabold text-gray-900">HR TECH</span>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-0.5">Ecosystem</span>

                {/* Floating Orbit Node 1 — AI */}
                <div className="absolute -top-3 left-0 sm:-left-4 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center text-emerald-600 font-bold">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Floating Orbit Node 2 — Award */}
                <div className="absolute -top-1 right-0 sm:-right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center text-blue-600 font-bold">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Floating Orbit Node 3 — Shield */}
                <div className="absolute -bottom-3 right-0 sm:-right-2 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center text-primary font-bold">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Floating Orbit Node 4 — Sparkles */}
                <div className="absolute -bottom-3 left-0 sm:-left-4 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center text-amber-600 font-bold">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
