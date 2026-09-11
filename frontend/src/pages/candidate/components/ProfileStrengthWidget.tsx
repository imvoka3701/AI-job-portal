import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Sparkles, ShieldCheck, Upload, Briefcase, Camera } from "lucide-react";
import { Card, CardHeader, CardContent, Button } from "@/components/ui";

interface ProfileStrengthWidgetProps {
  hasAvatar: boolean;
  hasCvOnline: boolean;
  hasCvPdf: boolean;
  hasApplications: boolean;
  onUploadAvatarClick?: () => void;
  onScrollToCvUpload?: () => void;
}

export function ProfileStrengthWidget({
  hasAvatar,
  hasCvOnline,
  hasCvPdf,
  hasApplications,
  onUploadAvatarClick,
  onScrollToCvUpload,
}: ProfileStrengthWidgetProps) {
  // Tính toán % hoàn thiện hồ sơ
  const { score, completedCount, totalCount, tasks } = useMemo(() => {
    const checklist = [
      {
        id: "avatar",
        title: "Cập nhật ảnh đại diện cá nhân",
        desc: "Tăng độ nhận diện trên hệ thống & Messenger",
        weight: 20,
        completed: hasAvatar,
        actionType: "avatar",
        actionLabel: "Tải ảnh",
        icon: Camera,
      },
      {
        id: "cv_online",
        title: "Tạo CV trực tuyến với CV Builder",
        desc: "Chuẩn hóa ATS, tối ưu cho AI scan kỹ năng",
        weight: 30,
        completed: hasCvOnline,
        actionType: "link",
        actionHref: "/cv/new",
        actionLabel: "Tạo CV",
        icon: Sparkles,
      },
      {
        id: "cv_pdf",
        title: "Tải lên file CV định dạng PDF",
        desc: "Dùng để nộp nhanh & phân tích chuyên sâu",
        weight: 25,
        completed: hasCvPdf,
        actionType: "scroll_upload",
        actionLabel: "Tải lên",
        icon: Upload,
      },
      {
        id: "application",
        title: "Gửi ít nhất 1 đơn ứng tuyển việc làm",
        desc: "Mở khóa quy trình phỏng vấn & kết nối HR",
        weight: 25,
        completed: hasApplications,
        actionType: "link",
        actionHref: "/jobs",
        actionLabel: "Khám phá",
        icon: Briefcase,
      },
    ];

    const completed = checklist.filter((item) => item.completed);
    const calculatedScore = completed.reduce((sum, item) => sum + item.weight, 0);

    return {
      score: calculatedScore,
      completedCount: completed.length,
      totalCount: checklist.length,
      tasks: checklist,
    };
  }, [hasAvatar, hasCvOnline, hasCvPdf, hasApplications]);

  // Color theme dựa trên điểm
  const getBadgeStyle = (val: number) => {
    if (val >= 80) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (val >= 50) return "bg-blue-50 text-blue-800 border-blue-200";
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  const getProgressGradient = (val: number) => {
    if (val >= 80) return "from-[#00B86B] to-emerald-500";
    if (val >= 50) return "from-blue-500 to-indigo-500";
    return "from-amber-500 to-orange-500";
  };

  return (
    <Card className="rounded-[32px] border-slate-200/90 shadow-xs bg-white p-6 space-y-5 overflow-hidden">
      <CardHeader className="p-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Độ Hoàn Thiện Hồ Sơ</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {completedCount}/{totalCount} mục cốt lõi đã hoàn thành
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full border ${getBadgeStyle(
              score
            )} tabular-nums`}
          >
            {score}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(
                score
              )} transition-all duration-700 ease-out`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span>Tiêu chuẩn tối thiểu: 75%</span>
            <span className="font-bold text-slate-700">
              {score >= 100 ? "Tuyệt đối 100% 🎉" : `Còn thiếu ${100 - score}%`}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-3 pt-1">
        {/* Actionable Tasks List */}
        <div className="space-y-2">
          {tasks.map((task) => {
            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? "bg-slate-50/70 border-slate-200/60 text-slate-600"
                    : "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200 text-slate-900"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00B86B] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        task.completed ? "line-through text-slate-500 font-medium" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{task.desc}</p>
                  </div>
                </div>

                {!task.completed && (
                  <div className="shrink-0">
                    {task.actionType === "link" && task.actionHref && (
                      <Link to={task.actionHref}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] font-bold rounded-xl border-emerald-200 text-[#00B86B] hover:bg-emerald-50"
                        >
                          {task.actionLabel}
                        </Button>
                      </Link>
                    )}

                    {task.actionType === "avatar" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onUploadAvatarClick}
                        className="h-7 px-2.5 text-[11px] font-bold rounded-xl border-emerald-200 text-[#00B86B] hover:bg-emerald-50"
                      >
                        {task.actionLabel}
                      </Button>
                    )}

                    {task.actionType === "scroll_upload" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onScrollToCvUpload}
                        className="h-7 px-2.5 text-[11px] font-bold rounded-xl border-emerald-200 text-[#00B86B] hover:bg-emerald-50"
                      >
                        {task.actionLabel}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Value Callout Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 text-[#00B86B] shrink-0 mt-0.5" />
          <span>
            Hồ sơ đạt trên <strong>80%</strong> được AI ưu tiên gợi ý cho các NTD hàng đầu và tăng <strong>3.2x</strong> tỷ lệ nhận phỏng vấn.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
