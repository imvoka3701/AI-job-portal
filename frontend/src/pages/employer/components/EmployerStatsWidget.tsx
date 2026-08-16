import { Card, CardHeader, CardContent, Skeleton } from "@/components/ui";
import type { EmployerStats } from "@/lib/api/employer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
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
  const chartData = stats.applications_over_time.map(d => ({
    date: d.date.split("-").slice(1).join("/"), // MM/DD
    fullDate: d.date,
    count: d.count
  }));

  const funnelData = stats.funnel?.map(f => ({
    name: f.round_name,
    passed: f.passed,
    pass_rate: f.pass_rate,
  })) || [];

  const cards = [
    {
      title: scoped ? "Job phụ trách" : "Tin đã đăng",
      value: stats.total_jobs,
      subtext: scoped ? `${stats.active_jobs.length} job trong phạm vi` : `${stats.active_jobs.length} tin đang hoạt động`,
      icon: Briefcase,
    },
    {
      title: "Tổng ứng viên",
      value: stats.total_applications,
      subtext: scoped ? "Trong phạm vi được phân công" : "Trên tất cả tin tuyển dụng",
      icon: Users,
    },
    {
      title: "Điểm AI trung bình",
      value: stats.avg_ai_match != null ? `${stats.avg_ai_match}%` : "—",
      subtext: "Độ phù hợp của ứng viên",
      icon: Activity,
    },
    {
      title: "Thời gian tuyển",
      value: stats.time_to_hire_avg_days != null ? `${stats.time_to_hire_avg_days} ngày` : "—",
      subtext: "Trung bình từ lúc nộp đến Offer",
      icon: Clock,
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
            transition={{ delay: idx * 0.1 }}
          >
            <Card hoverable className="p-5 h-full flex flex-col justify-between group overflow-hidden relative border-gray-200 shadow-sm">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-primary group-hover:bg-primary-light/50 transition-colors">
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {card.value}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
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
              {chartData.length === 0 ? <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-center text-sm text-gray-500">Chưa có hồ sơ trong 30 ngày gần đây.</div> : <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B86B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00B86B" stopOpacity={0}/>
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
                    stroke="#00B86B" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    name="Số lượt ứng tuyển"
                  />
                </AreaChart>
              </ResponsiveContainer>}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tỷ lệ chuyển đổi</h2>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              {funnelData.length === 0 ? <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-center text-sm text-gray-500">Chưa có dữ liệu chuyển đổi vòng tuyển.</div> : <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                            <p className="font-semibold text-gray-900 mb-1">{payload[0].payload.name}</p>
                            <p className="text-sm text-primary font-medium">Đạt: {payload[0].value}</p>
                            <p className="text-xs text-gray-500 mt-1">Tỷ lệ pass: {payload[0].payload.pass_rate}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="passed" radius={[0, 4, 4, 0]} barSize={24}>
                    {
                      funnelData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#00B86B" : index === 1 ? "#34d399" : index === 2 ? "#6ee7b7" : "#a7f3d0"} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
