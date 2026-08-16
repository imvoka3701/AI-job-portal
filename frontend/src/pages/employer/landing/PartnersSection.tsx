import { motion } from "framer-motion";
import { Building, Newspaper } from "lucide-react";

const CLIENTS = [
  "VIETTEL", "VINGROUP", "FPT SOFTWARE", "TECHCOMBANK",
  "VPBANK", "SHOPEE", "SAMSUNG", "VINAMILK",
  "MB BANK", "MOMO", "GRAB", "SUN GROUP"
];

const MEDIA_PARTNERS = [
  "VTV1 - TRUYỀN HÌNH VIỆT NAM",
  "VNEXPRESS",
  "BÁO DÂN TRÍ",
  "BÁO TUỔI TRẺ",
  "BÁO THANH NIÊN",
  "BÁO ĐẦU TƯ",
  "HTV9 - TRUYỀN HÌNH TP.HCM",
  "CAFEF"
];

export function PartnersSection() {
  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200/60" id="partners">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
            TRUSTED PARTNERS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-4 leading-tight">
            Khách hàng & Đối tác truyền thông
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-3">
            Được tin tưởng bởi hơn 200.000+ doanh nghiệp hàng đầu và bảo trợ truyền thông từ các đài truyền hình, báo chí lớn.
          </p>
        </div>

        {/* Grid 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Card Left: Khách hàng tiêu biểu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Khách hàng tiêu biểu</h3>
                <p className="text-xs text-gray-500">200.000+ thương hiệu tin dùng</p>
              </div>
            </div>

            {/* Logo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CLIENTS.map((name) => (
                <div
                  key={name}
                  className="h-16 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center p-3 text-center hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors group"
                >
                  <span className="text-xs font-black tracking-wider text-gray-500 group-hover:text-emerald-700 transition-colors">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card Right: Đối tác truyền thông */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-lg p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Đối tác truyền thông</h3>
                <p className="text-xs text-gray-500">Đồng hành đưa tin uy tín</p>
              </div>
            </div>

            {/* Logo Grid */}
            <div className="grid grid-cols-2 gap-4">
              {MEDIA_PARTNERS.map((name) => (
                <div
                  key={name}
                  className="h-20 rounded-xl bg-gray-50 border border-gray-200/60 flex items-center justify-center p-4 text-center hover:bg-blue-50/50 hover:border-blue-200 transition-colors group"
                >
                  <span className="text-xs font-black tracking-wider text-gray-500 group-hover:text-blue-700 transition-colors">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
