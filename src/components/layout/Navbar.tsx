import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Menu, X, LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';
import { useLocation } from 'react-router-dom';
import NewsTicker from '@/components/features/NewsTicker';

const ROLE_LABELS: Record<string, string> = {
  president: 'رئيس الهيئة', vice_president: 'نائب الرئيس',
  office_head: 'رئيس مكتب', member: 'عضو الهيئة', student: 'طالب',
};

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
        .then(({ data }) => { if (data) setNotifications(data as Notification[]); });
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/news', label: 'الأخبار' },
    { href: '/events', label: 'الفعاليات' },
    { href: '/training', label: 'التدريب' },
    { href: '/ideas', label: 'صندوق الأفكار' },
    { href: '/complaint', label: 'تقديم شكوى' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (href: string) => location.pathname === href;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-dark shadow-lg' : 'bg-transparent'}`} style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
              alt="شعار الهيئة"
              className="h-10 w-auto drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">الهيئة الطلابية</p>
              <p className="text-green-300 text-xs">كلية الهندسة الزراعية · جامعة حمص</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.href) ? 'bg-white/20 text-white' : 'text-green-100 hover:text-white hover:bg-white/10'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="relative">
                  <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                    className="relative p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute left-0 mt-2 w-80 glass-dark rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-slide-up">
                      <div className="flex items-center justify-between p-3 border-b border-white/10">
                        <h3 className="text-white font-semibold text-sm">الإشعارات</h3>
                        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-green-400 hover:text-green-300">تحديد الكل كمقروء</button>}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-white/50 text-sm py-6">لا توجد إشعارات</p>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.is_read ? 'bg-white/10' : ''}`}>
                            <p className="text-white text-sm font-medium">{n.title}</p>
                            <p className="text-green-300 text-xs mt-1">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border-2 border-green-400">
                      {(profile?.username || profile?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-white text-sm font-medium">{(profile?.username || '').split(' ')[0]}</span>
                    <ChevronDown size={14} className="text-green-300" />
                  </button>
                  {profileOpen && (
                    <div className="absolute left-0 mt-2 w-56 glass-dark rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-slide-up">
                      <div className="p-4 border-b border-white/10">
                        <p className="text-white font-semibold text-sm">{profile?.username || profile?.email}</p>
                        <p className="text-green-300 text-xs mt-1">{ROLE_LABELS[profile?.role || 'student']}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                          <User size={16} />لوحة التحكم
                        </button>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-300 hover:bg-red-500/10 transition-colors text-sm">
                          <LogOut size={16} />تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-white text-green-800 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-green-50 transition-all hover:scale-105 shadow-lg">
                <LogIn size={16} /><span className="hidden sm:inline">دخول الهيئة</span>
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden glass-dark rounded-2xl mb-4 border border-white/20 overflow-hidden animate-slide-up">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 text-sm font-medium transition-colors border-b border-white/5 last:border-0 ${isActive(link.href) ? 'bg-white/15 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <NewsTicker />
    </nav>
  );
};

export default Navbar;
