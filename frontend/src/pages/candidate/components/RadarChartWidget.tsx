import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, Button, Badge } from "@/components/ui";
import { Target, Sparkles, ArrowUpRight, UploadCloud, FileEdit } from "lucide-react";
import { Link } from "react-router-dom";
import type { Resume } from "@/types/resume";
import type { CvDocument } from "@/types/cvDocument";

interface RadarChartWidgetProps {
  resume?: Resume | null;
  cvDocument?: CvDocument | null;
  skillAnalysis?: Record<string, unknown> | null;
  onScrollToUpload?: () => void;
  onEvaluateResume?: (resumeId: number) => Promise<void>;
  isEvaluatingResume?: boolean;
}

interface RadarDataPoint {
  subject: string;
  fullName: string;
  A: number;
  fullMark: number;
}

function truncateLabel(text: string, maxLen = 18): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const sub = trimmed.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > 8) {
    return trimmed.slice(0, lastSpace) + "…";
  }
  return trimmed.slice(0, maxLen - 1) + "…";
}

export const RadarChartWidget = ({
  resume,
  cvDocument,
  skillAnalysis,
  onScrollToUpload,
  onEvaluateResume,
  isEvaluatingResume = false,
}: RadarChartWidgetProps) => {
  // Trích xuất dữ liệu năng lực thực tế từ CV (Không hardcode)
  const { data, hasRealData, isAiEvaluated, industryName, weakestSkill } = useMemo(() => {
    // 1. Ưu tiên dữ liệu đánh giá chi tiết từ prop hoặc resume.ai_evaluation_json
    let rawAnalysis: Record<string, unknown> | null = skillAnalysis || null;

    if (!rawAnalysis && resume?.ai_evaluation_json) {
      try {
        const parsed = JSON.parse(resume.ai_evaluation_json);
        if (parsed && typeof parsed.skill_analysis === "object" && parsed.skill_analysis !== null) {
          rawAnalysis = parsed.skill_analysis as Record<string, unknown>;
        }
      } catch {
        // Parse error ignored
      }
    }

    if (rawAnalysis && Object.keys(rawAnalysis).length > 0) {
      const points: RadarDataPoint[] = Object.entries(rawAnalysis)
        .map(([rawSubject, value]) => {
          const raw =
            typeof value === "number"
              ? value
              : typeof value === "object" && value !== null && "score" in value && typeof (value as any).score === "number"
              ? (value as any).score
              : 0;
          const score = raw > 10 ? raw : raw * 10;
          const cleanSubject = String(rawSubject).trim();
          return {
            subject: truncateLabel(cleanSubject, 18),
            fullName: cleanSubject,
            A: Math.min(100, Math.max(10, Math.round(score))),
            fullMark: 100,
          };
        })
        .filter((item) => item.A > 0)
        .slice(0, 6);

      if (points.length >= 3) {
        const sorted = [...points].sort((a, b) => a.A - b.A);
        return {
          data: points,
          hasRealData: true,
          isAiEvaluated: true,
          industryName: resume?.parsed_industry || "Chuyên môn",
          weakestSkill: sorted[0],
        };
      }
    }

    // 2. Trích xuất từ kỹ năng đã được AI phân tích trong Resume (parsed_key_skills)
    let extractedSkills: string[] = [];
    if (resume?.parsed_key_skills) {
      try {
        const parsed = JSON.parse(resume.parsed_key_skills);
        if (Array.isArray(parsed)) {
          extractedSkills = parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        // Parse error ignored
      }
    }

    // 3. Nếu chưa có, lấy từ CV Builder (content_json.skills)
    if (extractedSkills.length === 0 && cvDocument?.content_json?.skills) {
      const docSkills = cvDocument.content_json.skills;
      if (Array.isArray(docSkills)) {
        extractedSkills = docSkills
          .map((s) => {
            if (typeof s === "string") return s.trim();
            if (typeof s === "object" && s && "name" in s) return String((s as any).name).trim();
            return "";
          })
          .filter(Boolean);
      }
    }

    // 4. Có kỹ năng thực tế nhưng CHƯA CHẠY ĐÁNH GIÁ AI
    // Minh bạch tuyệt đối: Không sinh điểm ngẫu nhiên/giả mạo
    if (extractedSkills.length >= 3) {
      const points: RadarDataPoint[] = extractedSkills.slice(0, 6).map((skill) => ({
        subject: truncateLabel(skill, 18),
        fullName: skill,
        A: 50,
        fullMark: 100,
      }));

      return {
        data: points,
        hasRealData: true,
        isAiEvaluated: false,
        industryName: resume?.parsed_industry || "Chuyên môn",
        weakestSkill: null,
      };
    }

    // 5. Chưa có dữ liệu thực tế -> Không hardcode điểm giả mạo
    return {
      data: [],
      hasRealData: false,
      isAiEvaluated: false,
      industryName: "Chưa có hồ sơ",
      weakestSkill: null,
    };
  }, [resume, cvDocument, skillAnalysis]);

  return (
    <Card className="rounded-[32px] border-slate-200/90 shadow-xs h-full bg-white relative overflow-hidden group space-y-2 p-6">
      <CardHeader className="p-0 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Radar Năng Lực (AI)</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {hasRealData
                  ? isAiEvaluated
                    ? `Phân tích từ ${data.length} kỹ năng thực tế qua AI`
                    : `Đã nhận diện ${data.length} kỹ năng từ CV · Chờ AI chấm điểm`
                  : "Chưa có dữ liệu phân tích năng lực"}
              </p>
            </div>
          </div>

          <Badge
            variant="default"
            className={
              hasRealData
                ? isAiEvaluated
                  ? "text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-[10px] font-bold text-amber-800 bg-amber-50 border-amber-200"
                : "text-[10px] font-bold text-slate-600 bg-slate-100 border-slate-200"
            }
          >
            {hasRealData
              ? isAiEvaluated
                ? `Hồ sơ: ${industryName}`
                : "Chờ AI chấm điểm"
              : "Chờ phân tích"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-4">
        {hasRealData && data.length >= 3 ? (
          <>
            <div className="h-[235px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="58%"
                  margin={{ top: 10, right: 28, bottom: 10, left: 28 }}
                  data={data}
                >
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#334155", fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as RadarDataPoint;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-lg text-xs space-y-1 z-50">
                            <p className="font-bold text-slate-800 leading-snug">{item.fullName || item.subject}</p>
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-0.5">
                              <span className="text-[11px] text-slate-500 font-medium">Điểm năng lực:</span>
                              <span className="text-sm font-black text-emerald-700">{item.A}</span>
                              <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Radar
                    name="Điểm năng lực"
                    dataKey="A"
                    stroke="#00B86B"
                    strokeWidth={2.5}
                    fill="#00B86B"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {!isAiEvaluated && onEvaluateResume && resume?.id ? (
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  Chưa có điểm AI cho 6 kỹ năng này
                </span>
                <Button
                  size="sm"
                  onClick={() => onEvaluateResume(resume.id)}
                  disabled={isEvaluatingResume}
                  className="shrink-0 h-7 text-[11px] font-bold bg-[#00B86B] hover:bg-emerald-700 text-white gap-1 rounded-xl shadow-xs"
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>{isEvaluatingResume ? "AI đang chấm..." : "Chấm điểm AI ngay"}</span>
                </Button>
              </div>
            ) : (
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-slate-600 font-medium text-[11px] truncate"
                    title={
                      weakestSkill
                        ? `Cần cải thiện ${weakestSkill.fullName || weakestSkill.subject} (${weakestSkill.A}%)?`
                        : "Muốn nâng cao kỹ năng?"
                    }
                  >
                    <span className="text-amber-600 font-bold mr-1">⚡ Cải thiện:</span>
                    {weakestSkill
                      ? `${weakestSkill.fullName || weakestSkill.subject} (${weakestSkill.A}%)`
                      : "Nâng cao kỹ năng chuyên môn"}
                  </p>
                </div>
                <Link
                  to={
                    weakestSkill
                      ? `/ai/roadmap?targetRole=${encodeURIComponent(weakestSkill.fullName || weakestSkill.subject)}`
                      : "/ai/roadmap"
                  }
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-colors shadow-2xs"
                  title="Tạo lộ trình học bù kỹ năng bằng AI"
                >
                  <Sparkles size={12} className="text-amber-500 shrink-0" />
                  <span>Mở Lộ Trình Học</span>
                  <ArrowUpRight size={12} className="shrink-0" />
                </Link>
              </div>
            )}
          </>
        ) : (
          /* Trạng thái minh bạch khi ứng viên chưa tải lên CV hoặc CV chưa có đủ kỹ năng */
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/70 border border-slate-100 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400">
              <Target size={24} className="text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800">Chưa có dữ liệu kỹ năng</p>
              <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                Tải lên CV (PDF) hoặc tạo CV Builder để AI tự động vẽ biểu đồ Radar năng lực chuyên môn của bạn.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1 w-full max-w-[260px]">
              {onScrollToUpload && (
                <Button
                  size="sm"
                  onClick={onScrollToUpload}
                  className="flex-1 h-8 text-[11px] font-bold bg-[#00B86B] hover:bg-emerald-700 text-white gap-1 rounded-xl shadow-xs"
                >
                  <UploadCloud size={13} />
                  <span>Tải CV ngay</span>
                </Button>
              )}
              <Link
                to="/candidate/cv/new"
                className="flex-1 inline-flex items-center justify-center h-8 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 gap-1 rounded-xl transition-colors shadow-2xs"
              >
                <FileEdit size={13} />
                <span>Tạo CV mới</span>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
