import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Shield, Building2, Calendar, Save, Edit2,
  Camera, CheckCircle, Star, MessageSquare, Lightbulb, FileText, Award
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  president:      { label: 'رئيس الهيئة',      color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   emoji: '👑' },
  vice_president: { label: 'نائب الرئيس',       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     emoji: '⭐' },
  office_head:    { label: 'رئيس مكتب',         color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', emoji: '🏆' },
  member:         { label: 'عضو الهيئة',        color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   emoji: '✅' },
  student:        { label: 'طالب',              color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200',     emoji: '🎓' },
};

const OFFICE_LABELS: Record<string, string> = {
  organization: 'مكتب التنظيم',
  followup: 'مكتب المتابعة',
  media: 'مكتب الإعلام',
  events: 'مكتب الفعاليات',
  training: 'مكتب التدريب',
  academic: 'الشؤون الأكاديمية',
};

const AVATAR_COLORS = [
  'from-green-500 to-emerald-600',
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-teal-500 to-cyan-600',
];

const ProfilePage = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [stats, setStats] = useState({ ideas: 0, complaints: 0, tasks: 0 });
  const [avatarColor] = useState(() => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  useEffect(() => {
    if (profile) {
      setForm({ username: profile.username || '', phone: profile.phone || '' });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('submitter_id', user.id),
      supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('submitter_id', user.id),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', user.id),
    ]).then(([i, c, t]) => {
      setStats({ ideas: i.count || 0, complaints: c.count || 0, tasks: t.count || 0 });
    });
  }, [user]);

  const handleSave = async () => {
    if (!form.username.trim()) { toast.error('الاسم مطلوب'); return; }
    setSaving(true);
    const { error } = await supabase.from('user_profiles').update({
      username: form.username.trim(),
      phone: form.phone.trim() || null,
    }).eq('id', user!.id);

    if (error) {
      toast.error('فشل حفظ التغييرات');
    } else {
      await supabase.auth.updateUser({ data: { username: form.username.trim() } });
      await refreshProfile();
      setEditing(false);
      toast.success('تم تحديث الملف الشخصي ✅');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!pwForm.next || pwForm.next.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) toast.error('فشل تغيير كلمة المرور: ' + error.message);
    else { toast.success('تم تغيير كلمة المرور ✅'); setPwForm({ current: '', next: '', confirm: '' }); }
    setChangingPw(false);
  };

  if (!profile) return null;

  const roleCfg = ROLE_LABELS[profile.role] || ROLE_LABELS.student;
  const initials = (profile.username || profile.email).charAt(0).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* ── Profile Header ── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f3d20 0%, #1a5530 40%, #236b40 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16" />

        <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/20`}>
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-400 rounded-lg flex items-center justify-center text-sm shadow-lg">
              {roleCfg.emoji}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-right">
            <h1 className="text-2xl font-black text-white mb-1">{profile.username || profile.email}</h1>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-2 ${roleCfg.bg} ${roleCfg.color}`}>
              {roleCfg.emoji} {roleCfg.label}
              {profile.office && ` — ${OFFICE_LABELS[profile.office] || profile.office}`}
            </div>
            <p className="text-green-300/60 text-sm">{profile.email}</p>
            <p className="text-green-300/40 text-xs mt-1">
              عضو منذ {new Date(profile.join_date).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Edit button */}
          <button onClick={() => setEditing(!editing)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${editing ? 'bg-white/20 text-white border border-white/30' : 'bg-white text-green-800 hover:bg-green-50 shadow-lg'}`}>
            <Edit2 size={15} />
            {editing ? 'إلغاء' : 'تعديل الملف'}
          </button>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
          {[
            { icon: Lightbulb, label: 'أفكار مقترحة', value: stats.ideas },
            { icon: FileText, label: 'شكاوى مقدمة', value: stats.complaints },
            { icon: CheckCircle, label: 'مهام مسندة', value: stats.tasks },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-4 px-3">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-green-300/60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div className="glass-card-light rounded-2xl border border-gray-100 p-6 animate-slide-up">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-5">
            <Edit2 size={16} className="text-primary" />تعديل المعلومات الشخصية
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <User size={12} className="text-primary" />الاسم الكامل *
              </label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="اسمك الكامل"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <Phone size={12} className="text-primary" />رقم الهاتف
              </label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+963 9XX XXX XXX"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} />حفظ التغييرات</>}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-6 py-2.5 bg-gray-100 text-foreground rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ── Account Info ── */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Info Card */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-5">
            <Shield size={16} className="text-primary" />معلومات الحساب
          </h2>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'البريد الإلكتروني', value: profile.email },
              { icon: Phone, label: 'الهاتف', value: profile.phone || 'غير محدد' },
              { icon: Shield, label: 'الصلاحية', value: roleCfg.label },
              { icon: Building2, label: 'المكتب', value: profile.office ? (OFFICE_LABELS[profile.office] || profile.office) : 'غير محدد' },
              { icon: Calendar, label: 'تاريخ الانضمام', value: new Date(profile.join_date).toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card-light rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-foreground flex items-center gap-2 mb-5">
            <Star size={16} className="text-primary" />تغيير كلمة المرور
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">كلمة المرور الجديدة</label>
              <input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                placeholder="6 أحرف على الأقل"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">تأكيد كلمة المرور</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="أعد كتابة كلمة المرور"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
            </div>
            {pwForm.next && pwForm.confirm && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${pwForm.next === pwForm.confirm ? 'text-green-600' : 'text-red-500'}`}>
                <CheckCircle size={12} />
                {pwForm.next === pwForm.confirm ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتين'}
              </div>
            )}
          </div>

          {/* Password strength */}
          {pwForm.next && (
            <div className="mt-3">
              <div className="flex gap-1">
                {[1,2,3,4].map(level => (
                  <div key={level} className={`flex-1 h-1.5 rounded-full transition-all ${
                    pwForm.next.length >= level * 3
                      ? level <= 1 ? 'bg-red-400' : level <= 2 ? 'bg-orange-400' : level <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pwForm.next.length < 4 ? 'ضعيفة' : pwForm.next.length < 7 ? 'متوسطة' : pwForm.next.length < 10 ? 'جيدة' : 'قوية جداً'}
              </p>
            </div>
          )}

          <button onClick={handleChangePassword} disabled={changingPw || !pwForm.next || pwForm.next !== pwForm.confirm}
            className="mt-4 w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {changingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={14} />تحديث كلمة المرور</>}
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${profile.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className={`w-3 h-3 rounded-full ${profile.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <div>
          <p className={`font-semibold text-sm ${profile.is_active ? 'text-green-800' : 'text-red-800'}`}>
            الحساب {profile.is_active ? 'نشط ومفعّل' : 'موقوف'}
          </p>
          <p className={`text-xs ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
            {profile.is_active ? 'لديك وصول كامل للمنصة وفق صلاحياتك' : 'تواصل مع رئيس الهيئة لتفعيل الحساب'}
          </p>
        </div>
        {profile.is_active && <Award size={20} className="text-green-500 mr-auto" />}
      </div>
    </div>
  );
};

export default ProfilePage;
