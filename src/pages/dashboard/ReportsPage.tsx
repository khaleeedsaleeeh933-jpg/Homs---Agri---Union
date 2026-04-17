import { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, FileText, CheckSquare, Lightbulb, Users,
  Download, Calendar, Award, Target, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const GREEN_PALETTE = ['#1a6b3a', '#2d9b5a', '#4db87a', '#7ed4a0', '#b3e6c8', '#dcf5e7'];
const BLUE_PALETTE  = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
const MIXED_PALETTE = ['#1a6b3a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 10, fontFamily: 'Tajawal', fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ReportsPage = () => {
  const [stats, setStats] = useState({ complaints: [] as any[], tasks: [] as any[], ideas: [] as any[], users: [] as any[], events: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const fetch = async () => {
      const [c, t, i, u, ev] = await Promise.all([
        supabase.from('complaints').select('status,type,created_at'),
        supabase.from('tasks').select('status,priority,office,created_at,completion_rate'),
        supabase.from('ideas').select('status,category,votes_count,created_at'),
        supabase.from('user_profiles').select('role,is_active,join_date'),
        supabase.from('events').select('status,registered_count,capacity,created_at'),
      ]);
      setStats({
        complaints: c.data || [],
        tasks: t.data || [],
        ideas: i.data || [],
        users: u.data || [],
        events: ev.data || [],
      });
      setLoading(false);
    };
    fetch();
  }, []);

  // Data computations
  const complaintsByStatus = [
    { name: 'جديدة',      value: stats.complaints.filter(c => c.status === 'new').length,        fill: '#3b82f6' },
    { name: 'معالجة',     value: stats.complaints.filter(c => c.status === 'processing').length,  fill: '#f59e0b' },
    { name: 'محلولة',     value: stats.complaints.filter(c => c.status === 'solved').length,      fill: '#22c55e' },
    { name: 'مغلقة',      value: stats.complaints.filter(c => c.status === 'closed').length,      fill: '#94a3b8' },
  ].filter(d => d.value > 0);

  const OFFICE_MAP: Record<string, string> = { organization: 'التنظيم', followup: 'المتابعة', media: 'الإعلام', events: 'الفعاليات', training: 'التدريب', academic: 'الأكاديمي' };
  const tasksByOffice = Object.entries(OFFICE_MAP).map(([key, name]) => ({
    name,
    'الكل': stats.tasks.filter(t => t.office === key).length,
    'مكتملة': stats.tasks.filter(t => t.office === key && t.status === 'completed').length,
    'قيد التنفيذ': stats.tasks.filter(t => t.office === key && t.status === 'in_progress').length,
  }));

  const CAT_MAP: Record<string, string> = { technical: 'تقنية', organizational: 'تنظيمية', events: 'فعاليات', training: 'تدريب', general: 'عامة' };
  const ideasByCategory = Object.entries(CAT_MAP).map(([key, name]) => ({
    name,
    عدد: stats.ideas.filter(i => i.category === key).length,
    تصويت: stats.ideas.filter(i => i.category === key).reduce((s, i) => s + (i.votes_count || 0), 0),
  })).filter(d => d.عدد > 0);

  const usersByRole = [
    { name: 'رئيس', value: stats.users.filter(u => u.role === 'president').length },
    { name: 'نائب', value: stats.users.filter(u => u.role === 'vice_president').length },
    { name: 'رئيس مكتب', value: stats.users.filter(u => u.role === 'office_head').length },
    { name: 'عضو', value: stats.users.filter(u => u.role === 'member').length },
    { name: 'طالب', value: stats.users.filter(u => u.role === 'student').length },
  ].filter(d => d.value > 0);

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleDateString('ar-SY', { month: 'short' });
    const prefix = d.toISOString().substring(0, 7);
    return {
      month,
      شكاوى: stats.complaints.filter(c => c.created_at?.startsWith(prefix)).length,
      أفكار: stats.ideas.filter(x => x.created_at?.startsWith(prefix)).length,
      مهام: stats.tasks.filter(x => x.created_at?.startsWith(prefix)).length,
    };
  });

  // Performance radar
  const totalT = Math.max(stats.tasks.length, 1);
  const radarData = [
    { subject: 'إنجاز المهام',  A: Math.round((stats.tasks.filter(t => t.status === 'completed').length / totalT) * 100) },
    { subject: 'حل الشكاوى',   A: Math.round((stats.complaints.filter(c => c.status === 'solved').length / Math.max(stats.complaints.length, 1)) * 100) },
    { subject: 'تفاعل الأفكار', A: Math.min(100, Math.round((stats.ideas.reduce((s, i) => s + (i.votes_count || 0), 0) / Math.max(stats.ideas.length, 1)) * 10)) },
    { subject: 'الفعاليات',     A: Math.min(100, stats.events.length * 20) },
    { subject: 'المستخدمون',   A: Math.min(100, stats.users.filter(u => u.is_active).length * 5) },
  ];

  const kpis = [
    { label: 'إجمالي الشكاوى',    value: stats.complaints.length,     sub: `${stats.complaints.filter(c => c.status === 'solved').length} محلولة`, icon: FileText,   color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', tc: 'text-blue-700' },
    { label: 'إجمالي المهام',     value: stats.tasks.length,          sub: `${stats.tasks.filter(t => t.status === 'completed').length} مكتملة`,   icon: CheckSquare, color: 'from-green-500 to-green-700', bg: 'bg-green-50', tc: 'text-green-700' },
    { label: 'الأفكار المقترحة',  value: stats.ideas.length,          sub: `${stats.ideas.reduce((s, i) => s + (i.votes_count || 0), 0)} تصويت`, icon: Lightbulb,   color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', tc: 'text-amber-700' },
    { label: 'المستخدمون النشطون', value: stats.users.filter(u => u.is_active).length, sub: `من ${stats.users.length} إجمالي`,       icon: Users,       color: 'from-purple-500 to-purple-700', bg: 'bg-purple-50', tc: 'text-purple-700' },
    { label: 'الفعاليات',         value: stats.events.length,         sub: `${stats.events.filter(e => e.status === 'upcoming').length} قادمة`,    icon: Calendar,    color: 'from-teal-500 to-teal-700', bg: 'bg-teal-50', tc: 'text-teal-700' },
    { label: 'الأفكار قيد التنفيذ', value: stats.ideas.filter(i => i.status === 'implementing').length, sub: 'فكرة تُنفَّذ الآن', icon: TrendingUp, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', tc: 'text-rose-700' },
  ];

  if (loading) return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-10 bg-gray-100 rounded-2xl w-64 animate-pulse" />
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BarChart2 size={24} className="text-primary" />التقارير والإحصائيات
          </h1>
          <p className="text-muted-foreground text-sm">نظرة شاملة على أداء الهيئة الطلابية</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-xl">
          <Zap size={12} />
          بيانات محدّثة لحظياً
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={`${kpi.bg} rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5`}>
            <div className={`w-9 h-9 bg-gradient-to-br ${kpi.color} rounded-xl flex items-center justify-center mb-2`}>
              <kpi.icon size={16} className="text-white" />
            </div>
            <p className={`text-2xl font-black ${kpi.tc}`}>{kpi.value}</p>
            <p className="text-xs text-foreground font-medium mt-0.5 leading-tight">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />الاتجاه الشهري
          </h3>
          <span className="text-xs text-muted-foreground bg-gray-100 px-2.5 py-1 rounded-full">آخر 6 أشهر</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {[['شكاوى', '#3b82f6'], ['أفكار', '#f59e0b'], ['مهام', '#1a6b3a']].map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} />
            <Area type="monotone" dataKey="شكاوى" stroke="#3b82f6" strokeWidth={2.5} fill="url(#grad-شكاوى)" dot={{ r: 3, fill: '#3b82f6' }} />
            <Area type="monotone" dataKey="أفكار"  stroke="#f59e0b" strokeWidth={2.5} fill="url(#grad-أفكار)"  dot={{ r: 3, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="مهام"   stroke="#1a6b3a" strokeWidth={2.5} fill="url(#grad-مهام)"   dot={{ r: 3, fill: '#1a6b3a' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Pie + Radar */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complaints Distribution */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Target size={15} className="text-primary" />توزيع الشكاوى حسب الحالة
          </h3>
          {complaintsByStatus.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={complaintsByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                    dataKey="value" labelLine={false} label={renderCustomLabel} stroke="none">
                    {complaintsByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {complaintsByStatus.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">المجموع</span>
                  <span className="font-black text-foreground">{stats.complaints.length}</span>
                </div>
              </div>
            </div>
          ) : <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">لا توجد شكاوى بعد</div>}
        </div>

        {/* Performance Radar */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Award size={15} className="text-primary" />مؤشرات الأداء العام
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontFamily: 'Tajawal', fill: '#6b7280' }} />
              <Radar name="الأداء" dataKey="A" stroke="#1a6b3a" fill="#1a6b3a" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'الأداء']} contentStyle={{ fontFamily: 'Tajawal', fontSize: 11, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Tasks by Office */}
      <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <CheckSquare size={15} className="text-primary" />المهام حسب المكتب
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tasksByOffice} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 12, borderRadius: 10, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 11 }} />
            <Bar dataKey="الكل"       fill="#94a3b8" radius={[4,4,0,0]} />
            <Bar dataKey="قيد التنفيذ" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="مكتملة"     fill="#1a6b3a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4: Ideas + Users */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ideas by category */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb size={15} className="text-primary" />الأفكار حسب الفئة
          </h3>
          {ideasByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ideasByCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 11 }} />
                <Bar dataKey="عدد"    fill="#1a6b3a" radius={[4,4,0,0]} />
                <Bar dataKey="تصويت" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">لا توجد أفكار بعد</div>}
        </div>

        {/* Users by role */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Users size={15} className="text-primary" />توزيع المستخدمين حسب الدور
          </h3>
          {usersByRole.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={usersByRole} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                    labelLine={false} label={renderCustomLabel} stroke="none">
                    {usersByRole.map((_, i) => <Cell key={i} fill={MIXED_PALETTE[i % MIXED_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Tajawal', fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {usersByRole.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: MIXED_PALETTE[i % MIXED_PALETTE.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
