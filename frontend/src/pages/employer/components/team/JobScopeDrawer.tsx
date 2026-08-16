import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Check, Search, UserCheck } from "lucide-react";
import { Badge, Button, Drawer, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { getCompanyJobs, getJobAssignmentsBatch, updateJobAssignmentsBatch } from "@/lib/api/company";
import { cn } from "@/lib/utils";
import type { CompanyMembership } from "@/types/company";
import type { Job } from "@/types/job";

type ScopeFilter = "all" | "inherited" | "explicit";

export function JobScopeDrawer({ member, onClose, onSaved }: { member: CompanyMembership | null; onClose: () => void; onSaved?: (changedJobs: number) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number[]>>({});
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<ScopeFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScope = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    setError(null);
    try {
      const [companyJobs, assignmentBatch] = await Promise.all([
        getCompanyJobs(),
        getJobAssignmentsBatch(),
      ]);
      const assignmentRows = assignmentBatch.assignments;
      setJobs(companyJobs);
      setAssignments(Object.fromEntries(assignmentRows.map((item) => [item.job_id, item.membership_ids])));
      setSelectedJobIds(new Set(
        assignmentRows.filter((item) => item.membership_ids.includes(member.id)).map((item) => item.job_id),
      ));
    } catch {
      setError("Không thể tải phạm vi job của thành viên.");
    } finally {
      setLoading(false);
    }
  }, [member]);

  useEffect(() => {
    if (member) {
      setKeyword("");
      setFilter("all");
      void loadScope();
    }
  }, [loadScope, member]);

  const visibleJobs = useMemo(() => {
    if (!member) return [];
    const query = keyword.trim().toLocaleLowerCase("vi");
    return jobs.filter((job) => {
      const inherited = member.department_id != null && job.department_id === member.department_id;
      const explicit = selectedJobIds.has(job.id);
      const matchesFilter = filter === "all" || (filter === "inherited" ? inherited : explicit && !inherited);
      const matchesKeyword = !query || [job.title, job.location ?? ""].some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesFilter && matchesKeyword;
    });
  }, [filter, jobs, keyword, member, selectedJobIds]);

  const changedAssignments = useMemo(() => {
    if (!member) return [];
    return jobs.flatMap((job) => {
      const inherited = member.department_id != null && job.department_id === member.department_id;
      if (inherited) return [];
      const current = assignments[job.id] ?? [];
      const withoutMember = current.filter((membershipId) => membershipId !== member.id);
      const next = selectedJobIds.has(job.id) ? [...withoutMember, member.id] : withoutMember;
      const changed = current.length !== next.length || current.some((id) => !next.includes(id));
      return changed ? [{ job_id: job.id, membership_ids: next }] : [];
    });
  }, [assignments, jobs, member, selectedJobIds]);

  if (!member) return null;

  const inheritedCount = jobs.filter((job) => member.department_id != null && job.department_id === member.department_id).length;
  const explicitCount = jobs.filter((job) => selectedJobIds.has(job.id) && job.department_id !== member.department_id).length;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (changedAssignments.length === 0) {
        onClose();
        return;
      }
      await updateJobAssignmentsBatch(changedAssignments);
      onSaved?.(changedAssignments.length);
      onClose();
    } catch {
      setError("Không thể lưu phạm vi job. Dữ liệu trước đó vẫn được giữ nguyên.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={`Phạm vi tuyển dụng · ${member.full_name}`}
      description={`${member.department_name ?? "Chưa gán phòng ban"} · ${member.email}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{inheritedCount} job theo phòng ban · {explicitCount} job gán riêng</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button onClick={() => void save()} isLoading={saving} disabled={loading || jobs.length === 0 || changedAssignments.length === 0}>
              {changedAssignments.length > 0 ? `Lưu ${changedAssignments.length} thay đổi` : "Đã đồng bộ"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-gray-500"><Building2 className="h-4 w-4" /><span className="text-xs font-medium">Kế thừa phòng ban</span></div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{inheritedCount}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary-soft p-4">
          <div className="flex items-center gap-2 text-primary"><UserCheck className="h-4 w-4" /><span className="text-xs font-medium">Được gán riêng</span></div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{explicitCount}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="Tìm job trong phạm vi" placeholder="Tìm theo vị trí hoặc địa điểm" className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1" aria-label="Lọc loại phạm vi">
          {([
            ["all", "Tất cả"],
            ["inherited", "Theo phòng ban"],
            ["explicit", "Gán riêng"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", filter === value ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900")}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3" aria-label="Đang tải phạm vi job">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div>
        ) : error && jobs.length === 0 ? (
          <ErrorState title="Không tải được phạm vi job" message={error} onRetry={() => void loadScope()} />
        ) : jobs.length === 0 ? (
          <EmptyState icon={<Briefcase className="h-7 w-7 text-gray-400" />} title="Chưa có job để phân công" description="Tạo tin tuyển dụng trước khi thiết lập phạm vi riêng." />
        ) : visibleJobs.length === 0 ? (
          <EmptyState title="Không tìm thấy job" description="Thử từ khóa hoặc loại phạm vi khác." />
        ) : (
          <div className="space-y-2">
            {visibleJobs.map((job) => {
              const inherited = member.department_id != null && job.department_id === member.department_id;
              const explicit = selectedJobIds.has(job.id);
              return (
                <label key={job.id} className={cn("flex items-start gap-3 rounded-lg border p-4 transition-colors", inherited ? "cursor-default border-gray-200 bg-gray-50" : "cursor-pointer border-gray-200 bg-white hover:border-primary/30 hover:bg-primary-soft/40")}>
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border", inherited || explicit ? "border-primary bg-primary text-white" : "border-gray-300 bg-white")}>
                    {(inherited || explicit) && <Check className="h-3.5 w-3.5" />}
                    {!inherited && <input type="checkbox" className="sr-only" checked={explicit} onChange={(event) => setSelectedJobIds((current) => { const next = new Set(current); if (event.target.checked) next.add(job.id); else next.delete(job.id); return next; })} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{job.title}</span>
                      <Badge variant={inherited ? "default" : explicit ? "primary" : "default"} size="sm">{inherited ? "Theo phòng ban" : explicit ? "Gán riêng" : "Chưa gán"}</Badge>
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">{job.location ?? "Chưa xác định địa điểm"}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      {error && jobs.length > 0 && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
    </Drawer>
  );
}
