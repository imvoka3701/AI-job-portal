import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button, Input, Card } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "./AuthLayout";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email không được để trống").email("Email không hợp lệ"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    try {
      // Simulate API call
      console.log("Forgot password for:", data.email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
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
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-[#00b14f]/10 text-[#00b14f] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Đã gửi email khôi phục</h3>
            <p className="text-sm text-gray-500 mb-6">
              Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
            </p>
            <Link to="/login">
              <Button fullWidth className="h-11 bg-[#00b14f] hover:bg-[#009844] text-white rounded-full">
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Nhập email của bạn"
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
              className="h-11 mt-6 bg-[#00b14f] hover:bg-[#009844] text-white border-0 rounded-full font-semibold text-base"
            >
              Gửi yêu cầu <ArrowRight className="w-4 h-4 ml-1" />
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
