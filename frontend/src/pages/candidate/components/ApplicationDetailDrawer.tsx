import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Sparkles,
  Trash2,
  Video,
  XCircle,
  ArrowUpRight,
  ChevronDown,
  Zap,
} from "lucide-react";
import {
  Drawer,
  Button,
  Badge,
  ConfirmDialog,
  ApplicationStatusBadge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { getCalendarLinks, downloadIcsFile, type RoundItem } from "@/lib/api/rounds";
import type { Application } from "@/types/application";
import { SkillGapPanel } from "@/pages/employer/components/SkillGapPanel";

interface ApplicationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  rounds?: RoundItem[];
  onWithdraw?: (applicationId: number) => Promise<void>;
  onOpenChat?: (application: Application) => void;
  onPreviewResume?: (resumeId: number) => void;
}

export function ApplicationDetailDrawer({
  isOpen,
  onClose,
  application,
  rounds = [],
  onWithdraw,
  onOpenChat,
  onPreviewResume,
}: ApplicationDetailDrawerProps) {
  const [showConfirmWithdraw, setShowConfirmWithdraw] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [calendarLoadingId, setCalendarLoadingId] = useState<number | null>(null);
  const [showSkillGap, setShowSkillGap] = useState(false);

  if (!application) return null;

  const job = application.job;
  const companyName =
    job?.employer?.company_name ||
    job?.employer?.full_name ||
    "Doanh nghiệp đối tác";

  const isPending = application.status === "pending";

  const handleGoogleCal = async (roundId: number) => {
    try {
      setCalendarLoadingId(roundId);
      const links = await getCalendarLinks(roundId);
      if (links.google_calendar_url) {
        window.open(links.google_calendar_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // ignore
    } finally {
      setCalendarLoadingId(null);
    }
  };

  const handleDownloadIcs = async (roundId: number) => {
    try {
      setCalendarLoadingId(roundId);
      await downloadIcsFile(roundId);
    } catch {
      // ignore
    } finally {
      setCalendarLoadingId(null);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!onWithdraw) return;
    try {
      setIsWithdrawing(true);
      await onWithdraw(application.id);
      setShowConfirmWithdraw(false);
      onClose();
    } catch {
      // handled by parent or toast
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getRoundStatusBadge = (status: RoundItem["status"]) => {
    switch (status) {
      case "passed":
        return <Badge variant="success" size="sm" className="text-[10px] font-bold">Đã đạt</Badge>;
      case "in_progress":
        return <Badge variant="warning" size="sm" className="text-[10px] font-bold">Đang tiến hành</Badge>;
      case "failed":
        return <Badge variant="danger" size="sm" className="text-[10px] font-bold">Chưa đạt</Badge>;
      case "skipped":
        return <Badge variant="default" size="sm" className="text-[10px] font-bold">Bỏ qua</Badge>;
      default:
        return <Badge variant="default" size="sm" className="text-[10px] font-bold">Chờ thực hiện</Badge>;
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Tiến Trình Ứng Tuyển & Phỏng Vấn"
        description={`Mã đơn: #${application.id} · Cập nhật theo thời gian thực`}
        className="max-w-xl"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            {isPending && onWithdraw ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmWithdraw(true)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs rounded-xl"
              >
                <Trash2 size={13} className="mr-1.5" />
                <span>Rút đơn ứng tuyển</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {onOpenChat && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenChat(application);
                  }}
                  className="bg-[#00B86B] hover:bg-[#00995C] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <MessageSquare size={13} className="mr-1.5" />
                  <span>Nhắn tin HR</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs font-bold"
              >
                Đóng
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* 1. Job Header Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  <span>{companyName}</span>
                </span>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {job?.title || `Vị trí tuyển dụng #${application.job_id}`}
                </h3>
              </div>
              <ApplicationStatusBadge status={application.status} size="sm" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <span className="flex items-center gap-1">
                <Clock size={13} />
                <span>Nộp ngày: {new Date(application.applied_at).toLocaleDateString("vi-VN")}</span>
              </span>
              <Link
                to={`/jobs/${application.job_id}`}
                target="_blank"
                className="text-[#00B86B] hover:underline font-bold flex items-center gap-0.5 ml-auto"
              >
                <span>Xem tin tuyển dụng gốc</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          {/* 2. Submitted CV & AI Feedback Section */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-[#00B86B]" />
                <span>Hồ Sơ CV Đã Nộp</span>
              </h4>

              {application.ai_matching_score ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles size={12} />
                  <span>{application.ai_matching_score}% Điểm AI Match</span>
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#00B86B] flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {application.resume_id
                      ? `File CV PDF (ID: #${application.resume_id})`
                      : application.cv_document_id
                      ? `Bản CV Trực Tuyến Builder (ID: #${application.cv_document_id})`
                      : "Hồ sơ ứng viên"}
                  </p>
                  <p className="text-[10px] text-slate-400">Đã gửi tới bộ phận tuyển dụng</p>
                </div>
              </div>

              {application.resume_id && onPreviewResume && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreviewResume(application.resume_id!)}
                  className="h-7 text-[11px] font-bold rounded-lg border-slate-200 shrink-0"
                >
                  Xem CV
                </Button>
              )}

              {application.cv_document_id && (
                <Link to={`/cv/${application.cv_document_id}/preview`} target="_blank">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] font-bold rounded-lg border-slate-200 shrink-0"
                  >
                    Xem CV
                  </Button>
                </Link>
              )}
            </div>

            {application.ai_feedback && (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                  <Sparkles size={12} />
                  <span>Đánh giá tương thích từ AI:</span>
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">{application.ai_feedback}</p>
              </div>
            )}

            {/* AI Skill Gap Analysis Accordion */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSkillGap((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-200/80 hover:border-amber-300 text-xs font-bold text-amber-900 transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Phân tích khoảng cách kỹ năng & Lộ trình học (AI Skill Gap)</span>
                </span>
                <ChevronDown size={14} className={cn("text-amber-600 transition-transform duration-200", showSkillGap && "rotate-180")} />
              </button>

              {showSkillGap && (
                <div className="mt-3">
                  <SkillGapPanel
                    jobId={application.job_id}
                    resumeId={application.resume_id ?? undefined}
                    cvDocumentId={application.cv_document_id ?? undefined}
                    autoFetch={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Detailed Rounds Stepper Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" />
                <span>Chi Tiết Các Vòng Tuyển Dụng ({rounds.length} vòng)</span>
              </h4>
            </div>

            {rounds.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                Chưa có thông tin các vòng phỏng vấn cho đơn ứng tuyển này.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {rounds.map((round, idx) => {
                  const isScheduled = Boolean(round.scheduled_at);
                  const isPassed = round.status === "passed";
                  const isFailed = round.status === "failed";
                  const isInProgress = round.status === "in_progress";

                  return (
                    <div key={round.id || idx} className="relative space-y-2">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${
                          isPassed
                            ? "bg-emerald-500 border-white text-white shadow-xs"
                            : isFailed
                            ? "bg-rose-500 border-white text-white shadow-xs"
                            : isInProgress
                            ? "bg-amber-400 border-white text-white animate-pulse"
                            : "bg-slate-200 border-white text-slate-500"
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 size={12} />
                        ) : isFailed ? (
                          <XCircle size={12} />
                        ) : (
                          <span>{round.round_number || idx + 1}</span>
                        )}
                      </div>

                      {/* Round Box */}
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-black text-slate-900">
                              {round.round_name || `Vòng ${round.round_number || idx + 1}`}
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Loại hình: <span className="font-semibold text-slate-600">{round.round_type}</span>
                            </p>
                          </div>
                          {getRoundStatusBadge(round.status)}
                        </div>

                        {/* Scheduled info if exists */}
                        {isScheduled && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
                              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                <Video size={13} className="text-indigo-600 animate-pulse" />
                                <span>
                                  Lịch hẹn: {new Date(round.scheduled_at!).toLocaleString("vi-VN")}
                                </span>
                              </div>

                              {round.location && (
                                <p className="text-[11px] text-indigo-700 truncate">
                                  Địa điểm / Link họp:{" "}
                                  {round.location.startsWith("http") ? (
                                    <a
                                      href={round.location}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold underline hover:text-indigo-950"
                                    >
                                      {round.location}
                                    </a>
                                  ) : (
                                    <strong>{round.location}</strong>
                                  )}
                                </p>
                              )}
                            </div>

                            {/* Calendar sync actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={calendarLoadingId === round.id}
                                onClick={() => handleGoogleCal(round.id)}
                                className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                <CalendarPlus size={12} className="mr-1 text-amber-500" />
                                <span>Google Calendar</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={calendarLoadingId === round.id}
                                onClick={() => handleDownloadIcs(round.id)}
                                className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                <Download size={12} className="mr-1 text-sky-500" />
                                <span>Tải .ICS</span>
                              </Button>

                              {round.location && round.location.startsWith("http") && (
                                <a
                                  href={round.location}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-auto"
                                >
                                  <Button
                                    size="sm"
                                    className="h-7 px-3 text-[10px] font-black bg-[#00B86B] hover:bg-[#00995C] text-white rounded-lg shadow-2xs"
                                  >
                                    <span>Vào Họp</span>
                                    <ArrowUpRight size={11} className="ml-1" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {round.notes && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                            <span className="font-bold text-slate-700">Ghi chú:</span> {round.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Confirm Dialog for Withdrawal */}
      <ConfirmDialog
        isOpen={showConfirmWithdraw}
        title="Rút đơn ứng tuyển?"
        description={`Bạn có chắc chắn muốn rút đơn ứng tuyển vị trí "${job?.title || "này"}" tại ${companyName}? Sau khi rút đơn, hồ sơ sẽ được gỡ bỏ khỏi danh sách xét duyệt của nhà tuyển dụng.`}
        confirmLabel={isWithdrawing ? "Đang xử lý..." : "Xác nhận rút đơn"}
        cancelLabel="Hủy bỏ"
        variant="destructive"
        onConfirm={handleConfirmWithdraw}
        onClose={() => setShowConfirmWithdraw(false)}
      />
    </>
  );
}
