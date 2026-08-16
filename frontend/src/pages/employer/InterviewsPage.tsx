/** Employer Interviews — agenda view grouped by Today/Tomorrow/This Week. */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/axios";
import { Button, Card, Badge, Skeleton } from "@/components/ui";

interface InterviewItem {
  round_id: number;
  application_id: number;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  round_number: number;
  round_type: string;
  round_name: string | null;
  scheduled_at: string;
  location: string | null;
  status: string;
}

function groupInterviews(items: InterviewItem[]) {
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

  const groups: { label: string; items: InterviewItem[] }[] = [];

  const today = items.filter((i) => new Date(i.scheduled_at) <= todayEnd);
  const tomorrow = items.filter((i) => {
    const d = new Date(i.scheduled_at);
    return d > todayEnd && d <= tomorrowEnd;
  });
  const thisWeek = items.filter((i) => {
    const d = new Date(i.scheduled_at);
    return d > tomorrowEnd && d <= weekEnd;
  });
  const later = items.filter((i) => new Date(i.scheduled_at) > weekEnd);

  if (today.length) groups.push({ label: "HÔM NAY", items: today });
  if (tomorrow.length) groups.push({ label: "NGÀY MAI", items: tomorrow });
  if (thisWeek.length) groups.push({ label: "TUẦN NÀY", items: thisWeek });
  if (later.length) groups.push({ label: "SAU NÀY", items: later });

  return groups;
}

export function InterviewsPage() {
  const user = useUser();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && tokenStorage.get()) { useAuthStore.getState().fetchMe().catch(() => {}); return; }
    if (!user) { setLoading(false); return; }
    let c = false;
    apiClient.get<InterviewItem[]>("/employer/interviews")
      .then(({ data }) => { if (!c) setInterviews(data); })
      .catch(() => { if (!c) setError("Không thể tải lịch phỏng vấn."); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [user]);

  if (!user) return <GuestPage><Link to="/login"><Button>Đăng nhập</Button></Link></GuestPage>;
  if (user.role !== "employer") return <GuestPage><h2 className="text-xl font-semibold text-gray-900">Không có quyền truy cập</h2></GuestPage>;

  const groups = groupInterviews(interviews);
  const isUpcoming = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 && diff < 60 * 60 * 1000; // within 1 hour
  };

  return (
    <div className="min-h-screen bg-page-bg px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary">Lịch phỏng vấn</p>
            <h1 className="text-3xl font-semibold text-gray-900">Lịch phỏng vấn sắp tới</h1>
          </div>
          <Link to="/employer/dashboard"><Button variant="secondary" size="sm">← Dashboard</Button></Link>
        </div>

        {loading && <div className="space-y-4">{[1,2,3].map(i=><Card key={i}><div className="p-4 space-y-2"><Skeleton className="h-4 w-1/2"/><Skeleton className="h-3 w-1/3"/></div></Card>)}</div>}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

        {!loading && !error && interviews.length === 0 && (
          <Card>
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Chưa có lịch phỏng vấn nào</p>
              <p className="mt-1 text-xs text-gray-500">Đặt lịch phỏng vấn từ trang Quản lý vòng tuyển dụng.</p>
              <div className="mt-4"><Link to="/employer/dashboard"><Button variant="primary" size="sm">Đi đến Dashboard</Button></Link></div>
            </div>
          </Card>
        )}

        {!loading && !error && groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.label}</h2>
            <div className="space-y-2">
              {group.items.map((item) => {
                const time = new Date(item.scheduled_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                const isOnline = (item.location || "").toLowerCase().includes("http") || (item.location || "").toLowerCase().includes("online") || (item.location || "").toLowerCase().includes("meet") || (item.location || "").toLowerCase().includes("zoom");
                const upcoming = isUpcoming(item.scheduled_at);

                return (
                  <Card key={item.round_id} hoverable className="cursor-pointer">
                    <div className="p-4 flex items-start gap-4">
                      <div className="w-14 text-center shrink-0">
                        <p className="text-lg font-bold text-gray-900">{time}</p>
                        {upcoming && <Badge variant="warning" size="sm">Sắp diễn ra</Badge>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.candidate_name} — {item.job_title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isOnline ? "📹 Online" : "📍"} {item.location || "Chưa có địa điểm"} · {item.round_name || `Vòng ${item.round_number}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-page-bg px-4 py-10"><div className="max-w-6xl mx-auto"><Card className="p-8 text-center">{children}</Card></div></div>;
}
