/** Employer Interviews — agenda view grouped by Today/Tomorrow/This Week. */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronRight,
  Users,
  ExternalLink,
  Briefcase,
  CalendarCheck2,
} from "lucide-react";
import { apiClient, tokenStorage } from "@/lib/axios";
import { useUser, useAuthStore } from "@/stores/authStore";
import { Button, Card, Skeleton, EmptyState, ErrorState, PageTransition } from "@/components/ui";
import { getInitials, cn } from "@/lib/utils";

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

const ROUND_TYPE_LABELS: Record<string, string> = {
  cv_screen: "Sàng lọc CV",
  phone_screen: "Phỏng vấn qua điện thoại",
  technical: "Phỏng vấn Kỹ thuật",
  behavioral: "Phỏng vấn Văn hóa / Hành vi",
  final: "Phỏng vấn Vòng cuối",
  custom: "Phỏng vấn Chuyên sâu",
};

function groupInterviews(items: InterviewItem[]) {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const groups: { label: string; count: number; items: InterviewItem[]; badgeColor: string }[] = [];

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

  if (today.length) groups.push({ label: "Hôm nay", count: today.length, items: today, badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" });
  if (tomorrow.length) groups.push({ label: "Ngày mai", count: tomorrow.length, items: tomorrow, badgeColor: "bg-blue-50 text-blue-700 border-blue-200" });
  if (thisWeek.length) groups.push({ label: "Tuần này", count: thisWeek.length, items: thisWeek, badgeColor: "bg-purple-50 text-purple-700 border-purple-200" });
  if (later.length) groups.push({ label: "Sắp tới", count: later.length, items: later, badgeColor: "bg-slate-100 text-slate-700 border-slate-200" });

  return groups;
}

export function InterviewsPage() {
  const user = useUser();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && tokenStorage.get()) {
      useAuthStore.getState().fetchMe().catch(() => {});
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    let c = false;
    apiClient
      .get<InterviewItem[]>("/employer/interviews")
      .then(({ data }) => {
        if (!c) setInterviews(data);
      })
      .catch(() => {
        if (!c) setError("Không thể tải danh sách lịch phỏng vấn. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [user]);

  const groups = useMemo(() => groupInterviews(interviews), [interviews]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const todayCount = interviews.filter((i) => new Date(i.scheduled_at) <= todayEnd).length;
    const onlineCount = interviews.filter((i) => {
      const loc = (i.location || "").toLowerCase();
      return loc.includes("http") || loc.includes("online") || loc.includes("meet") || loc.includes("zoom");
    }).length;

    return {
      total: interviews.length,
      today: todayCount,
      online: onlineCount,
    };
  }, [interviews]);

  const isUpcomingWithinHour = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 && diff < 60 * 60 * 1000;
  };

  if (!user) {
    return (
      <div className="w-full py-16">
        <Card className="max-w-md mx-auto p-8 text-center border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Yêu cầu đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-500">Vui lòng đăng nhập tài khoản Nhà tuyển dụng để xem lịch phỏng vấn.</p>
          <div className="mt-5">
            <Link to="/login">
              <Button variant="primary">Đăng nhập ngay</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition className="w-full space-y-6 pb-12">
      {/* ── Header Banner ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Điều phối tuyển dụng
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Lịch phỏng vấn ứng viên
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
              Theo dõi lịch phỏng vấn tập trung theo từng mốc thời gian, truy cập phòng họp trực tuyến và kết nối nhanh với Pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/employer/candidates">
              <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
                Xem Pipeline Tuyển dụng
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary shadow-2xs">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng lịch phỏng vấn</p>
              <p className="text-lg font-bold text-slate-900">{stats.total} cuộc hẹn</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Diễn ra hôm nay</p>
              <p className="text-lg font-bold text-slate-900">{stats.today} buổi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phỏng vấn Online</p>
              <p className="text-lg font-bold text-slate-900">{stats.online} phòng họp</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border-slate-200">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          title="Không tải được lịch phỏng vấn"
          message={error}
          onRetry={() => window.location.reload()}
          className="py-12 bg-white rounded-3xl border border-slate-200 shadow-xs"
        />
      )}

      {!loading && !error && interviews.length === 0 && (
        <EmptyState
          icon={<Calendar className="w-10 h-10 text-slate-400" />}
          title="Chưa có lịch phỏng vấn nào sắp tới"
          description="Lên lịch phỏng vấn cho ứng viên từ trang Pipeline tuyển dụng để bắt đầu theo dõi tại đây."
          action={
            <Link to="/employer/candidates">
              <Button variant="primary" size="sm">
                Đi đến Pipeline ứng viên
              </Button>
            </Link>
          }
          className="py-16 bg-white rounded-3xl border border-slate-200 shadow-xs"
        />
      )}

      {!loading && !error && groups.map((group) => (
        <div key={group.label} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {group.label}
            </h2>
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold border", group.badgeColor)}>
              {group.count}
            </span>
          </div>

          <div className="grid gap-3">
            {group.items.map((item, idx) => {
              const dateObj = new Date(item.scheduled_at);
              const timeStr = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
              const dateStr = dateObj.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
              const isOnline = (item.location || "").toLowerCase().includes("http") ||
                (item.location || "").toLowerCase().includes("online") ||
                (item.location || "").toLowerCase().includes("meet") ||
                (item.location || "").toLowerCase().includes("zoom");
              const upcoming = isUpcomingWithinHour(item.scheduled_at);
              const initials = getInitials(item.candidate_name);
              const roundLabel = item.round_name || ROUND_TYPE_LABELS[item.round_type] || `Vòng ${item.round_number}`;

              return (
                <motion.div
                  key={item.round_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                >
                  <Card
                    hoverable
                    className={cn(
                      "p-5 border transition-all duration-200 bg-white",
                      upcoming
                        ? "border-amber-300 ring-2 ring-amber-300/30 shadow-md bg-gradient-to-r from-white via-amber-50/20 to-white"
                        : "border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Time + Avatar + Candidate info */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Time Box */}
                        <div className="w-20 text-center py-2 px-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
                          <p className="text-base font-bold text-slate-900 tracking-tight">{timeStr}</p>
                          <p className="text-[11px] font-medium text-slate-500 uppercase mt-0.5">{dateStr}</p>
                          {upcoming && (
                            <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Sắp bắt đầu
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {initials}
                        </div>

                        {/* Candidate & Job Info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 truncate">
                              {item.candidate_name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {roundLabel}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-700 truncate">{item.job_title}</span>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{item.candidate_email}</span>
                          </p>

                          {/* Meeting Link or Physical Location */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Phòng họp Online:{" "}
                                {item.location?.startsWith("http") ? (
                                  <a
                                    href={item.location}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 underline hover:text-emerald-800 inline-flex items-center gap-0.5"
                                  >
                                    Mở liên kết cuộc họp <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span>{item.location}</span>
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{item.location || "Chưa xác định địa điểm"}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Direct Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link to={`/employer/candidates?search=${encodeURIComponent(item.candidate_name)}`}>
                          <Button variant="outline" size="sm" className="text-xs h-8">
                            Hồ sơ ứng viên <ChevronRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </PageTransition>
  );
}
