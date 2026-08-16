import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, CheckCircle2, Eye, EyeOff, ShieldCheck, UserCog } from "lucide-react";
import { acceptInvitation, declineInvitation, getInvitation } from "@/lib/api/company";
import { Badge, Button, Card, ErrorState, Input, Skeleton } from "@/components/ui";
import type { CompanyInvitation } from "@/types/company";

export function EmployerInvitationAcceptPage() {
  const { token = "" } = useParams();
  const [invitation, setInvitation] = useState<CompanyInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvitation(await getInvitation(token));
    } catch {
      setError("Lời mời không tồn tại hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-page-bg px-4 py-12">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold text-gray-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">JP</span>
          AI Job Portal
        </Link>
        {loading ? (
          <Card className="space-y-4 p-6"><Skeleton className="h-10 w-10" /><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-11 w-full" /></Card>
        ) : error || !invitation ? (
          <ErrorState title="Không thể mở lời mời" message={error ?? "Lời mời không hợp lệ."} onRetry={() => void load()} />
        ) : accepted ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Bạn đã tham gia {invitation.company_name}</h1>
            <p className="mt-2 text-sm text-gray-500">Đăng nhập để bắt đầu làm việc trong Employer Hub với phạm vi vừa được cấp.</p>
            <Link to="/login" className="mt-6 block"><Button fullWidth>Đăng nhập Employer Hub</Button></Link>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary"><ShieldCheck className="h-6 w-6" /></div>
            <div className="mt-5 flex items-center gap-2"><Badge variant="primary">Lời mời doanh nghiệp</Badge><Badge variant={invitation.status === "pending" ? "warning" : "default"}>{invitation.status}</Badge></div>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">Tham gia {invitation.company_name}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">Bạn được mời với vai trò <strong className="text-gray-700">{invitation.member_role === "hr" ? "Nhân sự" : "Trưởng bộ phận"}</strong>{invitation.department_name ? ` tại ${invitation.department_name}` : ""}.</p>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500">{invitation.member_role === "hr" ? <UserCog className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}</div><div><p className="text-sm font-medium text-gray-900">{invitation.email}</p><p className="text-xs text-gray-500">Liên kết hết hạn {new Date(invitation.expires_at).toLocaleDateString("vi-VN")}</p></div></div>

            <form className="mt-6 space-y-4" onSubmit={async (event) => { event.preventDefault(); setSubmitting(true); setError(null); try { await acceptInvitation(token, { full_name: fullName || undefined, password: password || undefined }); setAccepted(true); } catch { setError("Không thể nhận lời mời. Nếu email chưa có tài khoản, hãy nhập họ tên và mật khẩu tối thiểu 8 ký tự."); } finally { setSubmitting(false); } }}>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Email đã có tài khoản có thể để trống hai trường dưới. Người dùng mới cần tạo thông tin đăng nhập.</div>
              <Input label="Họ và tên" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              <Input label="Mật khẩu" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" rightElement={<button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
              {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
              <div className="flex gap-2 pt-2"><Button type="submit" isLoading={submitting} className="flex-1">Chấp nhận lời mời</Button><Button type="button" variant="outline" onClick={async () => { setSubmitting(true); try { await declineInvitation(token); setInvitation({ ...invitation, status: "declined" }); } catch { setError("Không thể từ chối lời mời."); } finally { setSubmitting(false); } }}>Từ chối</Button></div>
            </form>
          </Card>
        )}
      </div>
    </main>
  );
}
