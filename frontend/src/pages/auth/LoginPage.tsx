import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui";
import { Eye, EyeOff, ArrowRight, Facebook, Linkedin, Bot, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Google SVG Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuthStore();
  const successMessage = useAuthStore((s) => s.successMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    clearError();
    setIsSubmitting(true);
    try {
      await login(data);
      const user = useAuthStore.getState().user;
      if (user?.role === "employer") {
        navigate("/employer/dashboard");
      } else if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex lg:grid lg:grid-cols-[44%_56%] bg-white lg:bg-[#06111F] font-sans">
      
      {/* 1. LEFT SIDE - LOGIN FORM */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-0 bg-white relative z-10 overflow-y-auto"
      >
        <div className="w-full max-w-[420px] mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-[10px] bg-[#00B86B] flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-[22px] font-bold text-[#0F172A] tracking-tight">AI Job Portal</span>
            </div>
            <div className="text-[11px] font-bold tracking-[0.12em] text-[#00B86B] uppercase mb-8">
              SMART RECRUITMENT PLATFORM
            </div>

            <h1 className="text-[38px] xl:text-[42px] font-[800] text-[#0F172A] leading-tight mb-2 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-[15px] text-[#64748B] font-medium">Đăng nhập để tiếp tục quản lý tuyển dụng thông minh.</p>
          </div>

          {/* Social Logins */}
          <div className="space-y-3 mb-8">
            <button 
              type="button"
              onClick={() => {
                window.location.href = "http://localhost:8000/auth/google/login";
              }}
              className="w-full h-[52px] flex items-center justify-center border border-[#E2E8F0] bg-white text-[#334155] font-semibold rounded-[10px] hover:bg-[#F8FAFC] hover:border-gray-300 transition-all shadow-sm"
            >
              <GoogleIcon />
              <span className="ml-2.5">Đăng nhập bằng Google</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => console.log("Sắp ra mắt")} 
                className="w-full h-[52px] flex items-center justify-center border border-[#E2E8F0] bg-white text-[#334155] font-semibold rounded-[10px] hover:bg-[#F8FAFC] hover:border-gray-300 transition-all shadow-sm"
              >
                <Facebook className="text-[#1877f2] w-5 h-5" />
                <span className="ml-2">Facebook</span>
              </button>
              <button 
                type="button" 
                onClick={() => console.log("Sắp ra mắt")} 
                className="w-full h-[52px] flex items-center justify-center border border-[#E2E8F0] bg-white text-[#334155] font-semibold rounded-[10px] hover:bg-[#F8FAFC] hover:border-gray-300 transition-all shadow-sm"
              >
                <Linkedin className="text-[#0a66c2] w-5 h-5" />
                <span className="ml-2">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2E8F0]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#64748B] font-medium">Hoặc đăng nhập bằng Email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Success message (e.g. employer pending approval) */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-[10px] text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error message */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-[10px] text-sm flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-semibold text-[#0F172A]">Email</label>
                <Input
                  type="email"
                  placeholder="Nhập email của bạn"
                  {...register("email")}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  className="h-[52px] rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#00B86B] focus:bg-white focus:ring focus:ring-[#00B86B]/[0.08] transition-all"
                />
              </div>

              <div className="space-y-1.5 relative">
                <div className="flex justify-between items-center">
                  <label className="block text-[14px] font-semibold text-[#0F172A]">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-[13px] font-semibold text-[#00B86B] hover:text-[#00965e] transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  {...register("password")}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  className="h-[52px] rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] focus:border-[#00B86B] focus:bg-white focus:ring focus:ring-[#00B86B]/[0.08] transition-all"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#64748B] hover:text-[#334155] focus:outline-none flex items-center justify-center w-full h-full pr-3"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-[54px] mt-2 bg-[#00B86B] hover:bg-[#00A86B] text-white rounded-[10px] font-bold text-[15px] flex items-center justify-center transition-all hover:-translate-y-[1px] shadow-sm disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isSubmitting ? "Đang xử lý..." : (
                <>
                  Đăng nhập 
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-[14px] font-medium text-[#64748B]">
            Bạn chưa có tài khoản?{" "}
            <Link to="/register" className="font-semibold text-[#00B86B] hover:text-[#00965e] transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. RIGHT SIDE - AI VISUALS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="hidden lg:block relative overflow-hidden h-full w-full"
        style={{
          background: `
            radial-gradient(circle at 60% 70%, rgba(0,184,107,0.06), transparent 45%),
            linear-gradient(145deg, #06111F 0%, #0B1726 100%)
          `
        }}
      >
        {/* Extremely subtle grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiLz48L3N2Zz4=')] bg-repeat opacity-[0.03] mix-blend-screen" />

        <div className="relative w-full h-full">
          
          {/* Headline Container */}
          <div className="absolute top-[15%] xl:top-[18%] left-[10%] xl:left-[12%] z-20 max-w-[600px] pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] border border-[#00B86B]/30 bg-[#00B86B]/10 text-[#00B86B] text-[10px] font-bold tracking-[0.08em] mb-6">
              <span>✦</span> AI POWERED RECRUITMENT
            </div>
            <h2 className="text-[52px] xl:text-[58px] font-[800] leading-[1.05] tracking-tight mb-5 text-white">
              Tuyển dụng thông minh hơn với <br/>
              <span className="text-[#00B86B]">AI Matching</span>
            </h2>
            <p className="text-[16px] xl:text-[18px] text-white/[0.65] font-medium leading-relaxed max-w-[500px]">
              Hệ thống AI tự động phân tích CV, kết nối ứng viên phù hợp và tối ưu quy trình tuyển dụng.
            </p>
          </div>
          
          {/* Robot & Glow Composition - Positioned bottom-right */}
          <div className="absolute bottom-[-2%] right-[-5%] xl:right-[2%] z-10 w-[520px] xl:w-[620px]">
            {/* Subtle glow behind robot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#00B86B]/15 rounded-full blur-[90px] pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 flex justify-center items-center pointer-events-none"
            >
              <img 
                src="/images/robot.png" 
                alt="AI Recruitment Assistant" 
                className="w-full object-contain pointer-events-none select-none"
              />
            </motion.div>

            {/* FLOATING DATA CARDS */}
            
            {/* Card 1: AI Match Score */}
            <motion.div 
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[10%] right-[10%] xl:right-[5%] w-[220px] rounded-[16px] p-4 z-30"
              style={{
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase">AI Match Score</span>
                <span className="text-white font-extrabold text-base">98%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "98%" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="bg-[#00B86B] h-1.5 rounded-full relative overflow-hidden"
                >
                  <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Card 2: CV Analyzed */}
            <motion.div 
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[18%] left-[-15%] xl:left-[-10%] w-[210px] rounded-[16px] p-4 z-30 flex items-center gap-3.5"
              style={{
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-11 h-11 rounded-[14px] bg-[#00B86B]/15 border border-[#00B86B]/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#00B86B]" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">Đã phân tích</p>
                <p className="text-white text-sm font-medium">
                  <span className="text-[16px] font-bold text-[#00B86B]">1,240</span> CV
                </p>
              </div>
            </motion.div>

            {/* Card 3: Thêm một data card */}
            <motion.div 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-[60%] right-[5%] xl:right-[0%] w-[190px] rounded-[16px] p-3.5 z-30 flex items-start gap-3"
              style={{
                background: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mb-1">Cập nhật hệ thống</p>
                <p className="text-white text-[12px] font-bold leading-tight">Đã đồng bộ dữ liệu ứng viên mới</p>
              </div>
            </motion.div>
            
          </div>
        </div>
      </motion.div>
    </div>
  );
}

