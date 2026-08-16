import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Sparkles } from "lucide-react";
import type { CVEvaluationResult } from "@/types/api";

interface EmployerCandidateRadarChartProps {
  skillAnalysis: CVEvaluationResult["skill_analysis"] | null;
  jobRequirements: string | null;
  jobTitle?: string;
}

const COMMON_SKILLS = [
  "Python", "JavaScript", "TypeScript", "Java", "Go",
  "React", "Node.js", "FastAPI", "Django", "PostgreSQL",
  "Docker", "AWS", "Testing", "System Design",
];

function toScore(value: unknown): number {
  if (typeof value === "number") {
    return Math.max(0, Math.min(10, value > 10 ? value / 10 : value));
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.score === "number") return Math.max(0, Math.min(10, record.score > 10 ? record.score / 10 : record.score));
  }
  return 0;
}

function extractRequiredSkills(text: string | null): string[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const found = COMMON_SKILLS.filter((skill) => haystack.includes(skill.toLowerCase()));
  if (found.length > 0) return found.slice(0, 6);
  return text
    .split(/[,;\n\r]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 30)
    .slice(0, 6);
}

// Demo fallback data used when there's no AI evaluation yet
const DEMO_RADAR_DATA = [
  { skill: "Technical Skills", candidate: 7.5, requirement: 9 },
  { skill: "Problem Solving", candidate: 8,   requirement: 8 },
  { skill: "Communication",   candidate: 6.5, requirement: 7 },
  { skill: "Leadership",      candidate: 5,   requirement: 6 },
  { skill: "Domain Knowledge",candidate: 8.5, requirement: 9 },
  { skill: "Adaptability",    candidate: 7,   requirement: 7 },
];

export function EmployerCandidateRadarChart({
  skillAnalysis,
  jobRequirements,
  jobTitle,
}: EmployerCandidateRadarChartProps) {
  const hasRealData = skillAnalysis !== null;

  const data = useMemo(() => {
    if (!hasRealData) return DEMO_RADAR_DATA;
    const requiredSkills = extractRequiredSkills(jobRequirements);
    const analyzedSkills = Object.keys(skillAnalysis!);
    const axes = Array.from(new Set([...requiredSkills, ...analyzedSkills])).slice(0, 6);

    if (axes.length === 0) return DEMO_RADAR_DATA;

    return axes.map((skill) => ({
      skill,
      candidate: toScore(skillAnalysis![skill] ?? skillAnalysis![skill.toLowerCase()]),
      requirement: extractRequiredSkills(jobRequirements).some(
        (item) => item.toLowerCase() === skill.toLowerCase(),
      )
        ? 9  // realistic target instead of always 10
        : 6, // baseline expectation even for unlisted skills
    }));
  }, [jobRequirements, skillAnalysis, hasRealData]);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">So sánh Kỹ năng vs JD</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasRealData
                ? `Phân tích từ kết quả đánh giá CV — ${jobTitle ?? "vị trí đã chọn"}`
                : "Demo preview — Chạy AI Đánh giá CV để xem kết quả thực tế"}
            </p>
          </div>
          {!hasRealData && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preview
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.08)",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any) => [
                  `${value ?? 0}/10`,
                  name === "candidate" ? "Ứng viên" : "Yêu cầu JD",
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-gray-600">
                    {value === "candidate" ? "Ứng viên" : "Yêu cầu JD"}
                  </span>
                )}
              />
              <Radar
                name="candidate"
                dataKey="candidate"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={hasRealData ? 0.22 : 0.1}
                strokeWidth={2}
                strokeDasharray={hasRealData ? undefined : "4 4"}
              />
              <Radar
                name="requirement"
                dataKey="requirement"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={hasRealData ? 0.16 : 0.08}
                strokeWidth={2}
                strokeDasharray={hasRealData ? undefined : "4 4"}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill gap quick summary */}
        {hasRealData && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Kỹ năng cần cải thiện</p>
            <div className="flex flex-wrap gap-2">
              {data
                .filter((d) => d.candidate < d.requirement - 1)
                .slice(0, 4)
                .map((d) => (
                  <span key={d.skill} className="text-[11px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {d.skill} ({d.candidate}/10 vs {d.requirement}/10 yêu cầu)
                  </span>
                ))}
              {data.filter((d) => d.candidate >= d.requirement).length > 0 && (
                <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  ✓ Đạt {data.filter((d) => d.candidate >= d.requirement).length}/{data.length} tiêu chí
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
