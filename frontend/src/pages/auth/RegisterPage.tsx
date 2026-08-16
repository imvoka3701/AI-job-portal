import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button, Input, Card } from "@/components/ui";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthLayout } from "./AuthLayout";

const registerSchema = z
  .object({
    full_name: z.string().min(1, "Họ và tên không được để trống").max(255),
    email: z.string().min(1, "Email không được để trống").email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    role: z.enum(["candidate", "employer"]),
    company_name: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "employer" && (!data.company_name || data.company_name.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tên công ty là bắt buộc đối với nhà tuyển dụng",
        path: ["company_name"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerAuth, error: authError, clearError } = useAuthStore();
  const successMessage = useAuthStore((s) => s.successMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "candidate",
      company_name: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    clearError();
    setIsSubmitting(true);
    try {
      await registerAuth({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        company_name: data.role === "employer" ? data.company_name : undefined,
      });
      // Employer: don't navigate — account pending admin approval (successMessage set in store)
      // Candidate: auto-login succeeded — navigate to dashboard
      if (data.role !== "employer") {
        navigate("/dashboard");
      }
    } catch (err) {
      // Error handled in authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-[480px] p-8 sm:p-10 shadow-lg border-0 rounded-2xl bg-white">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00b14f] tracking-tight mb-2">
            AI Job Portal
          </h1>
          <h2 className="text-lg text-gray-700 font-medium">Tạo tài khoản mới</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Success message (employer pending approval) */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {authError}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-gray-700">Bạn là...</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`
                  flex items-center justify-center h-11 border rounded-lg cursor-pointer transition-colors text-sm
                  ${selectedRole === "candidate" ? "border-[#00b14f] bg-[#00b14f]/5 text-[#00b14f] font-semibold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}
                `}
              >
                <input
                  type="radio"
                  value="candidate"
                  className="sr-only"
                  {...register("role")}
                  disabled={isSubmitting}
                />
                Ứng viên
              </label>
              <label
                className={`
                  flex items-center justify-center h-11 border rounded-lg cursor-pointer transition-colors text-sm
                  ${selectedRole === "employer" ? "border-[#00b14f] bg-[#00b14f]/5 text-[#00b14f] font-semibold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}
                `}
              >
                <input
                  type="radio"
                  value="employer"
                  className="sr-only"
                  {...register("role")}
                  disabled={isSubmitting}
                />
                Nhà tuyển dụng
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <Input
              label="Họ và tên"
              placeholder="Vd: Nguyễn Văn A"
              {...register("full_name")}
              error={errors.full_name?.message}
              disabled={isSubmitting}
              className="h-11"
            />

            <Input
              label="Email"
              type="email"
              placeholder="Nhập email của bạn"
              {...register("email")}
              error={errors.email?.message}
              disabled={isSubmitting}
              className="h-11"
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              {...register("password")}
              error={errors.password?.message}
              disabled={isSubmitting}
              className="h-11"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            {selectedRole === "employer" && (
              <Input
                label="Tên công ty"
                placeholder="Vd: Công ty Cổ phần Công nghệ ABC"
                {...register("company_name")}
                error={errors.company_name?.message}
                disabled={isSubmitting}
                className="h-11"
              />
            )}
          </div>

          <Button 
            type="submit" 
            fullWidth 
            isLoading={isSubmitting}
            className="h-11 mt-6 bg-[#00b14f] hover:bg-[#009844] text-white border-0 rounded-full font-semibold text-base"
          >
            {isSubmitting ? "Đang xử lý..." : (
              <>
                Đăng ký tài khoản <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Bạn đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[#00b14f] hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
}
