import { Outlet } from "react-router-dom";
import { Header } from "@/pages/jobs/components/Header";

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-page-bg">
      <Header />
      <main className="flex-1 w-full" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
