import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PresidentSetup from '@/pages/PresidentSetup';
import ComplaintPage from '@/pages/ComplaintPage';
import IdeasPage from '@/pages/IdeasPage';
import EventsPage from '@/pages/EventsPage';
import NewsPage from '@/pages/NewsPage';
import TrainingPage from '@/pages/TrainingPage';
import NotFound from '@/pages/NotFound';

import Dashboard from '@/pages/Dashboard';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import ComplaintsPage from '@/pages/dashboard/ComplaintsPage';
import TasksPage from '@/pages/dashboard/TasksPage';
import IdeasDashboardPage from '@/pages/dashboard/IdeasDashboardPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import UsersPage from '@/pages/dashboard/UsersPage';
import ReportsPage from '@/pages/dashboard/ReportsPage';
import QRPage from '@/pages/dashboard/QRPage';
import EventsTrainingDashboardPage from '@/pages/dashboard/EventsTrainingDashboardPage';
import AnnouncementsManagePage from '@/pages/dashboard/AnnouncementsManagePage';
import FollowUpNotificationsPage from '@/pages/dashboard/FollowUpNotificationsPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center">
        <img src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
          className="h-16 mx-auto mb-4 animate-pulse" style={{ filter: 'brightness(0) invert(1)' }} />
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<PresidentSetup />} />
        <Route path="/complaint" element={<ComplaintPage />} />
        <Route path="/complaint/:qrCode" element={<ComplaintPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/training" element={<TrainingPage />} />

        {/* Protected Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="ideas" element={<IdeasDashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="qr" element={<QRPage />} />
          <Route path="events" element={<EventsTrainingDashboardPage type="events" />} />
          <Route path="training" element={<EventsTrainingDashboardPage type="training" />} />
          <Route path="news" element={<EventsTrainingDashboardPage type="news" />} />
          <Route path="announcements" element={<AnnouncementsManagePage />} />
          <Route path="followup-alerts" element={<FollowUpNotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
