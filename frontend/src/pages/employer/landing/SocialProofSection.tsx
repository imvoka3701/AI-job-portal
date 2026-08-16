import { motion } from "framer-motion";
import { Building2, CheckCircle2, TrendingUp, Users } from "lucide-react";

const PARTNERS = [
  { name: "FPT Software", label: "Tập đoàn Công nghệ", color: "from-orange-500 to-amber-500" },
  { name: "Viettel Group", label: "Viễn thông & CNTT", color: "from-red-500 to-rose-500" },
  { name: "Vingroup", label: "Đa ngành & Bất động sản", color: "from-blue-600 to-indigo-600" },
  { name: "Techcombank", label: "Ngân hàng số", color: "from-red-600 to-rose-600" },
  { name: "Shopee Vietnam", label: "Thương mại điện tử", color: "from-orange-600 to-amber-600" },
  { name: "Grab Holdings", label: "Siêu ứng dụng", color: "from-emerald-600 to-green-600" },
  { name: "MoMo Fintech", label: "Ví điện tử", color: "from-pink-600 to-rose-600" },
  { name: "MISA Corporation", label: "Phần mềm doanh nghiệp", color: "from-blue-500 to-cyan-500" },
  { name: "VNPT Group", label: "Hạ tầng số quốc gia", color: "from-sky-600 to-blue-600" },
];

export function SocialProofSection() {
  return (
    <section className="py-14 bg-white border-y border-gray-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
              Hơn 200.000+ Doanh Nghiệp Đồng Hành
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              Đối tác tuyển dụng tin cậy của các thương hiệu dẫn đầu
            </h2>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500 font-semibold shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Duyệt tin tức thì</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-100">
              <Users className="w-4 h-4 text-blue-600" />
              <span>9.5M+ Ứng viên</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-700 bg-teal-50/60 px-3 py-1.5 rounded-xl border border-teal-100">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>+250% Ứng tuyển</span>
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Logo Marquee */}
      <div className="relative w-full overflow-hidden flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div
          className="flex items-center gap-6 shrink-0 py-2"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
          {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
            <div
              key={`${partner.name}-${idx}`}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-50/80 hover:bg-white border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all group shrink-0 cursor-default"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${partner.color} flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-gray-800 group-hover:text-emerald-700 transition-colors">
                  {partner.name}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {partner.label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
