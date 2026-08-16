import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Target } from 'lucide-react';

interface RadarChartWidgetProps {
  skillAnalysis?: Record<string, unknown>;
}

export const RadarChartWidget = ({ skillAnalysis = {} }: RadarChartWidgetProps) => {
  const data = Object.entries(skillAnalysis)
    .map(([subject, value]) => {
      const raw = typeof value === "number" ? value : typeof value === "object" && value !== null && "score" in value && typeof value.score === "number" ? value.score : 0;
      const score = raw > 10 ? raw / 10 : raw;
      return { subject, A: Math.min(100, Math.max(0, score * 10)), fullMark: 100 };
    })
    .filter((item) => item.A > 0)
    .slice(0, 6);
  return (
    <Card className="border-gray-200 shadow-sm h-full bg-white relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent pointer-events-none" />
      <CardHeader className="pb-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Phân tích Kỹ năng (AI)</h2>
            <p className="text-xs text-gray-500">Dựa trên CV tổng hợp của bạn</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="h-[240px] w-full mt-4">
          {data.length === 0 ? <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">Đánh giá CV để xem phân tích kỹ năng.</div> : <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Radar
                name="Điểm kỹ năng"
                dataKey="A"
                stroke="#6366f1"
                strokeWidth={2}
                fill="#818cf8"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  );
};
