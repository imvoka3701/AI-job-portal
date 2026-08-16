import { Link } from "react-router-dom";
import { Brain, Compass, FileText, Sparkles } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Header } from "@/pages/jobs/components/Header";
import { useUser } from "@/stores/authStore";

const tools = [
  {
    type: "mbti",
    title: "Trắc nghiệm MBTI",
    description: "Khám phá xu hướng làm việc, giao tiếp và cách bạn ra quyết định.",
    icon: Brain,
    tone: "bg-primary-light text-primary",
  },
  {
    type: "mi",
    title: "Trắc nghiệm MI",
    description: "Nhận diện nhóm năng lực nổi trội để định hướng cách học và phát triển nghề nghiệp.",
    icon: Compass,
    tone: "bg-blue-50 text-blue-700",
  },
] as const;

export function ToolsLandingPage() {
  const user = useUser();

  return (
    <div className="min-h-screen bg-page-bg font-sans text-gray-900">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">CÔNG CỤ ĐỊNH HƯỚNG</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Hiểu mình hơn, chọn việc phù hợp hơn</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Các bài tự đánh giá giúp bạn nhận diện thế mạnh và chuẩn bị tốt hơn cho CV, phỏng vấn và hành trình nghề nghiệp.</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {tools.map(({ type, title, description, icon: Icon, tone }) => (
            <Card key={type} hoverable className="overflow-hidden">
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></div>
                <CardTitle className="mt-5">{title}</CardTitle>
                <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
              </CardHeader>
              <CardContent>
                <Link to={`/tools/${type}`}><Button leftIcon={<Sparkles className="h-4 w-4" />}>Bắt đầu bài test</Button></Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/20 bg-primary-soft">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><h2 className="font-semibold text-gray-900">Kết nối kết quả với hành trình nghề nghiệp</h2><p className="mt-1 text-sm text-gray-600">Tạo CV Builder và khám phá các vị trí phù hợp sau khi hoàn thành bài test.</p></div></div>
            <div className="flex shrink-0 gap-2">{user?.role === "candidate" ? <Link to="/tools/assessments/history"><Button variant="outline" size="sm">Lịch sử kết quả</Button></Link> : <Link to="/login"><Button variant="outline" size="sm">Đăng nhập để lưu</Button></Link>}<Link to="/jobs"><Button size="sm">Xem việc làm</Button></Link></div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
