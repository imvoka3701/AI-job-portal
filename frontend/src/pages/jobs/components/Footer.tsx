import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Youtube, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { useIsAuthenticated } from "@/stores/authStore";

export function Footer() {
  const SEO_LINKS = [
    "Việc làm Tây Ninh", "Việc làm Đà Lạt", "Việc làm Gia Lai", "Việc làm Nha Trang", "Việc làm Vũng Tàu",
    "Việc làm Marketing tại Hà Nội", "Việc làm IT tại TP.HCM", "Việc làm Kế toán", "Việc làm Bán hàng",
    "Việc làm Tiếng Nhật", "Việc làm Tiếng Anh", "Mẫu CV", "Mẫu đơn xin việc", "Tính lương Gross - Net"
  ];

  const isAuthenticated = useIsAuthenticated();

  return (
    <footer className="w-full bg-white relative font-sans">
      {/* Top CTA Section (Premium SaaS Floating Card) */}
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
                Tham gia mạng lưới 8 triệu+ ứng viên và khám phá hàng ngàn cơ hội IT chất lượng cao được cá nhân hóa bởi AI mỗi ngày.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex shrink-0"
            >
              <Link to={isAuthenticated ? "/candidate" : "/login"}>
                <Button size="lg" className="h-14 px-8 rounded-full bg-white text-[#0A1F1C] hover:bg-emerald-50 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300 group text-base font-semibold">
                  Tạo CV & Tìm việc ngay
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        
        {/* SEO Keywords Block - Tag Cloud Style */}
        <div className="mb-16">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Từ khóa phổ biến</h4>
          <div className="flex flex-wrap gap-2.5">
            {SEO_LINKS.map(link => (
              <a 
                key={link} 
                href="#" 
                className="text-[13px] text-gray-500 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-all duration-200 rounded-full px-4 py-2"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 border-t border-gray-100 pt-16">
          {/* Col 1: Brand & Contact (Takes more space) */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <Link to="/" className="flex items-center gap-3 mb-6 group w-fit">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B86B] to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg select-none">JP</span>
              </div>
              <span className="font-bold text-2xl text-gray-900 tracking-tight">AI Job Portal</span>
            </Link>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Nền tảng tuyển dụng bằng AI hàng đầu Việt Nam. Tối ưu hóa quy trình kết nối nhân tài và doanh nghiệp, mang lại giá trị bền vững cho cộng đồng.
            </p>

            <div className="space-y-4 text-[14px] text-gray-600">
              <div className="flex items-start gap-3 group cursor-default">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block font-medium text-gray-900">1900 0000</span>
                  <span className="text-gray-500 text-xs">(Giờ hành chính)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 group cursor-default">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-gray-600 hover:text-emerald-600 transition-colors">support@aijobportal.vn</span>
              </div>
              <div className="flex items-start gap-3 group cursor-default">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-gray-600 leading-relaxed">Tòa nhà Tech, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Col 2: About */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-bold text-gray-900 mb-6 tracking-tight">Về nền tảng</h4>
            <ul className="space-y-3.5 text-[14px]">
              {['Giới thiệu', 'Góc báo chí', 'Tuyển dụng nội bộ', 'Liên hệ', 'Hỏi đáp', 'Chính sách bảo mật'].map((item) => (
                <li key={item}>
                  <Link to="#" className="group flex items-center text-gray-500 hover:text-emerald-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 -ml-3 mr-1.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Candidates */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-gray-900 mb-6 tracking-tight">Hồ sơ và CV</h4>
            <ul className="space-y-3.5 text-[14px]">
              {['Quản lý CV của bạn', 'Thư viện mẫu CV', 'Review CV bằng AI', 'Mẫu Cover Letter', 'Cẩm nang nghề nghiệp'].map((item) => (
                <li key={item}>
                  <Link to="#" className="group flex items-center text-gray-500 hover:text-emerald-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 -ml-3 mr-1.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Tools & Career */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-gray-900 mb-6 tracking-tight">Công cụ tiện ích</h4>
            <ul className="space-y-3.5 text-[14px]">
              {['Tính lương Gross - Net', 'Tính thuế thu nhập cá nhân', 'Tính lãi suất kép', 'Công cụ AI Matching', 'Trắc nghiệm tính cách (MBTI)'].map((item) => (
                <li key={item}>
                  <Link to="#" className="group flex items-center text-gray-500 hover:text-emerald-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-0 -ml-3 mr-1.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[14px] text-gray-500">
            © {new Date().getFullYear()} AI Job Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ y: -3, scale: 1.1 }}
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
              >
                <Icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
