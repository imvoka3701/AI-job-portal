import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Check,
  Clipboard,
  Crown,
  Mail,
  History,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from "lucide-react";
import {
  createDepartment,
  createInvitation,
  getInvitations,
  getTeamMembers,
  resendInvitation,
  revokeInvitation,
  transferTeamOwnership,
  updateDepartment,
  updateTeamMember,
} from "@/lib/api/company";
import { useEmployerCompany } from "@/contexts/EmployerCompanyContext";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Skeleton,
  Toast,
} from "@/components/ui";
import type { ToastMessage } from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import type {
  CompanyInvitation,
  CompanyMembership,
  InvitationDeliveryStatus,
  MembershipRole,
} from "@/types/company";
import { JobScopeDrawer } from "./components/team/JobScopeDrawer";
import { ActivityTimeline } from "./components/team/ActivityTimeline";
import { PermissionMatrix } from "./components/team/PermissionMatrix";

type TeamTab = "members" | "permissions" | "departments" | "invitations" | "activity";

interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "primary" | "warning" | "destructive";
  detail?: React.ReactNode;
  action: () => Promise<void>;
}

const ROLE_LABELS: Record<MembershipRole, string> = {
  hr: "Nhân sự",
  department_head: "Trưởng bộ phận",
};

const STATUS_LABELS = {
  active: "Đang hoạt động",
  suspended: "Tạm khóa",
  revoked: "Đã thu hồi",
};

const DELIVERY_META: Record<InvitationDeliveryStatus, { label: string; variant: "default" | "info" | "success" | "danger" }> = {
  not_configured: { label: "Chưa cấu hình SMTP", variant: "default" },
  pending: { label: "Đang gửi email", variant: "info" },
  sent: { label: "Email đã gửi", variant: "success" },
  failed: { label: "Gửi email lỗi", variant: "danger" },
  bounced: { label: "Email bị trả lại", variant: "danger" },
};

