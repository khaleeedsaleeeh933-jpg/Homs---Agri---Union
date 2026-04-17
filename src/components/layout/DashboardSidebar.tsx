import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CheckSquare, Lightbulb, Calendar, Newspaper,
  Users, MessageSquare, BarChart2, GraduationCap, QrCode, X, Bell, Megaphone, User
} from 'lucide-react';
import type { UserProfile } from '@/types/database';
import dashBg from '@/assets/dash-bg.jpg';

const ROLE_LABELS: Record<string, string> = {
  president: 'رئيس الهيئة', vice_president: 'نائب الرئيس',
  office_head: 'رئيس مكتب', member: 'عضو الهيئة', student: 'طالب',
};

interface SidebarProps {
  profile: UserProfile;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const DashboardSidebar = ({ profile, isMobileOpen, onClose }: SidebarProps) => {
  const location = useLocation();

  const navItems: { href: string; icon: React.ElementType; label: string; roles: string[]; officeOnly?: string; badge?: string }[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية', roles: ['all'] },
    { href: '/dashboard/complaints', icon: FileText, label: 'الشكاوى', roles: ['president', 'vice_president', 'office_head', 'member'] },
    { href: '/dashboard/tasks', icon: CheckSquare, label: 'المهام', roles: ['president', 'vice_president', 'office_head', 'member'] },
    { href: '/dashboard/ideas', icon: Lightbulb, label: 'صندوق الأفكار', roles: ['all'] },
    { href: '/dashboard/events', icon: Calendar, label: 'الفعاليات', roles: ['president', 'vice_president', 'office_head'] },
    { href: '/dashboard/training', icon: GraduationCap, label: 'التدريب', roles: ['president', 'vice_president', 'office_head'] },
    { href: '/dashboard/announcements', icon: Megaphone, label: 'الإعلانات', roles: ['president', 'vice_president', 'office_head'] },
    { href: '/dashboard/followup-alerts', icon: Bell, label: 'تنبيهات المتابعة', roles: ['president', 'vice_president', 'office_head', 'member'], officeOnly: 'followup' },
    { href: '/dashboard/chat', icon: MessageSquare, label: 'المحادثات', roles: ['president', 'vice_president', 'office_head', 'member'] },
    { href: '/dashboard/users', icon: Users, label: 'إدارة المستخدمين', roles: ['president', 'vice_president'] },
    { href: '/dashboard/reports', icon: BarChart2, label: 'التقارير', roles: ['president', 'vice_president', 'office_head'] },
    { href: '/dashboard/qr', icon: QrCode, label: 'رموز QR', roles: ['president', 'vice_president'] },
    { href: '/dashboard/profile', icon: User, label: 'ملفي الشخصي', roles: ['all'] },
  ];

  const visibleItems = navItems.filter(item => {
    if (item.roles.includes('all')) return true;
    if (!item.roles.includes(profile.role)) return false;
    // followup-alerts: show to all eligible roles, but members only if in followup office
    if (item.officeOnly === 'followup' && profile.role === 'member') {
      return profile.office === 'followup';
    }
    return true;
  });

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 right-0 h-full w-64 z-50 lg:relative lg:z-auto transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, rgba(10,35,18,0.98) 0%, rgba(22,65,40,0.98) 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${dashBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative h-full flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
                alt="Logo" className="h-10 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <div>
                <p className="text-white font-bold text-sm">الهيئة الطلابية</p>
                <p className="text-green-400 text-xs">كلية الهندسة الزراعية</p>
              </div>
            </div>
            {onClose && <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white"><X size={18} /></button>}
          </div>

          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg border-2 border-green-400">
                {(profile.username || profile.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{profile.username || profile.email}</p>
                <p className="text-green-300 text-xs">{ROLE_LABELS[profile.role]}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {visibleItems.map(item => (
              <Link key={item.href} to={item.href} onClick={onClose}
                className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}>
                <item.icon size={17} className={isActive(item.href) ? 'text-green-300' : 'text-white/50'} />
                <span className="text-sm flex-1">{item.label}</span>
                {item.badge && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <Link to="/" className="block text-center text-xs text-green-400 hover:text-green-300 transition-colors">
              ← العودة للموقع
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
