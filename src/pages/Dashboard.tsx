import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import AnnouncementPopup from '@/components/features/AnnouncementPopup';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Poll profile every 30s to pick up role changes made by president
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refreshProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AnnouncementPopup />
      <DashboardSidebar profile={profile} isMobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-card-light border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-xs text-muted-foreground">مرحباً، {(profile.username || '').split(' ')[0]}</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/'); toast.success('تم تسجيل الخروج'); }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-xl hover:bg-red-50">
            خروج
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
