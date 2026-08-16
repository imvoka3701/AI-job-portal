import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, ArrowRight, ShieldCheck, Clock, Gift, Sparkles, Building, PhoneCall } from "lucide-react";

export function ContactFormSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState("pro");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section className="py-24 bg-gray-50/50 relative overflow-hidden" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Luxury Dark Emerald Container */}
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-950 border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 overflow-hidden p-8 sm:p-12 lg:p-16 text-white">
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Grid background matrix */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(#10b981 1.5px, transparent 1.5px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* ═══════════════════════════════════════════════ */}
            {/* LEFT COLUMN — Value Proposition & Live SLA     */}
            {/* ═══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-7"
            >
              {/* Header Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Enterprise Consultation
                </span>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Chuyên viên sẵn sàng 24/7</span>
                </div>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                  Bứt phá hiệu quả{" "}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                    tuyển dụng
                  </span>{" "}
                  cùng chuyên gia Toppy AI
                </h2>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-4 font-normal">
                  Nhận tư vấn giải pháp tuyển dụng may đo theo từng quy mô doanh nghiệp. Trực tiếp trải nghiệm thuật toán Toppy AI matching trên chính JD thực tế của bạn.
                </p>
              </div>

              {/* 3 Interactive Highlight Benefit Cards */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: Clock,
                    title: "Cam kết phản hồi trong 15 phút",
                    desc: "Chuyên viên giải pháp liên hệ tư vấn trực tiếp 1-1 không chờ đợi.",
                    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                  },
                  {
                    icon: Gift,
                    title: "Tặng 50 Credit mở khóa CV ứng viên",
                    desc: "Trải nghiệm nguồn ứng viên chủ động chất lượng cao ngay khi đăng ký.",
                    color: "text-teal-300 bg-teal-500/10 border-teal-500/30",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Bảo mật dữ liệu chuẩn Enterprise",
                    desc: "Mã hóa 256-bit AES, cam kết bảo vệ dữ liệu nhân sự tuyệt đối.",
                    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition-all flex items-start gap-3.5"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust bar */}
              <div className="flex items-center gap-6 text-xs text-gray-400 font-semibold pt-1 border-t border-gray-800">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Building className="w-4 h-4" /> 200.000+ Doanh nghiệp
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-teal-300">
                  <PhoneCall className="w-4 h-4" /> Hotline: (024) 6680 5588
                </span>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════ */}
            {/* RIGHT COLUMN — Glassmorphic Consultation Form   */}
            {/* ═══════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-6"
            >
              <div className="bg-gray-900/90 backdrop-blur-xl rounded-3xl p-7 sm:p-9 border border-gray-700/80 shadow-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white">
                    Đăng ký nhận tư vấn & trải nghiệm AI
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Điền thông tin bên dưới — chuyên viên tư vấn sẽ liên hệ lại trong vòng 15 phút
                  </p>
                </div>

                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-white">Gửi yêu cầu thành công!</h4>
                    <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                      Cảm ơn bạn. Chuyên viên tư vấn AI Job Portal sẽ liên hệ lại qua điện thoại / email trong vòng 15 phút.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-2.5 rounded-xl border border-emerald-500/60 text-emerald-300 text-xs font-bold hover:bg-emerald-950/60 transition-colors cursor-pointer"
                    >
                      Gửi yêu cầu khác
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                        Họ và tên người liên hệ <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn Hoàng"
                        className="w-full h-11 px-4 rounded-xl border border-gray-700 bg-gray-800/80 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                          Email doanh nghiệp <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="hr@company.com"
                          className="w-full h-11 px-4 rounded-xl border border-gray-700 bg-gray-800/80 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                          Số điện thoại <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0988 123 456"
                          className="w-full h-11 px-4 rounded-xl border border-gray-700 bg-gray-800/80 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* City (34 provinces) & Company Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                          Tên Doanh Nghiệp <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Công ty Cổ phần ABC"
                          className="w-full h-11 px-4 rounded-xl border border-gray-700 bg-gray-800/80 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                          Khu vực tuyển dụng <span className="text-rose-400">*</span>
                        </label>
                        <select
                          required
                          className="w-full h-11 px-4 rounded-xl border border-gray-700 bg-gray-800/80 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        >
                          <option value="" className="bg-gray-900 text-gray-400">Chọn Tỉnh / Thành phố</option>
                          <option value="hanoi" className="bg-gray-900 text-white">Hà Nội</option>
                          <option value="hcm" className="bg-gray-900 text-white">TP. Hồ Chí Minh</option>
                          <option value="danang" className="bg-gray-900 text-white">Đà Nẵng</option>
                          <option value="haiphong" className="bg-gray-900 text-white">Hải Phòng</option>
                          <option value="cantho" className="bg-gray-900 text-white">Cần Thơ</option>
                          <option value="binhduong" className="bg-gray-900 text-white">Bình Dương</option>
                          <option value="dongnai" className="bg-gray-900 text-white">Đồng Nai</option>
                          <option value="quangninh" className="bg-gray-900 text-white">Quảng Ninh</option>
                          <option value="bacninh" className="bg-gray-900 text-white">Bắc Ninh</option>
                          <option value="hue" className="bg-gray-900 text-white">Thừa Thiên Huế</option>
                          <option value="other" className="bg-gray-900 text-white">Toàn quốc (34 Tỉnh/Thành)</option>
                        </select>
                      </div>
                    </div>

                    {/* Service Package Selection Tabs */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide mb-2">
                        Gói giải pháp mong muốn:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "free", label: "Đăng tin Free" },
                          { id: "pro", label: "Pro Growth AI" },
                          { id: "enterprise", label: "Enterprise" },
                        ].map((pkg) => {
                          const isSelected = selectedService === pkg.id;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setSelectedService(pkg.id)}
                              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                                isSelected
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs"
                                  : "bg-gray-800/60 border-gray-700/60 text-gray-400 hover:text-white"
                              }`}
                            >
                              {pkg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-13 mt-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-gray-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <span>Đang xử lý thông tin...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Gửi yêu cầu nhận tư vấn & Demo trong 15 phút</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
