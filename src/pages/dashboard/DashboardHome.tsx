import { useState, useEffect } from 'react';
import {
  FileText, CheckSquare, Lightbulb, Users, Calendar, TrendingUp,
  Bell, ArrowLeft, Activity, Zap, Award, Clock, Target, Megaphone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Stats {
  complaints: { total: number; new: number; processing: number; solved: number };
  tasks: { total: number; completed: number; late: number; inProgress: number };
  ideas: { total: number; implementing: number; topVotes: number };
  users: { total: number; active: number };
  events: number;
  notifications: number;
}

const ROLE_LABELS: Record<string, string> = {
  president: 'رئيس الهيئة الطلابية',
  vice_president: 'نائب رئيس الهيئة',
  office_head: 'رئيس المكتب',
  member: 'عضو الهيئة الطلابية',
  student: 'طالب',
};

const OFFICE_LABEL: Record<string, string> = {
  organization: 'مكتب التنظيم',
  followup: 'مكتب المتابعة',
  media: 'مكتب الإعلام',
  events: 'مكتب الفعاليات',
  training: 'مكتب التدريب',
  academic: 'الشؤون الأكاديمية',
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'status-new' },
  processing: { label: 'قيد المعالجة', cls: 'status-processing' },
  solved: { label: 'محلولة', cls: 'status-solved' },
  closed: { label: 'مغلقة', cls: 'status-closed' },
  transferred: { label: 'محولة', cls: 'status-pending' },
  in_progress: { label: 'قيد التنفيذ', cls: 'status-processing' },
  completed: { label: 'مكتملة', cls: 'status-solved' },
  late: { label: 'متأخرة', cls: 'bg-red-100 text-red-700' },
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#94a3b8'];

const DashboardHome = () => {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    complaints: { total: 0, new: 0, processing: 0, solved: 0 },
    tasks: { total: 0, completed: 0, late: 0, inProgress: 0 },
    ideas: { total: 0, implementing: 0, topVotes: 0 },
    users: { total: 0, active: 0 },
    events: 0,
    notifications: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isStudent = profile?.role === 'student';

  useEffect(() => {
    const fetchAll = async () => {
      const promises: Promise<any>[] = [
        supabase.from('complaints').select('status'),
        supabase.from('tasks').select('status'),
        supabase.from('ideas').select('status,votes_count'),
        supabase.from('user_profiles').select('is_active'),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('*').order('published_at', { ascending: false }).limit(3),
        supabase.from('complaints').select('id,title,status,created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('id,title,status,priority,due_date').order('created_at', { ascending: false }).limit(5),
      ];
      if (user) {
        promises.push(supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false));
      }

      const [c, t, i, u, ev, ann, rc, rt, notif] = await Promise.all(promises);

      const complaints = c.data || [];
      const tasks = t.data || [];
      const ideas = i.data || [];
      const users = u.data || [];

      setStats({
        complaints: {
          total: complaints.length,
          new: complaints.filter((x: any) => x.status === 'new').length,
          processing: complaints.filter((x: any) => x.status === 'processing').length,
          solved: complaints.filter((x: any) => x.status === 'solved').length,
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter((x: any) => x.status === 'completed').length,
          late: tasks.filter((x: any) => x.status === 'late').length,
          inProgress: tasks.filter((x: any) => x.status === 'in_progress').length,
        },
        ideas: {
          total: ideas.length,
          implementing: ideas.filter((x: any) => x.status === 'implementing').length,
          topVotes: ideas.reduce((max: number, x: any) => Math.max(max, x.votes_count || 0), 0),
        },
        users: { total: users.length, active: users.filter((x: any) => x.is_active).length },
        events: ev.count || 0,
        notifications: notif?.count || 0,
      });

      setRecentAnnouncements(ann.data || []);
      setRecentComplaints(rc.data || []);
      setRecentTasks(rt.data || []);

      // Build activity chart (last 7 days)
      const days: any[] = [];
      for (let d = 6; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dayStr = date.toLocaleDateString('ar-SY', { weekday: 'short' });
        const dateISO = date.toISOString().split('T')[0];
        const dayComplaints = complaints.filter((x: any) => x.created_at?.startsWith(dateISO)).length;
        days.push({ day: dayStr, شكاوى: dayComplaints, نشاط: Math.max(dayComplaints, 1) });
      }
      setActivityData(days);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'ليلة طيبة' : hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : hour < 21 ? 'مساء النور' : 'ليلة طيبة';

  const pieData = [
    { name: 'جديدة', value: stats.complaints.new },
    { name: 'معالجة', value: stats.complaints.processing },
    { name: 'محلولة', value: stats.complaints.solved },
    { name: 'أخرى', value: Math.max(0, stats.complaints.total - stats.complaints.new - stats.complaints.processing - stats.complaints.solved) },
  ].filter(d => d.value > 0);

  // Student-specific view
  if (isStudent) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Student Welcome */}
        <div className="relative rounded-3xl overflow-hidden p-8"
          style={{ background: 'linear-gradient(135deg, #0f3d20 0%, #1a5530 40%, #236b40 100%)' }}>
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-400/5 rounded-full -translate-x-10 translate-y-10" />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {greeting}
              </p>
              <h1 className="text-3xl font-black text-white mb-1">{profile?.username || profile?.email}</h1>
              <p className="text-green-200/70 text-sm">طالب — كلية الهندسة الزراعية</p>
            </div>
            <div className="hidden sm:flex w-20 h-20 bg-white/10 rounded-2xl items-center justify-center border border-white/20 text-4xl">
              🎓
            </div>
          </div>
        </div>

        {/* Student Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/complaint', icon: FileText, label: 'تقديم شكوى', color: 'bg-red-50 text-red-600 border-red-100', emoji: '📋' },
            { href: '/dashboard/ideas', icon: Lightbulb, label: 'الأفكار', color: 'bg-amber-50 text-amber-600 border-amber-100', emoji: '💡' },
            { href: '/events', icon: Calendar, label: 'الفعاليات', color: 'bg-blue-50 text-blue-600 border-blue-100', emoji: '📅' },
            { href: '/training', icon: Award, label: 'التدريب', color: 'bg-purple-50 text-purple-600 border-purple-100', emoji: '🎯' },
          ].map(action => (
            <Link key={action.href} to={action.href}
              className={`${action.color} border rounded-2xl p-5 text-center hover:shadow-md transition-all hover:-translate-y-0.5 group`}>
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{action.emoji}</div>
              <p className="font-bold text-sm">{action.label}</p>
            </Link>
          ))}
        </div>

        {/* Announcements for student */}
        {recentAnnouncements.length > 0 && (
          <div className="glass-card-light rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Megaphone size={16} className="text-primary" />آخر الإعلانات
              </h2>
              <Link to="/news" className="text-xs text-primary hover:underline">عرض الكل</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentAnnouncements.map(ann => (
                <div key={ann.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ann.type === 'news' ? '📰' : ann.type === 'announcement' ? '📢' : '🔔'}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ── */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #0f3d20 0%, #1a5530 40%, #236b40 70%, #1e7a48 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-400/5 rounded-full -translate-x-12 translate-y-12" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-green-300 text-sm mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {greeting}،
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
              {profile?.username || profile?.email}
            </h1>
            <p className="text-green-200/70 text-sm">
              {ROLE_LABELS[profile?.role || 'student']}
              {profile?.office && ` — ${OFFICE_LABEL[profile.office] || profile.office}`}
            </p>
            <p className="text-green-300/50 text-xs mt-2 flex items-center gap-1.5">
              <Clock size={11} />
              {new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            {stats.notifications > 0 && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black text-white">{stats.notifications}</p>
                <p className="text-red-300 text-xs">إشعار جديد</p>
              </div>
            )}
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center hidden sm:block">
              <p className="text-2xl font-black text-white">{stats.complaints.new}</p>
              <p className="text-green-300 text-xs">شكوى جديدة</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center hidden sm:block">
              <p className="text-2xl font-black text-white">{stats.tasks.inProgress}</p>
              <p className="text-green-300 text-xs">مهمة نشطة</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Complaints */}
          <Link to="/dashboard/complaints"
            className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-all duration-500" />
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                <FileText size={20} className="text-blue-600" />
              </div>
              {stats.complaints.new > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{stats.complaints.new}</span>
              )}
            </div>
            <p className="text-3xl font-black text-blue-900">{stats.complaints.total}</p>
            <p className="text-sm text-blue-600 font-medium mt-0.5">الشكاوى</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: stats.complaints.total > 0 ? `${(stats.complaints.solved / stats.complaints.total) * 100}%` : '0%' }} />
              </div>
              <span className="text-xs text-blue-500 font-medium shrink-0">{stats.complaints.solved} محلولة</span>
            </div>
          </Link>

          {/* Tasks */}
          <Link to="/dashboard/tasks"
            className="group relative bg-gradient-to-br from-green-50 to-emerald-100/50 border border-green-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-all duration-500" />
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                <CheckSquare size={20} className="text-green-600" />
              </div>
              {stats.tasks.late > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.tasks.late} متأخرة</span>
              )}
            </div>
            <p className="text-3xl font-black text-green-900">{stats.tasks.total}</p>
            <p className="text-sm text-green-600 font-medium mt-0.5">المهام</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: stats.tasks.total > 0 ? `${(stats.tasks.completed / stats.tasks.total) * 100}%` : '0%' }} />
              </div>
              <span className="text-xs text-green-500 font-medium shrink-0">{stats.tasks.completed} مكتملة</span>
            </div>
          </Link>

          {/* Ideas */}
          <Link to="/dashboard/ideas"
            className="group relative bg-gradient-to-br from-amber-50 to-yellow-100/50 border border-amber-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-all duration-500" />
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
                <Lightbulb size={20} className="text-amber-600" />
              </div>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                🔥 {stats.ideas.topVotes} تصويت
              </span>
            </div>
            <p className="text-3xl font-black text-amber-900">{stats.ideas.total}</p>
            <p className="text-sm text-amber-600 font-medium mt-0.5">الأفكار</p>
            <p className="text-xs text-amber-500 mt-2">{stats.ideas.implementing} قيد التنفيذ</p>
          </Link>

          {/* Users */}
          <Link to="/dashboard/users"
            className="group relative bg-gradient-to-br from-purple-50 to-violet-100/50 border border-purple-200/60 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-150 transition-all duration-500" />
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200">
                <Users size={20} className="text-purple-600" />
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                {stats.users.active} نشط
              </span>
            </div>
            <p className="text-3xl font-black text-purple-900">{stats.users.total}</p>
            <p className="text-sm text-purple-600 font-medium mt-0.5">المستخدمون</p>
            <p className="text-xs text-purple-500 mt-2">⚡ {stats.events} فعالية</p>
          </Link>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card-light rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-primary" />نشاط آخر 7 أيام
            </h2>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full">الشكاوى الواردة</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a6b3a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1a6b3a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'Tajawal' }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="شكاوى" stroke="#1a6b3a" strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ fill: '#1a6b3a', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints Pie */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
            <Target size={16} className="text-primary" />توزيع الشكاوى
          </h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                    dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <FileText size={32} className="opacity-20 mb-2" />
              <p className="text-sm">لا توجد شكاوى بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="glass-card-light rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <FileText size={15} className="text-blue-500" />آخر الشكاوى
            </h2>
            <Link to="/dashboard/complaints" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              الكل <ArrowLeft size={11} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentComplaints.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">لا توجد شكاوى</p>
            ) : recentComplaints.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors">
                <p className="text-sm text-foreground font-medium truncate flex-1">{c.title}</p>
                <span className={`status-badge text-[10px] mr-2 shrink-0 ${STATUS_LABELS[c.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[c.status]?.label || c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-card-light rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <CheckSquare size={15} className="text-green-500" />آخر المهام
            </h2>
            <Link to="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              الكل <ArrowLeft size={11} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">لا توجد مهام</p>
            ) : recentTasks.map(t => {
              const PRIORITY_COLORS: Record<string, string> = { urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' };
              return (
                <div key={t.id} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50/80 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority] || 'bg-gray-400'}`} />
                  <p className="text-sm text-foreground font-medium truncate flex-1">{t.title}</p>
                  <span className={`status-badge text-[10px] shrink-0 ${STATUS_LABELS[t.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[t.status]?.label || t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="glass-card-light rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <Megaphone size={15} className="text-amber-500" />آخر الإعلانات
            </h2>
            <Link to="/dashboard/announcements" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              الكل <ArrowLeft size={11} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAnnouncements.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">لا توجد إعلانات</p>
            ) : recentAnnouncements.map(ann => (
              <div key={ann.id} className="px-4 py-3 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0 mt-0.5">
                    {ann.type === 'news' ? '📰' : ann.type === 'announcement' ? '📢' : ann.type === 'alert' ? '🔔' : '📅'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{ann.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ann.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/chat', icon: '💬', label: 'فتح المحادثات', desc: 'تواصل مع فريقك', color: 'from-green-500 to-emerald-600' },
          { href: '/dashboard/tasks', icon: '✅', label: 'المهام المعلّقة', desc: `${stats.tasks.total - stats.tasks.completed} مهمة`, color: 'from-blue-500 to-blue-600' },
          { href: '/dashboard/complaints', icon: '📋', label: 'الشكاوى الجديدة', desc: `${stats.complaints.new} شكوى تنتظر`, color: 'from-orange-500 to-orange-600' },
          { href: '/dashboard/reports', icon: '📊', label: 'التقارير', desc: 'إحصائيات شاملة', color: 'from-purple-500 to-purple-600' },
        ].map(action => (
          <Link key={action.href} to={action.href}
            className={`group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${action.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}>
            <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">{action.label}</p>
              <p className="text-white/70 text-xs">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;
