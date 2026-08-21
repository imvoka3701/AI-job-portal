import { Outlet } from "react-router-dom";
import { Header } from "@/pages/jobs/components/Header";
import { Container } from "./Container";

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-page-bg">
      <Header />
      <main className="flex-1 w-full bg-gray-50/30 py-8" id="main-content">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
