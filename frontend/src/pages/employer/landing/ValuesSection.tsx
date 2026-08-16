import { motion } from "framer-motion";
import { CheckCircle2, Building2, UserCheck } from "lucide-react";

const ENTERPRISE_VALUES = [
  "Đưa tuyển dụng trở thành lợi thế cạnh tranh của doanh nghiệp, gia tăng cơ hội tuyển đúng người, giúp thúc đẩy hoạt động kinh doanh hiệu quả.",
  "Chuẩn hóa toàn bộ quy trình tuyển dụng thông nhất và cải tiến với Talent Acquisition Funnel.",
  "Xây dựng thương hiệu tuyển dụng uy tín, chuyên nghiệp trong mắt ứng viên.",
  "Tiết kiệm thời gian, chi phí cho hoạt động tuyển dụng nhân sự.",
];

const RECRUITER_VALUES = [
  "Quản lý tập trung tất cả các hoạt động tạo ra hiệu quả cho mỗi vị trí tuyển dụng theo chiến dịch tuyển dụng.",
  "Đăng tin tuyển dụng, tạo & quản lý nguồn ứng viên hiệu quả.",
  "Đánh giá ứng viên toàn diện dựa trên dữ liệu cụ thể, giúp định tuyến đưa ra quyết định cung cấp chính xác, giảm tỷ lệ tuyển sai người.",
  "Có tư duy ứng dụng công nghệ trong tuyển dụng xử lý nghiệp vụ tuyển dụng nhanh chóng, thông minh, tổ chức công việc bài bản.",
  "Chủ động lên kế hoạch & tối ưu chi phí tuyển dụng theo các số liệu đo lường.",
];

export function ValuesSection() {
  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200/60" id="values">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            VALUES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 leading-tight">
            Giá trị khi sử dụng Smart Recruitment Platform
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Đồng hành cùng sự phát triển bền vững của doanh nghiệp và nâng tầm trải nghiệm của nhà tuyển dụng.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card 1: Đối với Doanh nghiệp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header Image Illustration Container */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 overflow-hidden mb-8 shadow-md flex items-center justify-center p-6 text-white text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                <div className="relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto shadow-inner">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Bứt phá Tăng trưởng Doanh nghiệp</h3>
                  <p className="text-xs text-emerald-100 max-w-xs mx-auto">
                    Tối ưu nguồn lực nhân sự & chuẩn hóa quy trình Talent Acquisition
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-8 bg-emerald-600 rounded-full" />
                <h3 className="text-2xl font-bold text-gray-900">Đối với Doanh nghiệp</h3>
              </div>

              {/* List */}
              <ul className="space-y-4">
                {ENTERPRISE_VALUES.map((val, i) => (
                  <li key={i} className="flex items-start gap-3.5 text-sm text-gray-600 leading-relaxed font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Card 2: Đối với Nhà tuyển dụng */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Header Image Illustration Container */}
              <div className="relative w-full h-56 sm:h-64 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 overflow-hidden mb-8 shadow-md flex items-center justify-center p-6 text-white text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                <div className="relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto shadow-inner">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Nâng tầm Năng lực Nhà Tuyển Dụng</h3>
                  <p className="text-xs text-blue-100 max-w-xs mx-auto">
                    Nâng cao hiệu suất làm việc & ứng dụng công nghệ AI tự động hóa
                  </p>
                </div>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-2xl font-bold text-gray-900">Đối với Nhà tuyển dụng</h3>
              </div>

              {/* List */}
              <ul className="space-y-4">
                {RECRUITER_VALUES.map((val, i) => (
                  <li key={i} className="flex items-start gap-3.5 text-sm text-gray-600 leading-relaxed font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{val}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
