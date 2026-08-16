import { useState, useEffect } from "react";
import { Menu, X, PhoneCall, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Tính năng", href: "#features" },
  { label: "Trải nghiệm AI", href: "#ai-demo" },
  { label: "Dịch vụ", href: "#services" },
  { label: "Tính ROI", href: "#roi-calc" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Đánh giá", href: "#testimonials" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section spy
      const sections = ["features", "ai-demo", "services", "roi-calc", "pricing", "testimonials"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-200/80"
          : "bg-white/95 backdrop-blur-md border-b border-gray-100"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex h-18 items-center justify-between gap-3 lg:gap-6">
          
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-40 blur transition-opacity" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg text-gray-900 tracking-tight leading-none">
                  AI Job Portal
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md border border-emerald-300/60">
                  B2B SaaS
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium mt-0.5 whitespace-nowrap hidden sm:inline">
                Tuyển dụng thông minh chuẩn AI
              </span>
            </div>
          </a>

          {/* Desktop Nav Links (Zero Text Wrap) */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-50/90 p-1.5 rounded-full border border-gray-200/70 shrink-0" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href.replace("#", "");
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap select-none",
                    isActive
                      ? "text-emerald-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-xs border border-emerald-100"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action CTAs (Zero Text Wrap) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Phone hotline */}
            <a
              href="tel:02466805588"
              className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-emerald-600 px-2.5 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
              </div>
              <span>Hotline 24/7</span>
            </a>

            <a
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-bold text-gray-700 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all whitespace-nowrap shrink-0"
            >
              Đăng nhập
            </a>
            
            <a
              href="/employer/dashboard"
              className="group relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden whitespace-nowrap shrink-0"
            >
              {/* Shimmer line effect */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/25 skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-out pointer-events-none" />
              <span>Đăng tin miễn phí</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200/80 transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <a
                  href="/login"
                  className="block text-center w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                >
                  Đăng nhập Nhà tuyển dụng
                </a>
                <a
                  href="/employer/dashboard"
                  className="block text-center w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-extrabold shadow-md shadow-emerald-500/20 whitespace-nowrap"
                >
                  Đăng tin ngay (Miễn phí)
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