export function EmployerTeamPage() {
  const { data: context, loading: contextLoading, error: contextError, hasPermission, refresh } = useEmployerCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState<CompanyMembership[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [scopeMember, setScopeMember] = useState<CompanyMembership | null>(null);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const canManage = hasPermission("team:manage");
  const companyId = context?.company.id;
  const requestedTab = searchParams.get("tab") as TeamTab | null;
  const validTabs: TeamTab[] = canManage
    ? ["members", "permissions", "departments", "invitations", "activity"]
    : ["members", "permissions", "departments"];
  const tab = requestedTab && validTabs.includes(requestedTab) ? requestedTab : "members";
  const keyword = searchParams.get("q") ?? "";
  const roleFilter = searchParams.get("role") === "hr" || searchParams.get("role") === "department_head"
    ? searchParams.get("role") as MembershipRole
    : "all";
  const statusParam = searchParams.get("status");
  const statusFilter: CompanyMembership["status"] | "all" = statusParam === "active" || statusParam === "suspended" || statusParam === "revoked" ? statusParam : "all";
  const departmentParam = Number(searchParams.get("department"));
  const departmentFilter: number | "all" = Number.isInteger(departmentParam) && departmentParam > 0 ? departmentParam : "all";

  const updateQuery = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "tab" && value === "members")) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const notifySuccess = useCallback((title: string, description?: string) => {
    setToast({ id: Date.now(), title, description, variant: "success" });
    setActivityRefreshKey((current) => current + 1);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [memberData, invitationData] = await Promise.all([
        getTeamMembers(),
        canManage ? getInvitations() : Promise.resolve([]),
      ]);
      setMembers(memberData);
      setInvitations(invitationData);
    } catch {
      setError("Không thể tải dữ liệu đội ngũ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    if (companyId) void loadTeam();
  }, [companyId, loadTeam]);

  const filteredMembers = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("vi");
    return members.filter((member) => {
      const matchesKeyword = !query || [member.full_name, member.email, member.department_name ?? ""]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      const matchesRole = roleFilter === "all" || member.member_role === roleFilter;
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || member.department_id === departmentFilter;
      return matchesKeyword && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [departmentFilter, keyword, members, roleFilter, statusFilter]);

  const hasMemberFilters = Boolean(
    keyword || roleFilter !== "all" || statusFilter !== "all" || departmentFilter !== "all",
  );

  const resetMemberFilters = () => {
    updateQuery({ q: null, role: null, status: null, department: null });
  };

  const mutateMember = async (
    member: CompanyMembership,
    payload: Parameters<typeof updateTeamMember>[1],
  ) => {
    setBusyId(member.id);
    try {
      const updated = await updateTeamMember(member.id, payload);
      setMembers((current) => current.map((item) => item.id === updated.id ? updated : item));
      notifySuccess("Đã cập nhật thành viên", `${member.full_name} đã nhận quyền và phạm vi mới.`);
    } catch (cause) {
      setError("Không thể cập nhật thành viên. Hãy kiểm tra vai trò và phòng ban.");
      throw cause;
    } finally {
      setBusyId(null);
    }
  };

  const requestMemberUpdate = (
    member: CompanyMembership,
    payload: Parameters<typeof updateTeamMember>[1],
    options: Omit<PendingConfirmation, "action">,
  ) => {
    setConfirmation({
      ...options,
      action: () => mutateMember(member, payload),
    });
  };

  const requestOwnershipTransfer = (member: CompanyMembership) => {
    setConfirmation({
      title: "Chuyển quyền sở hữu doanh nghiệp",
      description: `${member.full_name} sẽ trở thành Owner và có toàn quyền quản lý thành viên, phòng ban và phân quyền. Bạn vẫn là Nhân sự nhưng không còn quyền quản trị đội ngũ.`,
      confirmLabel: "Chuyển ownership",
      variant: "warning",
      detail: <span><strong>Owner mới:</strong> {member.full_name} · {member.email}</span>,
      action: async () => {
        setBusyId(member.id);
        try {
          await transferTeamOwnership(member.id);
          await Promise.all([loadTeam(), refresh()]);
          notifySuccess("Đã chuyển ownership", `${member.full_name} hiện là Owner của doanh nghiệp.`);
        } catch (cause) {
          setError("Không thể chuyển quyền sở hữu cho thành viên này.");
          throw cause;
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  if (contextLoading) {
    return <TeamPageSkeleton />;
  }
  if (contextError || !context) {
    return <ErrorState title="Không tải được doanh nghiệp" message={contextError ?? "Thiếu company context."} onRetry={() => void refresh()} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" />
            Quản trị nội bộ doanh nghiệp
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Đội ngũ & phân quyền</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý nhân sự tuyển dụng, trưởng bộ phận và phạm vi làm việc tại {context.company.name}.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Building2 className="h-4 w-4" />} onClick={() => setDepartmentOpen(true)}>
              Thêm phòng ban
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
              Mời thành viên
            </Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4">
        <Metric label="Thành viên" value={members.filter((item) => item.status === "active").length} icon={Users} />
        <Metric label="Nhân sự" value={members.filter((item) => item.member_role === "hr" && item.status === "active").length} icon={UserCog} />
        <Metric label="Trưởng bộ phận" value={members.filter((item) => item.member_role === "department_head" && item.status === "active").length} icon={UserRoundCheck} />
        <Metric label="Phòng ban" value={context.departments.filter((item) => item.is_active).length} icon={Building2} />
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200" role="tablist" aria-label="Quản trị đội ngũ">
        <TabButton active={tab === "members"} onClick={() => updateQuery({ tab: "members" })} icon={Users}>Thành viên</TabButton>
        <TabButton active={tab === "permissions"} onClick={() => updateQuery({ tab: "permissions" })} icon={ShieldCheck}>Ma trận quyền</TabButton>
        <TabButton active={tab === "departments"} onClick={() => updateQuery({ tab: "departments" })} icon={Building2}>Phòng ban</TabButton>
        {canManage && <TabButton active={tab === "invitations"} onClick={() => updateQuery({ tab: "invitations" })} icon={Mail}>Lời mời</TabButton>}
        {canManage && <TabButton active={tab === "activity"} onClick={() => updateQuery({ tab: "activity" })} icon={History}>Nhật ký</TabButton>}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Đóng thông báo"><X className="h-4 w-4" /></button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {loading ? (
            <TeamPageSkeleton compact />
          ) : tab === "members" ? (
            <Card noPadding>
              <div className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_200px_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={keyword}
                    onChange={(event) => updateQuery({ q: event.target.value || null })}
                    placeholder="Tìm theo tên, email, phòng ban"
                    aria-label="Tìm thành viên"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <select
                  aria-label="Lọc theo vai trò"
                  value={roleFilter}
                  onChange={(event) => updateQuery({ role: event.target.value })}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="hr">Nhân sự</option>
                  <option value="department_head">Trưởng bộ phận</option>
                </select>
                <select
                  aria-label="Lọc theo trạng thái"
                  value={statusFilter}
                  onChange={(event) => updateQuery({ status: event.target.value })}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="suspended">Tạm khóa</option>
                  <option value="revoked">Đã thu hồi</option>
                </select>
                <select
                  aria-label="Lọc theo phòng ban"
                  value={departmentFilter}
                  onChange={(event) => updateQuery({ department: event.target.value })}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">Tất cả phòng ban</option>
                  {context.departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-1">
                  {hasMemberFilters && (
                    <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={resetMemberFilters}>
                      Xóa lọc
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadTeam()}>
                    Làm mới
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                    <tr><th className="px-5 py-3">Thành viên</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Phòng ban</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="px-5 py-3 text-right">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        departments={context.departments}
                        canManage={canManage}
                        busy={busyId === member.id}
                        onRoleChange={(nextRole) => requestMemberUpdate(member, { member_role: nextRole, department_id: nextRole === "hr" ? null : member.department_id }, {
                          title: "Xác nhận thay đổi vai trò",
                          description: `Vai trò mới sẽ có hiệu lực ngay ở request tiếp theo. ${nextRole === "hr" ? "Thành viên sẽ được xem và vận hành dữ liệu toàn công ty." : "Thành viên chỉ được xem dữ liệu thuộc phòng ban hoặc job được giao."}`,
                          confirmLabel: "Đổi vai trò",
                          variant: "warning",
                          detail: <span>{member.full_name}: <strong>{ROLE_LABELS[member.member_role]}</strong> → <strong>{ROLE_LABELS[nextRole]}</strong></span>,
                        })}
                        onDepartmentChange={(departmentId, departmentName) => requestMemberUpdate(member, { department_id: departmentId }, {
                          title: "Xác nhận chuyển phòng ban",
                          description: "Phạm vi job và ứng viên kế thừa theo phòng ban sẽ thay đổi ngay sau khi xác nhận.",
                          confirmLabel: "Chuyển phòng ban",
                          variant: "warning",
                          detail: <span>{member.department_name ?? "Chưa gán"} → <strong>{departmentName}</strong></span>,
                        })}
                        onStatusToggle={(nextStatus) => requestMemberUpdate(member, { status: nextStatus }, {
                          title: nextStatus === "suspended" ? "Tạm khóa quyền truy cập" : "Kích hoạt lại thành viên",
                          description: nextStatus === "suspended" ? "Thành viên sẽ mất quyền truy cập dữ liệu doanh nghiệp ngay lập tức nhưng lịch sử hoạt động vẫn được giữ lại." : "Thành viên sẽ được khôi phục quyền theo vai trò và phạm vi hiện tại.",
                          confirmLabel: nextStatus === "suspended" ? "Tạm khóa" : "Kích hoạt",
                          variant: nextStatus === "suspended" ? "destructive" : "primary",
                          detail: <span>{member.full_name} · {member.email}</span>,
                        })}
                        onTransfer={() => requestOwnershipTransfer(member)}
                        onManageScope={() => setScopeMember(member)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredMembers.length === 0 && <EmptyState title="Không tìm thấy thành viên" description="Điều chỉnh bộ lọc hoặc mời thành viên mới vào doanh nghiệp." />}
            </Card>
          ) : tab === "permissions" ? (
            <PermissionMatrix membership={context.membership} />
          ) : tab === "departments" ? (
            <DepartmentPanel context={context} canManage={canManage} onChanged={() => void refresh()} onError={setError} onSuccess={notifySuccess} />
          ) : tab === "activity" ? (
            <ActivityTimeline refreshKey={activityRefreshKey} />
          ) : (
            <InvitationPanel invitations={invitations} setInvitations={setInvitations} onError={setError} onSuccess={notifySuccess} />
          )}
        </motion.div>
      </AnimatePresence>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        departments={context.departments}
        onCreated={(invitation) => {
          setInvitations((current) => [invitation, ...current]);
          notifySuccess("Đã tạo lời mời", `Lời mời dành cho ${invitation.email} đã sẵn sàng.`);
        }}
      />
      <DepartmentModal open={departmentOpen} onClose={() => setDepartmentOpen(false)} onCreated={() => { void refresh(); notifySuccess("Đã tạo phòng ban", "Phòng ban mới đã sẵn sàng để phân công thành viên."); }} />
      <JobScopeDrawer member={scopeMember} onClose={() => setScopeMember(null)} onSaved={(changedJobs) => notifySuccess("Đã đồng bộ phạm vi", `${changedJobs} job đã được cập nhật trong một giao dịch.`)} />
      <ConfirmDialog
        isOpen={Boolean(confirmation)}
        title={confirmation?.title ?? "Xác nhận thao tác"}
        description={confirmation?.description ?? ""}
        confirmLabel={confirmation?.confirmLabel}
        variant={confirmation?.variant}
        detail={confirmation?.detail}
        onClose={() => setConfirmation(null)}
        onConfirm={() => confirmation?.action() ?? Promise.resolve()}
      />
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div className="flex items-center gap-3 bg-white px-4 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary"><Icon className="h-4 w-4" /></div><div><p className="text-xl font-semibold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div></div>;
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Users; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors", active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-900")}><Icon className="h-4 w-4" />{children}</button>;
}

function MemberRow({ member, departments, canManage, busy, onRoleChange, onDepartmentChange, onStatusToggle, onTransfer, onManageScope }: { member: CompanyMembership; departments: { id: number; name: string; is_active: boolean }[]; canManage: boolean; busy: boolean; onRoleChange: (role: MembershipRole) => void; onDepartmentChange: (departmentId: number, departmentName: string) => void; onStatusToggle: (status: "active" | "suspended") => void; onTransfer: () => void; onManageScope: () => void }) {
  const editable = canManage && !member.is_owner && member.status !== "revoked";
  return <tr className="text-gray-700">
    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">{getInitials(member.full_name)}</div><div><div className="flex items-center gap-2"><p className="font-medium text-gray-900">{member.full_name}</p>{member.is_owner && <Badge variant="primary" size="sm">Owner</Badge>}</div><p className="text-xs text-gray-500">{member.email}</p></div></div></td>
    <td className="px-4 py-4">{editable ? <select aria-label={`Vai trò của ${member.full_name}`} disabled={busy} value={member.member_role} onChange={(event) => onRoleChange(event.target.value as MembershipRole)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm"><option value="hr">Nhân sự</option><option value="department_head">Trưởng bộ phận</option></select> : <Badge variant={member.member_role === "hr" ? "info" : "warning"}>{ROLE_LABELS[member.member_role]}</Badge>}</td>
    <td className="px-4 py-4">{editable && member.member_role === "department_head" ? <select aria-label={`Phòng ban của ${member.full_name}`} disabled={busy} value={member.department_id ?? ""} onChange={(event) => { const nextDepartmentId = Number(event.target.value); const departmentName = departments.find((item) => item.id === nextDepartmentId)?.name ?? "Phòng ban đã chọn"; onDepartmentChange(nextDepartmentId, departmentName); }} className="h-9 max-w-[190px] rounded-lg border border-gray-200 bg-white px-2 text-sm"><option value="">Chọn phòng ban</option>{departments.filter((item) => item.is_active).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select> : <span className="text-gray-500">{member.department_name ?? "Toàn công ty"}</span>}</td>
    <td className="px-4 py-4"><Badge dot variant={member.status === "active" ? "success" : member.status === "suspended" ? "warning" : "danger"}>{STATUS_LABELS[member.status]}</Badge></td>
    <td className="px-4 py-4 text-xs text-gray-500">{new Date(member.updated_at).toLocaleDateString("vi-VN")}</td>
    <td className="px-5 py-4"><div className="flex justify-end gap-1">{canManage && member.member_role === "department_head" && member.status === "active" && <Button variant="ghost" size="icon-sm" title="Phân công job" aria-label={`Phân công job cho ${member.full_name}`} disabled={busy} onClick={onManageScope}><Briefcase className="h-4 w-4 text-primary" /></Button>}{editable && <><Button variant="ghost" size="icon-sm" title={member.status === "active" ? "Tạm khóa" : "Kích hoạt lại"} aria-label={member.status === "active" ? "Tạm khóa thành viên" : "Kích hoạt thành viên"} disabled={busy} onClick={() => onStatusToggle(member.status === "active" ? "suspended" : "active")}>{member.status === "active" ? <UserRoundX className="h-4 w-4 text-amber-600" /> : <UserRoundCheck className="h-4 w-4 text-green-600" />}</Button><Button variant="ghost" size="icon-sm" title="Chuyển quyền sở hữu" aria-label="Chuyển quyền sở hữu" disabled={busy} onClick={onTransfer}><Crown className="h-4 w-4 text-primary" /></Button></>}</div></td>
  </tr>;
}

function DepartmentPanel({ context, canManage, onChanged, onError, onSuccess }: { context: NonNullable<ReturnType<typeof useEmployerCompany>["data"]>; canManage: boolean; onChanged: () => void; onError: (message: string) => void; onSuccess: (title: string, description?: string) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{context.departments.map((department) => <Card key={department.id} className={cn(!department.is_active && "opacity-60")}><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary"><Building2 className="h-5 w-5" /></div><Badge dot variant={department.is_active ? "success" : "default"}>{department.is_active ? "Hoạt động" : "Tạm dừng"}</Badge></div><h3 className="mt-4 font-semibold text-gray-900">{department.name}</h3><p className="mt-1 min-h-10 text-sm text-gray-500">{department.description || "Chưa có mô tả phòng ban."}</p>{canManage && <Button className="mt-4" variant="outline" size="sm" onClick={async () => { try { await updateDepartment(department.id, { is_active: !department.is_active }); onSuccess(department.is_active ? "Đã tạm dừng phòng ban" : "Đã kích hoạt phòng ban", department.name); onChanged(); } catch { onError("Không thể cập nhật phòng ban."); } }}>{department.is_active ? "Tạm dừng" : "Kích hoạt"}</Button>}</Card>)}{context.departments.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={<Building2 className="h-7 w-7 text-gray-400" />} title="Chưa có phòng ban" description="Owner có thể tạo phòng ban trước khi mời trưởng bộ phận." /></div>}</div>;
}

function InvitationPanel({ invitations, setInvitations, onError, onSuccess }: { invitations: CompanyInvitation[]; setInvitations: React.Dispatch<React.SetStateAction<CompanyInvitation[]>>; onError: (message: string) => void; onSuccess: (title: string, description?: string) => void }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copyInvite = async (invitation: CompanyInvitation) => { if (!invitation.invite_path) return; await navigator.clipboard.writeText(`${window.location.origin}${invitation.invite_path}`); setCopied(invitation.id); setTimeout(() => setCopied(null), 1600); };
  if (invitations.length === 0) return <EmptyState icon={<Mail className="h-7 w-7 text-gray-400" />} title="Chưa có lời mời" description="Tạo lời mời để thêm nhân sự hoặc trưởng bộ phận vào doanh nghiệp." />;
  return <Card noPadding><div className="divide-y divide-gray-100">{invitations.map((invitation) => {
    const delivery = DELIVERY_META[invitation.delivery_status];
    return <div key={invitation.id} className="flex flex-wrap items-center gap-4 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600"><Mail className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{invitation.email}</p>
        <p className="text-xs text-gray-500">{ROLE_LABELS[invitation.member_role]}{invitation.department_name ? ` · ${invitation.department_name}` : ""}</p>
        {invitation.delivery_error && <p className="mt-1 truncate text-xs text-red-600" title={invitation.delivery_error}>{invitation.delivery_error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={invitation.status === "pending" ? "warning" : invitation.status === "accepted" ? "success" : "default"}>{invitation.status}</Badge>
        <Badge dot variant={delivery.variant} title={`${invitation.delivery_attempts} lần gửi`}>{delivery.label}</Badge>
      </div>
      {invitation.status === "pending" && <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" title="Sao chép liên kết" aria-label="Sao chép liên kết" disabled={!invitation.invite_path} onClick={() => void copyInvite(invitation)}>{copied === invitation.id ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}</Button>
        <Button variant="ghost" size="icon-sm" title="Gửi lại lời mời" aria-label="Gửi lại lời mời" onClick={async () => { try { const updated = await resendInvitation(invitation.id); setInvitations((items) => items.map((item) => item.id === updated.id ? updated : item)); onSuccess(updated.delivery_status === "sent" ? "Email lời mời đã được gửi" : "Đã làm mới lời mời", invitation.email); } catch { onError("Không thể gửi lại lời mời."); } }}><RefreshCw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" title="Thu hồi lời mời" aria-label="Thu hồi lời mời" onClick={async () => { try { const updated = await revokeInvitation(invitation.id); setInvitations((items) => items.map((item) => item.id === updated.id ? updated : item)); onSuccess("Đã thu hồi lời mời", invitation.email); } catch { onError("Không thể thu hồi lời mời."); } }}><X className="h-4 w-4 text-red-600" /></Button>
      </div>}
    </div>;
  })}</div></Card>;
}

function InviteModal({ open, onClose, departments, onCreated }: { open: boolean; onClose: () => void; departments: { id: number; name: string; is_active: boolean }[]; onCreated: (invitation: CompanyInvitation) => void }) {
  const [email, setEmail] = useState(""); const [role, setRole] = useState<MembershipRole>("hr"); const [departmentId, setDepartmentId] = useState(""); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null); const [created, setCreated] = useState<CompanyInvitation | null>(null); const [copied, setCopied] = useState(false);
  const close = () => { setEmail(""); setRole("hr"); setDepartmentId(""); setError(null); setCreated(null); setCopied(false); onClose(); };
  return <Modal isOpen={open} onClose={close} title="Mời thành viên vào doanh nghiệp">{created ? <div className="space-y-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600"><Check className="h-6 w-6" /></div><div><h3 className="font-semibold text-gray-900">Đã tạo lời mời</h3><p className="mt-1 text-sm text-gray-500">Gửi liên kết bảo mật này cho {created.email}. Liên kết hết hạn sau 7 ngày.</p></div><div className="flex gap-2"><Input readOnly value={`${window.location.origin}${created.invite_path}`} aria-label="Liên kết lời mời" /><Button variant="outline" aria-label="Sao chép liên kết" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${created.invite_path}`); setCopied(true); }}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</Button></div><Button onClick={close}>Hoàn tất</Button></div> : <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setError(null); if (role === "department_head" && !departmentId) { setError("Vui lòng chọn phòng ban cho trưởng bộ phận."); return; } setSubmitting(true); try { const invitation = await createInvitation({ email, member_role: role, department_id: departmentId ? Number(departmentId) : undefined }); setCreated(invitation); onCreated(invitation); } catch { setError("Không thể tạo lời mời. Email có thể đã được mời hoặc đang thuộc tài khoản khác."); } finally { setSubmitting(false); } }}><Input type="email" label="Email công việc" value={email} onChange={(event) => setEmail(event.target.value)} required /><div><label className="mb-2 block text-sm font-medium text-gray-700">Vai trò</label><select value={role} onChange={(event) => setRole(event.target.value as MembershipRole)} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="hr">Nhân sự</option><option value="department_head">Trưởng bộ phận</option></select></div>{role === "department_head" && <><div><label className="mb-2 block text-sm font-medium text-gray-700">Phòng ban</label><select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="">Chọn phòng ban</option>{departments.filter((item) => item.is_active).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div><p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">Sau khi thành viên chấp nhận lời mời, Owner có thể gán thêm job ngoài phòng ban từ bảng thành viên.</p></>}{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Hủy</Button><Button type="submit" isLoading={submitting}>Tạo lời mời</Button></div></form>}</Modal>;
}

function DepartmentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  return <Modal isOpen={open} onClose={onClose} title="Thêm phòng ban"><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setSubmitting(true); setError(null); try { await createDepartment({ name, description: description || undefined }); setName(""); setDescription(""); onCreated(); onClose(); } catch { setError("Không thể tạo phòng ban. Tên có thể đã tồn tại."); } finally { setSubmitting(false); } }}><Input label="Tên phòng ban" value={name} onChange={(event) => setName(event.target.value)} required /><Input label="Mô tả" value={description} onChange={(event) => setDescription(event.target.value)} />{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Hủy</Button><Button type="submit" isLoading={submitting}>Tạo phòng ban</Button></div></form></Modal>;
}

function TeamPageSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className="space-y-4">{!compact && <><Skeleton className="h-8 w-64" /><Skeleton className="h-20 w-full" /></>}<Card><div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-3"><Skeleton circle className="h-10 w-10" /><div className="flex-1"><Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-64" /></div></div>)}</div></Card></div>;
}
