import { Routes, Route, Navigate } from "react-router-dom";
import { IssueExplore } from "../features/issues/IssueExplore";
import { IssueDetail } from "../features/issues/IssueDetail";
import { ReportWizard } from "../features/reports/ReportWizard";
import { MyReports } from "../features/reports/MyReports";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { useAuth } from "../services/auth.context";
import { LoadingState } from "../components/common/LoadingState";
const AdminRoute = ({ children }) => {
  const { role, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
const AppRouter = () => {
  return <Routes>
      <Route path="/" element={<IssueExplore />} />
      <Route path="/issues" element={<IssueExplore />} />
      <Route path="/issues/:id" element={<IssueDetail />} />
      <Route path="/reports/new" element={<ReportWizard />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/issues" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
};
export {
  AppRouter
};
