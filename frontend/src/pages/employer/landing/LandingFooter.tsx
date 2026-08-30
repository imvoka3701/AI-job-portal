import { Facebook, Linkedin, Youtube, Mail, Phone, MapPin, QrCode, ArrowUpRight } from "lucide-react";

const FOOTER_COLUMNS = {
  "Về AI Job Portal": [
    { label: "Giới thiệu công ty", href: "/employer#about" },
    { label: "Hệ sinh thái HR Tech", href: "/employer#about" },
    { label: "Tuyển dụng nội bộ", href: "/jobs?q=AI+Job+Portal" },
    { label: "Liên hệ truyền thông", href: "mailto:support@aijobportal.vn" },
    { label: "Góc báo chí", href: "/ai/matching#knowledge-hub" },
  ],
  "Dành cho Nhà tuyển dụng": [
    { label: "Đăng tin tuyển dụng", href: "/employer/jobs/new" },
    { label: "Tìm kiếm hồ sơ CV", href: "/employer/candidates" },
    { label: "Gói dịch vụ Top Max", href: "/employer#pricing" },
    { label: "Báo giá giải pháp", href: "/employer#pricing" },
    { label: "Cẩm nang tuyển dụng", href: "/ai/matching#knowledge-hub" },
  ],
  "Dành cho Ứng viên": [
    { label: "Mẫu CV xin việc chuẩn", href: "/cv/new" },
    { label: "Tìm việc làm nhanh", href: "/jobs" },
    { label: "Tính lương Gross - Net", href: "/tools" },
    { label: "Trắc nghiệm MBTI", href: "/tools/mbti" },
    { label: "Cẩm nang nghề nghiệp", href: "/ai/matching#knowledge-hub" },
  ],
  "Chính sách & Quy định": [
    { label: "Quy định bảo mật", href: "/tools" },
    { label: "Thỏa thuận sử dụng", href: "/tools" },
    { label: "Quy chế hoạt động", href: "/employer" },
    { label: "Giải quyết tranh chấp", href: "mailto:support@aijobportal.vn" },
    { label: "Chính sách thanh toán", href: "/employer#pricing" },
  ],
};

const ECOSYSTEM_PRODUCTS = [
  {
    name: "AI Job Portal",
    title: "Nền tảng Tuyển dụng thông minh",
    color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    desc: "Kết nối 9.5M+ ứng viên chất lượng cao",
  },
  {
    name: "TestCenter",
    title: "Nền tảng Đánh giá Năng lực",
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    desc: "Số hóa quy trình kiểm tra & phỏng vấn",
  },
  {
    name: "HappyTime",
    title: "Nền tảng Quản lý Nhân sự",
    color: "bg-amber-600 hover:bg-amber-700 text-white",
    desc: "Chấm công, tính lương & vinh danh",
  },
  {
    name: "SHiring",
    title: "Quản trị Tuyển dụng Hiệu suất",
    color: "bg-primary hover:bg-primary-hover text-white",
    desc: "Tự động hóa phễu Talent Acquisition",
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-200">
      
      {/* ── Section 1: Main Footer Links & App Download ──────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1: Brand & App Download */}
          <div className="lg:col-span-1 space-y-4">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base select-none">JP</span>
              </div>
              <span className="font-extrabold text-lg text-gray-900">AI Job Portal</span>
            </a>

            <p className="text-xs text-gray-500 leading-relaxed">
              Hệ sinh thái HR Tech hàng đầu kết nối doanh nghiệp và nhân tài ứng dụng công nghệ AI.
            </p>

            {/* App Store Buttons */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-bold text-gray-700">Tải ứng dụng Nhà tuyển dụng:</p>
              <div className="flex flex-col gap-2">
                <button className="h-10 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                  <span> App Store</span>
                </button>
                <button className="h-10 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                  <span>▶ Google Play</span>
                </button>
              </div>
            </div>
          </div>

          {/* Col 2-5: Nav Link Columns */}
          {Object.entries(FOOTER_COLUMNS).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                {title}
              </h4>
              <ul className="space-y-2.5 text-xs font-medium">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* ── Section 2: Contact & License Info ────────────────────────────────── */}
        <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Contact Text (col-span-8) */}
          <div className="lg:col-span-8 space-y-2 text-xs text-gray-500 leading-relaxed">
            <p className="font-bold text-gray-800 text-sm">
              CÔNG TY CỔ PHẦN CÔNG NGHỆ NHÂN SỰ AI JOB PORTAL VIỆT NAM
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Trụ sở chính: Tầng 15, Tòa nhà FPT Tower, 17 Duy Tân, Cầu Giấy, Hà Nội</span>
            </p>
            <p className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hotline: (024) 6680 5588</span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Email: tuyendung@jobportal.vn</span>
              </span>
            </p>
            <p className="text-[11px] text-gray-400">
              Giấy phép ĐKKD số: 0107895234 do Sở KH&ĐT TP. Hà Nội cấp ngày 15/06/2021.
            </p>
          </div>

          {/* QR Code & Social Links (col-span-4) */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-12 h-12 bg-white rounded-lg p-1 border border-gray-200 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-800" />
              </div>
              <div className="text-[11px]">
                <p className="font-bold text-gray-800">Quét mã QR</p>
                <p className="text-gray-500">Tải app tức thì</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-gray-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-gray-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-gray-600 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ── Section 3: Ecosystem Banner Blocks (Dưới cùng) ───────────────────── */}
      <div className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center sm:text-left">
            Hệ sinh thái sản phẩm HR Tech
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ECOSYSTEM_PRODUCTS.map((prod) => (
              <a
                key={prod.name}
                href="#"
                className={`p-5 rounded-2xl ${prod.color} shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black tracking-tight">{prod.name}</span>
                    <ArrowUpRight className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-xs font-semibold opacity-95">{prod.title}</p>
                </div>
                <p className="text-[11px] opacity-80 mt-3">{prod.desc}</p>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center border-t border-gray-200/80 pt-6">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} AI Job Portal Vietnam. Bản quyền thuộc về Công ty Cổ phần Công nghệ Nhân sự AI Job Portal.
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
}
