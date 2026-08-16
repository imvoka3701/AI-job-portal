import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

const BENTO_FEATURES = [
  {
    id: "ai-matching",
    colSpan: "lg:col-span-8",
    num: "01",
    tag: "CÔNG NGHỆ CỐT LÕI",
    title: "AI Candidate Matching & Scoring Độc Quyền",
    desc: "Thuật toán Toppy AI bóc tách sâu cấu trúc CV đa ngôn ngữ, tự động xếp hạng độ tương thích theo thang điểm 100% dựa trên yêu cầu kỹ năng, kinh nghiệm thực tế và văn hóa doanh nghiệp.",
    image3d: "/images/ai_3d_matching_core.jpg",
    bgAccent: "bg-emerald-50/50",
    borderAccent: "border-emerald-200/80",
    previewType: "matching-3d",
  },
  {
    id: "ocr-parsing",
    colSpan: "lg:col-span-4",
    num: "02",
    tag: "AI OCR PARSER",
    title: "Bóc tách CV Mọi Định Dạng",
    desc: "Chuyển đổi tức thì file PDF, DOCX, ảnh chụp scan thành hồ sơ chuẩn hóa dữ liệu chỉ trong 1.5 giây.",
    bgAccent: "bg-blue-50/50",
    borderAccent: "border-blue-200/80",
    previewType: "badge-list",
  },
  {
    id: "ats-pipeline",
    colSpan: "lg:col-span-4",
    num: "03",
    tag: "QUY TRÌNH TINH GỌN",
    title: "ATS Pipeline Kéo Thả Trực Quan",
    desc: "Quản lý liền mạch các vòng tuyển dụng: Ứng tuyển → Duyệt CV → Phỏng vấn chuyên môn → Trúng tuyển.",
    bgAccent: "bg-violet-50/50",
    borderAccent: "border-violet-200/80",
    previewType: "pipeline-visual",
  },
  {
    id: "analytics",
    colSpan: "lg:col-span-8",
    num: "04",
    tag: "REALTIME ANALYTICS",
    title: "Báo Cáo & Phân Tích Hiệu Suất Tuyển Dụng Realtime",
    desc: "Bảng dữ liệu phân tích phễu chuyển đổi ứng viên, thời gian xử lý hồ sơ (Time-to-hire) và chi phí cho từng nguồn ứng viên giúp HR Lead đưa ra quyết định dựa trên dữ liệu chính xác.",
    image3d: "/images/analytics_3d_growth.jpg",
    bgAccent: "bg-amber-50/50",
    borderAccent: "border-amber-200/80",
    previewType: "growth-3d",
  },
  {
    id: "collaboration",
    colSpan: "lg:col-span-6",
    num: "05",
    tag: "TEAM COLLABORATION",
    title: "Đánh Giá & Chấm Điểm Ứng Viên Đa Tầng",
    desc: "HR và Hiring Manager cùng chấm điểm, để lại nhận xét nội bộ (Internal Notes) và gửi phản hồi cho ứng viên tức thì.",
    bgAccent: "bg-teal-50/50",
    borderAccent: "border-teal-200/80",
    previewType: "collab-preview",
  },
  {
    id: "boost",
    colSpan: "lg:col-span-6",
    num: "06",
    tag: "TỐI ƯU HIỂN THỊ",
    title: "Đẩy Tin Tự Động & Lan Tỏa Đa Kênh",
    desc: "Tự động phân phối tin tuyển dụng lên Top đề xuất, gửi email gợi ý việc làm tự động tới hơn 9.5 triệu ứng viên phù hợp.",
    bgAccent: "bg-rose-50/50",
    borderAccent: "border-rose-200/80",
    previewType: "boost-preview",
  },
];

export function CoreFunctionsSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Hệ Sinh Thái Tính Năng Đột Phá
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            6 Trụ Cột Công Nghệ AI{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Tăng Tốc Tuyển Dụng
            </span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mt-4 font-normal">
            Thiết kế theo chuẩn B2B SaaS hiện đại — giúp đội ngũ HR tối ưu hóa thời gian và nâng cao chất lượng nhân sự đầu vào.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {BENTO_FEATURES.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className={`${item.colSpan} relative rounded-3xl p-8 border ${item.borderAccent} ${item.bgAccent} backdrop-blur-xs flex flex-col justify-between group hover:shadow-lg transition-all duration-300`}
            >
              <div>
                {/* Top bar: Number & Tag */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/60 border border-emerald-200/60 px-3 py-1 rounded-md">
                    {item.tag}
                  </span>
                  <span className="text-sm font-black text-gray-300 font-mono">
                    {item.num}
                  </span>
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* 3D Visual Artwork Centerpiece for Feature 01 */}
              {item.previewType === "matching-3d" && (
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
                  <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-md border border-emerald-100">
                    <img src={item.image3d} alt="AI 3D Core" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                      <span>Độ chính xác khớp kỹ năng:</span>
                      <span className="text-emerald-600 font-black">96.8%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[96%]" />
                    </div>
                    <p className="text-[11px] text-gray-500">Tự động đối sánh 38+ tiêu chí kỹ thuật và kinh nghiệm thực chiến</p>
                  </div>
                </div>
              )}

              {/* 3D Visual Artwork for Feature 04 */}
              {item.previewType === "growth-3d" && (
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
                  <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-md border border-amber-100">
                    <img src={item.image3d} alt="Growth 3D" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Time to hire</p>
                      <p className="text-lg font-black text-emerald-600">5 ngày <span className="text-[10px] text-gray-400 font-normal">(-70%)</span></p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Chi phí tuyển</p>
                      <p className="text-lg font-black text-blue-600">Tiết kiệm 65%</p>
                    </div>
                  </div>
                </div>
              )}

              {item.previewType === "badge-list" && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {["PDF Auto-read", "Word .docx", "Image OCR", "GitHub Sync", "LinkedIn Parser"].map((b) => (
                    <span key={b} className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
                      ✓ {b}
                    </span>
                  ))}
                </div>
              )}

              {item.previewType === "pipeline-visual" && (
                <div className="mt-6 flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-200/80 text-xs">
                  <span className="font-bold text-gray-600">Ứng tuyển</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">AI Duyệt</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-bold text-gray-600">Phỏng vấn</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-bold text-emerald-700">Offer</span>
                </div>
              )}

              {item.previewType === "collab-preview" && (
                <div className="mt-6 p-3 rounded-2xl bg-white border border-gray-200/80 text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">Đánh giá nội bộ đa chiều:</p>
                  <p className="text-[11px] text-gray-500">Phân quyền HR, Hiring Manager, Technical Interviewer rõ ràng.</p>
                </div>
              )}

              {item.previewType === "boost-preview" && (
                <div className="mt-6 p-3 rounded-2xl bg-white border border-gray-200/80 text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">Tăng 300% lượt hiển thị bài đăng:</p>
                  <p className="text-[11px] text-gray-500">Tự động đẩy tin lên Top việc làm nổi bật và email việc làm tuần.</p>
                </div>
              )}

              {/* Bottom Action Link */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                <span>Khám phá tính năng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
