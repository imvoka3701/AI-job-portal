import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button, Input, Card } from "@/components/ui";
import { ArrowRight, AlertCircle, MailCheck, KeyRound } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/axios";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Email không hợp lệ"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
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
          <h2 className="text-lg text-gray-700 font-medium">Khôi phục mật khẩu</h2>
          <p className="text-sm text-gray-500 mt-2">
            Nhập email của bạn, hệ thống sẽ cấp mật khẩu mới và gửi trực tiếp qua hòm thư.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <MailCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Mật khẩu mới đã được gửi!</h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                Hệ thống đã tạo một mật khẩu mới cho tài khoản <strong className="text-gray-900">{submittedEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác / Spam) để lấy mật khẩu.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 text-left flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến cáo:</strong> Hãy dùng mật khẩu do hệ thống cấp để đăng nhập và đổi lại mật khẩu cá nhân ngay trong mục <em>Cài đặt tài khoản</em>.
              </span>
            </div>

            <div className="pt-2 space-y-2">
              <Link to="/login" className="block">
                <Button fullWidth className="h-11 bg-[#00b14f] hover:bg-[#009844] text-white rounded-xl font-bold">
                  Đăng nhập ngay
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setErrorMessage(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium hover:underline pt-1 cursor-pointer"
              >
                Gửi lại yêu cầu với email khác
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email đăng ký"
                type="email"
                placeholder="Nhập email tài khoản của bạn"
                {...register("email")}
                error={errors.email?.message}
                disabled={isSubmitting}
                className="h-11"
              />
            </div>

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isSubmitting}
              className="h-11 mt-6 bg-[#00b14f] hover:bg-[#009844] text-white border-0 rounded-xl font-semibold text-base shadow-sm"
            >
              Cấp mật khẩu mới <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Sign In Link */}
        {!isSuccess && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Nhớ mật khẩu?{" "}
            <Link to="/login" className="font-semibold text-[#00b14f] hover:underline">
              Đăng nhập
            </Link>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
