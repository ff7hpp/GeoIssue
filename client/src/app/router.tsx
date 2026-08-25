import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { IssueExplore } from '../features/issues/IssueExplore';
import { IssueDetail } from '../features/issues/IssueDetail';
import { ReportWizard } from '../features/reports/ReportWizard';
import { MyReports } from '../features/reports/MyReports';
import { AdminDashboard } from '../features/admin/AdminDashboard';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<IssueExplore />} />
      <Route path="/issues" element={<IssueExplore />} />
      <Route path="/issues/:id" element={<IssueDetail />} />
      <Route path="/reports/new" element={<ReportWizard />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/issues" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
