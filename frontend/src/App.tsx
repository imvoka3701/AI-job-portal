import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployerLayout } from "@/components/layout/EmployerLayout";
import { AIAssistantWidget } from "@/components/ai-assistant/AIAssistantWidget";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

// Lazy load all top-level routes
const JobListPage = lazy(() => import("@/pages/jobs/JobListPage").then(m => ({ default: m.JobListPage })));
const JobDetailPage = lazy(() => import("@/pages/jobs/JobDetailPage").then(m => ({ default: m.JobDetailPage })));
const EmployerLandingPage = lazy(() => import("@/pages/employer/landing/EmployerLandingPage").then(m => ({ default: m.EmployerLandingPage })));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const GoogleCallback = lazy(() => import("@/pages/auth/GoogleCallback").then(m => ({ default: m.GoogleCallback })));

const CandidateDashboard = lazy(() => import("@/pages/candidate/CandidateDashboard").then(m => ({ default: m.CandidateDashboard })));
const AIMatchingPage = lazy(() => import("@/pages/ai/AIMatchingPage").then(m => ({ default: m.AIMatchingPage })));
const RoadmapPage = lazy(() => import("@/pages/ai/RoadmapPage").then(m => ({ default: m.RoadmapPage })));
const CVListPage = lazy(() => import("@/pages/candidate/cv/CVListPage").then(m => ({ default: m.CVListPage })));
const CVEditorPage = lazy(() => import("@/pages/candidate/cv/CVEditorPage").then(m => ({ default: m.CVEditorPage })));

const EmployerDashboard = lazy(() => import("@/pages/employer/EmployerDashboard").then(m => ({ default: m.EmployerDashboard })));
const EmployerCandidatesPage = lazy(() => import("@/pages/employer/EmployerCandidatesPage").then(m => ({ default: m.EmployerCandidatesPage })));
const InterviewsPage = lazy(() => import("@/pages/employer/InterviewsPage").then(m => ({ default: m.InterviewsPage })));
const EmployerJobsPage = lazy(() => import("@/pages/employer/jobs/EmployerJobsPage").then(m => ({ default: m.EmployerJobsPage })));
const NewJobPage = lazy(() => import("@/pages/employer/jobs/NewJobPage").then(m => ({ default: m.NewJobPage })));
const EmployerTeamPage = lazy(() => import("@/pages/employer/EmployerTeamPage").then(m => ({ default: m.EmployerTeamPage })));
const RecruitmentRequestsPage = lazy(() => import("@/pages/employer/RecruitmentRequestsPage").then(m => ({ default: m.RecruitmentRequestsPage })));
const EmployerInvitationAcceptPage = lazy(() => import("@/pages/employer/EmployerInvitationAcceptPage").then(m => ({ default: m.EmployerInvitationAcceptPage })));
const EmployerSettingsPage = lazy(() => import("@/pages/employer/EmployerSettingsPage").then(m => ({ default: m.EmployerSettingsPage })));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminCompanies = lazy(() => import("@/pages/admin/AdminCompanies").then(m => ({ default: m.AdminCompanies })));
const AdminJobs = lazy(() => import("@/pages/admin/AdminJobs").then(m => ({ default: m.AdminJobs })));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminInterviewsPage = lazy(() => import("@/pages/admin/AdminInterviewsPage").then(m => ({ default: m.AdminInterviewsPage })));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs").then(m => ({ default: m.AdminAuditLogs })));
const AIPromptsPage = lazy(() => import("@/pages/admin/AIPromptsPage").then(m => ({ default: m.AIPromptsPage })));
const AdminAILogsPage = lazy(() => import("@/pages/admin/AdminAILogsPage").then(m => ({ default: m.AdminAILogsPage })));

const ToolsLandingPage = lazy(() => import("@/pages/tools/ToolsLandingPage").then(m => ({ default: m.ToolsLandingPage })));
const AssessmentPage = lazy(() => import("@/pages/tools/AssessmentPage").then(m => ({ default: m.AssessmentPage })));
const AssessmentHistoryPage = lazy(() => import("@/pages/tools/AssessmentHistoryPage").then(m => ({ default: m.AssessmentHistoryPage })));

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
    <ErrorBoundary>
      <HelmetProvider>
        <Suspense fallback={<PageSkeleton />}>
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

            {/* Public AI Hubs */}
            <Route path="/ai/match" element={<AIMatchingPage />} />
            <Route path="/ai/matching" element={<AIMatchingPage />} />
            <Route path="/ai/roadmap" element={<RoadmapPage />} />
            <Route path="/ai" element={<Navigate to="/ai/matching" replace />} />

            {/* Dashboard Routes with Layout */}
            <Route element={<DashboardLayout />}>
              {/* Candidate Dashboard */}
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute allowedRoles={["candidate"]}><CandidateDashboard /></ProtectedRoute>} 
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
              <Route
                path="/admin/ai/prompts"
                element={<ProtectedRoute allowedRoles={["admin"]}><AIPromptsPage /></ProtectedRoute>}
              />
              <Route
                path="/admin/ai/logs"
                element={<ProtectedRoute allowedRoles={["admin"]}><AdminAILogsPage /></ProtectedRoute>}
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
              <Route path="/employer/settings" element={<ProtectedRoute allowedRoles={["employer"]}><EmployerSettingsPage /></ProtectedRoute>} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <AIAssistantWidget />
        <Toaster richColors position="top-right" />
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
