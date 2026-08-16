import { X, Target, Lightbulb, Zap } from "lucide-react";
import { useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface CVEvaluationResponse {
  overall_score: number;
  summary: string;
  suggestions: string[];
  skill_analysis: Record<string, number>;
}

interface AICVReviewModalProps {
  evaluation: CVEvaluationResponse | null;
  onClose: () => void;
}

export function AICVReviewModal({ evaluation, onClose }: AICVReviewModalProps) {
  useEffect(() => {
    if (evaluation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [evaluation]);

  if (!evaluation) return null;

  // Convert dict to array for Recharts
  const chartData = Object.entries(evaluation.skill_analysis || {}).map(([subject, A]) => ({
    subject,
    A: typeof A === 'number' ? A : 50, // Fallback if AI returns something weird
    fullMark: 100
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-soft to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Đánh giá CV</h2>
              <p className="text-xs text-gray-500">Phân tích bởi Deepseek LLM</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Chart & Score */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wider">Điểm tổng quan</p>
                <div className="text-6xl font-black text-gray-900 mb-2">
                  {evaluation.overall_score.toFixed(1)}<span className="text-3xl text-gray-400">/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(evaluation.overall_score / 10) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-[300px]">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Phân tích kỹ năng
                </h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip />
                      <Radar name="Kỹ năng" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Không có dữ liệu kỹ năng</div>
                )}
              </div>
            </div>

            {/* Right: Summary & Suggestions */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Tóm tắt</h3>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {evaluation.summary}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Gợi ý cải thiện
                </h3>
                <ul className="space-y-3">
                  {evaluation.suggestions.map((sug, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
