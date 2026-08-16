import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui";
import type { CVEvaluationResult } from "@/types/api";

interface EmployerCandidateRadarChartProps {
  skillAnalysis: CVEvaluationResult["skill_analysis"] | null;
  jobRequirements: string | null;
}

const COMMON_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "Go",
  "React",
  "Node.js",
  "FastAPI",
  "Django",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Testing",
  "System Design",
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
  return found.length > 0 ? found : text
    .split(/[,;\n\r]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .slice(0, 6);
}

export function EmployerCandidateRadarChart({
  skillAnalysis,
  jobRequirements,
}: EmployerCandidateRadarChartProps) {
  const data = useMemo(() => {
    const requiredSkills = extractRequiredSkills(jobRequirements);
    const analyzedSkills = skillAnalysis ? Object.keys(skillAnalysis) : [];
    const axes = Array.from(new Set([...requiredSkills, ...analyzedSkills])).slice(0, 6);

    return axes.map((skill) => ({
      skill,
      candidate: skillAnalysis ? toScore(skillAnalysis[skill] ?? skillAnalysis[skill.toLowerCase()]) : 0,
      requirement: extractRequiredSkills(jobRequirements).some(
        (item) => item.toLowerCase() === skill.toLowerCase(),
      )
        ? 10
        : 0,
    }));
  }, [jobRequirements, skillAnalysis]);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">So sánh ứng viên và JD</h3>
        <p className="text-sm text-gray-500">Radar chart dùng dữ liệu thực từ kết quả đánh giá CV.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Chưa có đủ dữ liệu để hiển thị radar chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)",
                  }}
                />
                <Legend />
                <Radar
                  name="Ứng viên"
                  dataKey="candidate"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
                <Radar
                  name="Yêu cầu JD"
                  dataKey="requirement"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
