import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/common/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetPage from './pages/PasswordResetPage';
import ProfilePage from './pages/ProfilePage';
import TeamsPage from './pages/TeamsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import KanbanPage from './pages/KanbanPage';
import PersonalCalendarPage from './pages/PersonalCalendarPage';
import SharedCalendarPage from './pages/SharedCalendarPage';
import MeetingsPage from './pages/MeetingsPage';
import NotificationsPage from './pages/NotificationsPage';
import DiscussionBoardPage from './pages/DiscussionBoardPage';
import ReportsPage from './pages/ReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />

      {/* Protected Workspace Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailsPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/personal-calendar" element={<PersonalCalendarPage />} />
        <Route path="/shared-calendar" element={<SharedCalendarPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/discussions" element={<DiscussionBoardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
