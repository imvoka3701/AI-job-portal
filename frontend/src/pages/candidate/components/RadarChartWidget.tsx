import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Target, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RadarChartWidgetProps {
  skillAnalysis?: Record<string, unknown>;
}

export const RadarChartWidget = ({ skillAnalysis = {} }: RadarChartWidgetProps) => {
  const dynamicData = Object.entries(skillAnalysis)
    .map(([subject, value]) => {
      const raw =
        typeof value === "number"
          ? value
          : typeof value === "object" && value !== null && "score" in value && typeof value.score === "number"
          ? value.score
          : 0;
      const score = raw > 10 ? raw / 10 : raw;
      return { subject, A: Math.min(100, Math.max(0, score * 10)), fullMark: 100 };
    })
    .filter((item) => item.A > 0)
    .slice(0, 6);

  const fallbackData = [
    { subject: "Frontend", A: 85, fullMark: 100 },
    { subject: "Backend", A: 78, fullMark: 100 },
    { subject: "Database", A: 82, fullMark: 100 },
    { subject: "DevOps", A: 68, fullMark: 100 },
    { subject: "AI Tools", A: 90, fullMark: 100 },
    { subject: "Problem Solving", A: 88, fullMark: 100 },
  ];

  const data = dynamicData.length > 0 ? dynamicData : fallbackData;
  const isSample = dynamicData.length === 0;

  return (
    <Card className="rounded-[32px] border-slate-200/90 shadow-xs h-full bg-white relative overflow-hidden group space-y-2 p-6">
      <CardHeader className="p-0 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00B86B] to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Radar Năng Lực (AI)</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isSample ? "Mô phỏng năng lực kỹ thuật" : "Dựa trên hồ sơ CV của bạn"}
              </p>
            </div>
          </div>

          {isSample && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Mô phỏng
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "1px solid #CBD5E1",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: 700,
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

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Cần cải thiện DevOps?</span>
          <Link
            to="/ai/roadmap"
            className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <Sparkles size={13} />
            <span>Mở Lộ Trình Học</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

