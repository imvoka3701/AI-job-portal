import { Check, Minus, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CompanyMembership } from "@/types/company";

type MatrixRole = "owner" | "hr" | "department_head";

interface PermissionRow {
  label: string;
  description: string;
  owner: string | false;
  hr: string | false;
  department_head: string | false;
}

const ROLES: { key: MatrixRole; label: string; caption: string }[] = [
  { key: "owner", label: "Owner", caption: "Quản trị doanh nghiệp" },
  { key: "hr", label: "Nhân sự", caption: "Vận hành tuyển dụng" },
  { key: "department_head", label: "Trưởng bộ phận", caption: "Đánh giá chuyên môn" },
];

const PERMISSIONS: PermissionRow[] = [
  { label: "Thành viên & phòng ban", description: "Mời, khóa, đổi vai trò và chuyển ownership", owner: "Toàn quyền", hr: false, department_head: false },
  { label: "Tin tuyển dụng", description: "Tạo, chỉnh sửa, đóng hoặc mở tin", owner: "Toàn công ty", hr: "Toàn công ty", department_head: false },
  { label: "Xem ứng viên", description: "Truy cập hồ sơ và CV ứng viên", owner: "Toàn công ty", hr: "Toàn công ty", department_head: "Theo phạm vi" },
  { label: "Pipeline tuyển dụng", description: "Chuyển trạng thái và điều phối quy trình", owner: "Toàn công ty", hr: "Toàn công ty", department_head: false },
  { label: "Lịch phỏng vấn", description: "Tạo vòng và lên lịch phỏng vấn", owner: "Quản lý", hr: "Quản lý", department_head: "Chỉ đánh giá" },
  { label: "Đánh giá chuyên môn", description: "Chấm tiêu chí và ghi nhận xét", owner: "Được phép", hr: "Được phép", department_head: "Theo phạm vi" },
  { label: "Đề xuất tuyển dụng", description: "Gửi đề xuất cho HR xem xét", owner: false, hr: false, department_head: "Theo phạm vi" },
  { label: "Quyết định cuối", description: "Chấp nhận hoặc từ chối ứng viên", owner: "Con người quyết định", hr: "Con người quyết định", department_head: false },
  { label: "AI tuyển dụng", description: "Tóm tắt CV, câu hỏi và email nháp", owner: "Hỗ trợ", hr: "Hỗ trợ", department_head: "Theo phạm vi" },
];

function getCurrentRole(membership: CompanyMembership): MatrixRole {
  if (membership.is_owner) return "owner";
  return membership.member_role;
}

export function PermissionMatrix({ membership }: { membership: CompanyMembership }) {
  const currentRole = getCurrentRole(membership);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Ma trận quyền nghiệp vụ</h2>
          <p className="mt-1 text-sm text-gray-500">Quyền được quyết định ở backend. Giao diện chỉ phản ánh phạm vi hiệu lực hiện tại.</p>
        </div>
        <Badge variant="primary" dot>Vai trò của bạn: {ROLES.find((role) => role.key === currentRole)?.label}</Badge>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-[34%] px-5 py-4 font-semibold text-gray-700">Nghiệp vụ</th>
                {ROLES.map((role) => (
                  <th key={role.key} className={cn("px-4 py-4", currentRole === role.key && "bg-primary-soft")}>
                    <div className="flex items-center gap-2">
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 shadow-xs", currentRole === role.key && "bg-primary-light text-primary")}>
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-semibold text-gray-900">{role.label}</span>
                        <span className="block text-xs font-normal text-gray-500">{role.caption}</span>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PERMISSIONS.map((permission) => (
                <tr key={permission.label}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{permission.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{permission.description}</p>
                  </td>
                  {ROLES.map((role) => {
                    const value = permission[role.key];
                    return (
                      <td key={role.key} className={cn("px-4 py-4", currentRole === role.key && "bg-primary-soft/60")}>
                        {value ? (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="h-3.5 w-3.5" /></span>
                            {value}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100"><Minus className="h-3.5 w-3.5" /></span>
                            Không có quyền
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        AI chỉ hỗ trợ phân tích và soạn nội dung. Quyết định tuyển dụng cuối luôn thuộc về Owner hoặc Nhân sự.
      </div>
    </div>
  );
}
