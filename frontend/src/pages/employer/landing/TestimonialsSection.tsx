import { motion } from "framer-motion";
import { Star, Quote, Building2, TrendingUp } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Kể từ khi áp dụng Toppy AI Matching, team HR của chúng tôi giảm được 70% thời gian đọc CV thủ công. Các ứng viên đề xuất khớp đến 95% yêu cầu kỹ thuật thực tế.",
    name: "Nguyễn Thanh Hương",
    title: "Head of Talent Acquisition",
    company: "FPT Software",
    companyCategory: "Công nghệ thông tin",
    metric: "Giảm 70% thời gian tuyển",
    rating: 5,
    avatar: "NH",
    avatarGrad: "from-emerald-500 to-teal-600",
  },
  {
    quote: "Giao diện ATS dạng split-pane và câu hỏi phỏng vấn gợi ý tự động bởi AI cực kỳ hữu ích cho các Hiring Manager khi phỏng vấn ứng viên Senior Tech. Tuyển thành công 15 kỹ sư trong 2 tuần!",
    name: "Trần Minh Khoa",
    title: "Engineering Director",
    company: "VNG Corporation",
    companyCategory: "Gaming & Internet",
    metric: "15 Senior Hired / 2 Tuần",
    rating: 5,
    avatar: "TK",
    avatarGrad: "from-blue-500 to-indigo-600",
  },
  {
    quote: "Trang Employer Branding và gói dịch vụ Top Jobs giúp lượt ứng tuyển chất lượng cao vào ngân hàng chúng tôi tăng gấp 3 lần so với các kênh đăng tin truyền thống.",
    name: "Lê Phương Thảo",
    title: "HR Director",
    company: "Techcombank",
    companyCategory: "Ngân hàng & Tài chính",
    metric: "+300% Lượt ứng tuyển",
    rating: 5,
    avatar: "LT",
    avatarGrad: "from-rose-500 to-pink-600",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50/80 relative overflow-hidden" id="testimonials">
      {/* Ambient background decoration */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full">
            <Quote className="w-3.5 h-3.5 text-emerald-600" />
            Khách Hàng Nói Về Chúng Tôi
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mt-4 leading-tight">
            Được Tin Dùng Bởi{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              HR Leaders Hàng Đầu
            </span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-4 font-normal">
            Lắng nghe chia sẻ thực tế từ các Giám đốc Nhân sự và Trưởng bộ phận tuyển dụng tại các tập đoàn lớn.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {TESTIMONIALS.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                {/* Top: Star rating & Key metric pill */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {item.metric}
                  </span>
                </div>

                {/* Quote body */}
                <blockquote className="text-sm text-gray-700 leading-relaxed font-normal mb-8 relative">
                  <span className="text-3xl text-emerald-200 font-serif leading-none mr-1 select-none">“</span>
                  {item.quote}
                  <span className="text-3xl text-emerald-200 font-serif leading-none ml-1 select-none">”</span>
                </blockquote>
              </div>

              {/* Author Footer */}
              <div className="flex items-center gap-3.5 pt-6 border-t border-gray-100">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.avatarGrad} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0`}>
                  {item.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-emerald-700">
                    <Building2 className="w-3 h-3 text-emerald-600" />
                    <span>{item.company}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Trust Metrics Bar */}
        <div className="mt-14 p-6 rounded-3xl bg-white border border-gray-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-emerald-700">4.9 / 5.0</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">Điểm hài lòng từ 5.000+ đánh giá</p>
          </div>
          <div>
            <p className="text-3xl font-black text-blue-700">98.2%</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">Tỷ lệ gia hạn hợp đồng hàng năm</p>
          </div>
          <div>
            <p className="text-3xl font-black text-teal-700">80%</p>
            <p className="text-xs text-gray-500 font-semibold mt-1">Thời gian tuyển dụng được rút ngắn</p>
          </div>
        </div>

      </div>
    </section>
  );
}
