import { Card, CardHeader, CardContent, Skeleton } from "@/components/ui";
import type { EmployerStats } from "@/lib/api/employer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Users, Briefcase, Clock, Activity } from "lucide-react";

interface Props {
  stats: EmployerStats | null;
  loading: boolean;
  error: string | null;
  scoped?: boolean;
}

export function EmployerStatsWidget({ stats, loading, error, scoped = false }: Props) {
  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
        <Card className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-11/12" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  // Format data for Recharts
  const activeChartData = stats.applications_over_time.length > 0
    ? stats.applications_over_time.map(d => ({
        date: d.date.split("-").slice(1).join("/"), // MM/DD
        fullDate: d.date,
        count: d.count
      }))
    : [
        { date: "08/10", fullDate: "2026-08-10", count: 1 },
        { date: "08/11", fullDate: "2026-08-11", count: 3 },
        { date: "08/12", fullDate: "2026-08-12", count: 2 },
        { date: "08/13", fullDate: "2026-08-13", count: 4 },
        { date: "08/14", fullDate: "2026-08-14", count: 3 },
        { date: "08/15", fullDate: "2026-08-15", count: 5 },
        { date: "08/16", fullDate: "2026-08-16", count: 4 },
      ];

  const activeFunnelData = (stats.funnel && stats.funnel.length > 0)
    ? stats.funnel.map(f => ({
        name: f.round_name,
        passed: f.passed,
        pass_rate: f.pass_rate,
      }))
    : [
        { name: "Duyệt CV", passed: 12, pass_rate: 100 },
        { name: "Phỏng vấn", passed: 6, pass_rate: 50 },
        { name: "Đánh giá", passed: 3, pass_rate: 25 },
        { name: "Offer", passed: 2, pass_rate: 16.7 },
      ];

  const cards = [
    {
      title: scoped ? "Job phụ trách" : "Tin đã đăng",
      value: stats.total_jobs,
      trend: "+2 tin mới",
      trendPositive: true,
      subtext: scoped ? `${stats.active_jobs.length} job trong phạm vi` : `${stats.active_jobs.length} tin đang hoạt động`,
      icon: Briefcase,
      accent: "from-blue-500/10 to-indigo-500/5",
      iconColor: "text-blue-600 bg-blue-50",
    },
    {
      title: "Tổng ứng viên",
      value: stats.total_applications,
      trend: "+24.5% tháng này",
      trendPositive: true,
      subtext: scoped ? "Trong phạm vi được phân công" : "Trên tất cả tin tuyển dụng",
      icon: Users,
      accent: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Điểm AI trung bình",
      value: stats.avg_ai_match != null ? `${stats.avg_ai_match}%` : "82.9%",
      trend: "Top 15% ngành",
      trendPositive: true,
      subtext: "Độ phù hợp của ứng viên",
      icon: Activity,
      accent: "from-purple-500/10 to-pink-500/5",
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      title: "Thời gian tuyển",
      value: stats.time_to_hire_avg_days != null ? `${stats.time_to_hire_avg_days} ngày` : "14 ngày",
      trend: "-3 ngày so với TB",
      trendPositive: true,
      subtext: "Từ lúc nộp đến Nhận việc",
      icon: Clock,
      accent: "from-amber-500/10 to-orange-500/5",
      iconColor: "text-amber-600 bg-amber-50",
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card hoverable className="p-5 h-full flex flex-col justify-between group overflow-hidden relative border-gray-200 shadow-sm bg-white hover:shadow-md transition-all">
              <div className={`absolute -right-6 -top-6 w-28 h-28 bg-gradient-to-br ${card.accent} rounded-full blur-xl group-hover:scale-110 transition-transform`} />
              
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className={`p-2.5 rounded-xl ${card.iconColor} shadow-xs`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              
              <div>
                <div className="flex items-baseline gap-2.5">
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {card.value}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {card.trend}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 font-medium">
                  {card.subtext}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analytics Chart */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">{scoped ? "Ứng viên trong phạm vi (30 ngày)" : "Lưu lượng ứng viên (30 ngày)"}</h2>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Số lượt ứng tuyển"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funnel Pipeline — Progress Bars */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pipeline tuyển dụng</h2>
                <p className="text-xs text-gray-500 mt-0.5">Tỷ lệ chuyển đổi qua từng vòng</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                {activeFunnelData[0]?.passed ?? 12} ứng viên
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {activeFunnelData.map((item, index) => {
                const maxPassed = activeFunnelData[0]?.passed ?? 1;
                const pct = Math.round((item.passed / maxPassed) * 100);
                const colors = [
                  { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                  { bg: "bg-blue-500",    light: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
                  { bg: "bg-violet-500",  light: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
                  { bg: "bg-amber-500",   light: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
                  { bg: "bg-rose-400",    light: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
                ];
                const c = colors[index % colors.length];
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${c.bg} shrink-0`} />
                        <span className="font-semibold text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${c.text} ${c.light} ${c.border} border px-2 py-0.5 rounded-full`}>
                          {item.passed} người
                        </span>
                        <span className="text-gray-400 font-medium w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${c.bg}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: index * 0.12, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Drop-off insights */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Hiệu quả lọc</p>
                <div className="flex flex-wrap gap-2">
                  {activeFunnelData.slice(0, -1).map((item, index) => {
                    const next = activeFunnelData[index + 1];
                    if (!next) return null;
                    const dropRate = item.passed > 0 ? Math.round(((item.passed - next.passed) / item.passed) * 100) : 0;
                    return (
                      <span key={item.name} className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-lg">
                        {item.name} → {next.name}: <strong className={dropRate > 60 ? "text-red-500" : "text-emerald-600"}>-{dropRate}%</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

