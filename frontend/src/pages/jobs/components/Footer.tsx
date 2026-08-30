import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Youtube, 
  ArrowRight, ShieldCheck, FileText, Newspaper, 
  Briefcase, CheckCircle2 
} from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { useIsAuthenticated } from "@/stores/authStore";

type PolicyType = "privacy" | "terms" | "faq" | "press" | "internal_jobs" | null;

export function Footer({ showTopCTA = true }: { showTopCTA?: boolean }) {
  const isAuthenticated = useIsAuthenticated();
  const [activeModal, setActiveModal] = useState<PolicyType>(null);

  const SEO_LINKS = [
    "Việc làm Frontend", "Việc làm Backend", "Việc làm Fullstack", "Việc làm DevOps", 
    "Việc làm AI / ML", "Việc làm Golang", "Việc làm React", "Việc làm Node.js", 
    "Việc làm Python", "Việc làm Tester / QA", "Mẫu CV Chuẩn ATS", "Tính Lương Gross Net"
  ];

  return (
    <footer className="w-full bg-white relative font-sans border-t border-slate-100">
      {/* Top CTA Section (Premium SaaS Floating Card) */}
      {showTopCTA && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-24 mb-16">
          <div className="relative rounded-[32px] overflow-hidden bg-[#0A1F1C] border border-emerald-900/30 shadow-2xl shadow-emerald-900/20">
            {/* Abstract background graphics */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/3 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            
            <div className="relative z-10 px-8 py-12 md:px-16 md:py-14 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="text-left max-w-2xl">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-5 leading-[1.1]"
                >
                  Sẵn sàng để <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">nâng tầm</span> sự nghiệp?
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-emerald-50/70 text-lg md:text-xl font-light"
                >
                  Tham gia mạng lưới nhân tài công nghệ và khám phá hàng ngàn cơ hội IT chất lượng cao được đối soát bởi thuật toán AI Matching.
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex shrink-0"
              >
                <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                  <Button size="lg" className="h-14 px-8 rounded-full bg-white text-[#0A1F1C] hover:bg-emerald-50 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300 group text-base font-semibold cursor-pointer">
                    Tạo CV & Tìm việc ngay
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        
        {/* SEO Keywords Block */}
        <div className="mb-14">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Từ khóa tìm kiếm phổ biến</h4>
          <div className="flex flex-wrap gap-2">
            {SEO_LINKS.map(link => (
              <Link 
                key={link} 
                to="/jobs" 
                className="text-xs text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/70 hover:border-emerald-300 transition-all duration-200 rounded-full px-3.5 py-1.5 font-medium"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 border-t border-slate-100 pt-12">
          {/* Col 1: Brand & Contact */}
          <div className="lg:col-span-4 pr-0 lg:pr-8 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00B86B] to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-base select-none">JP</span>
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">AI Job Portal</span>
            </Link>
            
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Nền tảng tuyển dụng bằng AI hàng đầu. Tự động hóa đánh giá năng lực, tối ưu cấu trúc CV chuẩn ATS và kết nối chuẩn xác nhân tài với doanh nghiệp.
            </p>

            <div className="space-y-3.5 text-xs text-slate-600 pt-2">
              <a href="tel:19000000" className="flex items-start gap-3 group cursor-pointer">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">1900 0000</span>
                  <span className="text-slate-400 text-[11px]">(Hỗ trợ kỹ thuật 8:00 - 18:00)</span>
                </div>
              </a>
              <a href="mailto:support@aijobportal.vn" className="flex items-center gap-3 group cursor-pointer">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-slate-600 group-hover:text-emerald-600 transition-colors font-medium">support@aijobportal.vn</span>
              </a>
              <div className="flex items-start gap-3 cursor-default">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-slate-600 leading-relaxed font-normal">Tòa nhà Innovation Hub, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Col 2: Về nền tảng */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-bold text-slate-900 mb-5 text-sm tracking-tight">Về nền tảng</h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/employer" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Giới thiệu doanh nghiệp
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal("press")} 
                  className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium cursor-pointer text-left"
                >
                  Góc báo chí & Truyền thông
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal("internal_jobs")} 
                  className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium cursor-pointer text-left"
                >
                  Tuyển dụng nội bộ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal("faq")} 
                  className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium cursor-pointer text-left"
                >
                  Câu hỏi thường gặp (FAQ)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal("privacy")} 
                  className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium cursor-pointer text-left"
                >
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal("terms")} 
                  className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium cursor-pointer text-left"
                >
                  Điều khoản sử dụng
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hồ sơ và CV */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-5 text-sm tracking-tight">Hồ sơ & CV</h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/cv" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Quản lý CV cá nhân
                </Link>
              </li>
              <li>
                <Link to="/cv/new" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Tạo CV chuẩn ATS mới
                </Link>
              </li>
              <li>
                <Link to="/ai/matching" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Phân tích & AI Matching
                </Link>
              </li>
              <li>
                <Link to="/ai/roadmap" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Lộ trình học bù kỹ năng
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Khám phá việc làm IT
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Công cụ tiện ích */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-slate-900 mb-5 text-sm tracking-tight">Công cụ tiện ích</h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/tools" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Tính lương Gross ⇄ Net (Bảo hiểm 2026)
                </Link>
              </li>
              <li>
                <Link to="/tools/mbti" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Trắc nghiệm tính cách nghề nghiệp (MBTI)
                </Link>
              </li>
              <li>
                <Link to="/tools/mi" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Trắc nghiệm Đa trí thông minh (MI)
                </Link>
              </li>
              <li>
                <Link to="/tools/assessments/history" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Lịch sử kết quả làm bài trắc nghiệm
                </Link>
              </li>
              <li>
                <Link to="/employer" className="text-slate-600 hover:text-emerald-600 transition-colors block py-0.5 font-medium">
                  Cổng thông tin Nhà tuyển dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AI Job Portal Enterprise. Nền tảng tuyển dụng công nghệ thế hệ mới.
          </p>
          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
              { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
              { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
              { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  whileHover={{ y: -2, scale: 1.08 }}
                  className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-2xs"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MODALS FOR POLICY, TERMS, FAQ & INFO ──────────────────────── */}

      {/* 1. Privacy Policy Modal */}
      <Modal
        isOpen={activeModal === "privacy"}
        onClose={() => setActiveModal(null)}
        title="Chính Sách Bảo Mật Dữ Liệu & Thông Tin Cá Nhân"
        size="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Cam kết bảo mật 100% dữ liệu ứng viên & doanh nghiệp</div>
              <div className="text-xs text-emerald-700 mt-0.5">AI Job Portal tuân thủ nghiêm ngặt tiêu chuẩn bảo mật dữ liệu quốc tế ISO 27001 và GDPR.</div>
            </div>
          </div>

          <h4 className="font-bold text-slate-900 text-sm">1. Mục đích thu thập dữ liệu</h4>
          <p>Hệ thống chỉ thu thập các thông tin cần thiết phục vụ cho việc tạo CV chuẩn ATS, đối soát độ khớp công việc bằng mô hình AI Vector Embedding và liên hệ phỏng vấn khi có sự đồng ý của bạn.</p>

          <h4 className="font-bold text-slate-900 text-sm">2. Mã hóa và lưu trữ</h4>
          <p>Mật khẩu được băm (hash) bằng thuật toán bcrypt an toàn. Dữ liệu CV và lịch sử làm bài trắc nghiệm được mã hóa trong cơ sở dữ liệu PostgreSQL an toàn và không bao giờ chia sẻ cho bên thứ ba trái phép.</p>

          <h4 className="font-bold text-slate-900 text-sm">3. Quyền của người dùng</h4>
          <p>Bạn có toàn quyền chỉnh sửa, tải xuống bản sao lưu hoặc yêu cầu xóa vĩnh viễn hồ sơ và dữ liệu cá nhân bất kỳ lúc nào trong Bàn làm việc ứng viên.</p>
        </div>
      </Modal>

      {/* 2. Terms of Service Modal */}
      <Modal
        isOpen={activeModal === "terms"}
        onClose={() => setActiveModal(null)}
        title="Điều Khoản & Thỏa Thuận Sử Dụng Dịch Vụ"
        size="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Quy chế sử dụng nền tảng AI Job Portal</div>
              <div className="text-xs text-slate-500 mt-0.5">Vui lòng đọc kỹ trước khi đăng ký tài khoản hoặc sử dụng các công cụ AI.</div>
            </div>
          </div>

          <h4 className="font-bold text-slate-900 text-sm">1. Trách nhiệm của Ứng viên</h4>
          <p>Ứng viên cam kết cung cấp thông tin trung thực về học vấn, kỹ năng và kinh nghiệm làm việc trong hồ sơ CV nhằm đảm bảo thuật toán AI Matching đưa ra kết quả phân tích chính xác nhất.</p>

          <h4 className="font-bold text-slate-900 text-sm">2. Trách nhiệm của Doanh nghiệp</h4>
          <p>Nhà tuyển dụng cam kết các tin đăng tuyển là có thật, minh bạch về mức lương và chế độ đãi ngộ, tuyệt đối không thu bất kỳ chi phí nào của người tìm việc.</p>

          <h4 className="font-bold text-slate-900 text-sm">3. Sử dụng công cụ AI</h4>
          <p>Kết quả tính điểm AI Matching và lộ trình học tập đóng vai trò khuyến nghị và hỗ trợ tối ưu hóa quá trình tuyển dụng, không thay thế hoàn toàn quyết định phỏng vấn trực tiếp của doanh nghiệp.</p>
        </div>
      </Modal>

      {/* 3. FAQ Modal */}
      <Modal
        isOpen={activeModal === "faq"}
        onClose={() => setActiveModal(null)}
        title="Câu Hỏi Thường Gặp (FAQ)"
        size="lg"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Sử dụng các công cụ AI trên hệ thống có mất phí không?
            </h4>
            <p className="text-slate-600 text-xs">
              Hoàn toàn miễn phí 100% dành cho Ứng viên (Bao gồm tạo CV chuẩn ATS, phân tích AI Matching, trắc nghiệm MBTI và xây dựng lộ trình học tập).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Điểm AI Matching được tính toán như thế nào?
            </h4>
            <p className="text-slate-600 text-xs">
              Hệ thống sử dụng mô hình Vector Embedding 1536 chiều kết hợp thuật toán Cosine Distance trong pgvector để đối soát ngữ nghĩa chuyên sâu giữa CV và JD công việc trong chưa đầy 50ms.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Làm thế nào để ứng tuyển vào các vị trí đăng tuyển?
            </h4>
            <p className="text-slate-600 text-xs">
              Bạn chỉ cần tạo CV trên hệ thống, chọn công việc mong muốn tại trang Tìm việc làm và bấm nút "Ứng tuyển ngay". Hồ sơ của bạn sẽ được gửi thẳng tới bộ phận tuyển dụng.
            </p>
          </div>
        </div>
      </Modal>

      {/* 4. Press Modal */}
      <Modal
        isOpen={activeModal === "press"}
        onClose={() => setActiveModal(null)}
        title="Góc Báo Chí & Liên Hệ Truyền Thông"
        size="md"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-3">
            <Newspaper className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Ban Truyền thông & Quan hệ Báo chí</div>
              <div className="text-xs text-slate-500 mt-0.5">AI Job Portal luôn sẵn sàng hợp tác đưa tin, phỏng vấn chuyên đề về HR Tech và thị trường lao động số.</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900">Thông tin liên hệ báo chí:</p>
            <p>• Email: <span className="font-semibold text-emerald-600">press@aijobportal.vn</span></p>
            <p>• Hotline truyền thông: <span className="font-semibold text-slate-900">0988 000 999</span></p>
            <p>• Bộ nhận diện thương hiệu (Media Kit): Có sẵn logo vector, banner và báo cáo thị trường IT thường niên.</p>
          </div>
        </div>
      </Modal>

      {/* 5. Internal Jobs Modal */}
      <Modal
        isOpen={activeModal === "internal_jobs"}
        onClose={() => setActiveModal(null)}
        title="Cơ Hội Nghề Nghiệp Tại AI Job Portal"
        size="md"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Gia nhập đội ngũ phát triển AI Job Portal</div>
              <div className="text-xs text-emerald-700 mt-0.5">Môi trường làm việc năng động, đãi ngộ cạnh tranh cùng các bài toán AI quy mô lớn.</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900">Các vị trí đang mở:</p>
            <p>• Senior Fullstack Engineer (React / FastAPI / PostgreSQL)</p>
            <p>• AI / NLP Research Engineer (Vector Search & LLM Fine-tuning)</p>
            <p>• Enterprise B2B Sales Executive (HR Tech Solutions)</p>
            <p className="pt-2 text-slate-500 italic">Vui lòng gửi CV trực tiếp về: <span className="font-bold text-emerald-600">careers@aijobportal.vn</span></p>
          </div>
        </div>
      </Modal>

    </footer>
  );
}
