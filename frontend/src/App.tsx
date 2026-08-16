import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { EmployerLandingPage } from "@/pages/employer/landing/EmployerLandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { GoogleCallback } from "@/pages/auth/GoogleCallback";
import { JobListPage } from "@/pages/jobs/JobListPage";
import { JobDetailPage } from "@/pages/jobs/JobDetailPage";
import { CandidateDashboard } from "@/pages/candidate/CandidateDashboard";
import { EmployerJobsPage } from "@/pages/employer/jobs/EmployerJobsPage";
import { NewJobPage } from "@/pages/employer/jobs/NewJobPage";
import { AIMatchingPage } from "@/pages/ai/AIMatchingPage";
import { RoadmapPage } from "@/pages/ai/RoadmapPage";
import { EmployerDashboard } from "@/pages/employer/EmployerDashboard";
import { EmployerCandidatesPage } from "@/pages/employer/EmployerCandidatesPage";
import { InterviewsPage } from "@/pages/employer/InterviewsPage";
import { EmployerTeamPage } from "@/pages/employer/EmployerTeamPage";
import { RecruitmentRequestsPage } from "@/pages/employer/RecruitmentRequestsPage";
import { EmployerInvitationAcceptPage } from "@/pages/employer/EmployerInvitationAcceptPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminCompanies } from "@/pages/admin/AdminCompanies";
import { AdminJobs } from "@/pages/admin/AdminJobs";
import { AdminUsers } from "@/pages/admin/AdminUsers";
import { AdminAuditLogs } from "@/pages/admin/AdminAuditLogs";
import { AdminInterviewsPage } from "@/pages/admin/AdminInterviewsPage";
import { CVListPage } from "@/pages/candidate/cv/CVListPage";
import { CVEditorPage } from "@/pages/candidate/cv/CVEditorPage";
import { ToolsLandingPage } from "@/pages/tools/ToolsLandingPage";
import { AssessmentPage } from "@/pages/tools/AssessmentPage";
import { AssessmentHistoryPage } from "@/pages/tools/AssessmentHistoryPage";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployerLayout } from "@/components/layout/EmployerLayout";
import { AIAssistantWidget } from "@/components/ai-assistant/AIAssistantWidget";

function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (token && !user) {
      fetchMe().catch(() => {});
    }
  }, [token, user, fetchMe]);

  return (
    <HelmetProvider>
      <Routes>
        {/* Landing page — default route */}
        <Route path="/" element={<JobListPage />} />
        <Route path="/employer" element={<EmployerLandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/employer/invitations/:token/accept" element={<EmployerInvitationAcceptPage />} />

        {/* Public Jobs */}
        <Route path="/jobs" element={<JobListPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* Public Tools (MBTI / MI) */}
        <Route path="/tools" element={<ToolsLandingPage />} />
        <Route path="/tools/:type" element={<AssessmentPage />} />
        <Route
          path="/tools/assessments/history"
          element={<ProtectedRoute allowedRoles={["candidate"]}><AssessmentHistoryPage /></ProtectedRoute>}
        />

        {/* Dashboard Routes with Layout */}
        <Route element={<DashboardLayout />}>
          {/* Candidate Dashboard */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute allowedRoles={["candidate"]}><CandidateDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/ai/matching" 
            element={<ProtectedRoute allowedRoles={["candidate"]}><AIMatchingPage /></ProtectedRoute>} 
          />
          <Route 
            path="/ai/roadmap" 
            element={<ProtectedRoute allowedRoles={["candidate"]}><RoadmapPage /></ProtectedRoute>} 
          />
          <Route path="/cv" element={<ProtectedRoute allowedRoles={["candidate"]}><CVListPage /></ProtectedRoute>} />
          <Route path="/cv/new" element={<ProtectedRoute allowedRoles={["candidate"]}><CVEditorPage /></ProtectedRoute>} />
          <Route path="/cv/:id/edit" element={<ProtectedRoute allowedRoles={["candidate"]}><CVEditorPage /></ProtectedRoute>} />
          <Route path="/cv/:id/preview" element={<ProtectedRoute allowedRoles={["candidate"]}><CVEditorPage previewOnly /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/companies" 
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminCompanies /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/jobs" 
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminJobs /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/users" 
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} 
          />
          <Route
            path="/admin/interviews"
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminInterviewsPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/audit-logs"
            element={<ProtectedRoute allowedRoles={["admin"]}><AdminAuditLogs /></ProtectedRoute>}
          />
        </Route>

        {/* Employer Routes with dedicated EmployerLayout */}
        <Route element={<EmployerLayout />}>
          <Route 
            path="/employer/dashboard" 
            element={<ProtectedRoute allowedRoles={["employer"]}><EmployerDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/employer/candidates" 
            element={<ProtectedRoute allowedRoles={["employer"]}><EmployerCandidatesPage /></ProtectedRoute>} 
          />
          <Route 
            path="/employer/interviews" 
            element={<ProtectedRoute allowedRoles={["employer"]}><InterviewsPage /></ProtectedRoute>} 
          />
          <Route 
            path="/employer/jobs" 
            element={<ProtectedRoute allowedRoles={["employer"]}><EmployerJobsPage /></ProtectedRoute>} 
          />
          <Route 
            path="/employer/jobs/new" 
            element={<ProtectedRoute allowedRoles={["employer"]}><NewJobPage /></ProtectedRoute>} 
          />
          <Route
            path="/employer/team"
            element={<ProtectedRoute allowedRoles={["employer"]}><EmployerTeamPage /></ProtectedRoute>}
          />
          <Route
            path="/employer/recruitment-requests"
            element={<ProtectedRoute allowedRoles={["employer"]}><RecruitmentRequestsPage /></ProtectedRoute>}
          />
        </Route>
      </Routes>
      <AIAssistantWidget />
    </HelmetProvider>
  );
}

export default App;
