import { useState, useEffect } from 'react';
import { Bell, Send, Users, X, Search, CheckCheck, AlertCircle, ClipboardList, FileText, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/database';
import { toast } from 'sonner';

const ALERT_TEMPLATES = [
  { icon: '📋', label: 'تقرير أسبوعي', text: 'تذكير: يرجى تسليم تقريرك الأسبوعي قبل نهاية اليوم.' },
  { icon: '📊', label: 'تقرير شهري', text: 'تذكير: موعد تسليم التقرير الشهري خلال 48 ساعة.' },
  { icon: '📅', label: 'حضور اجتماع', text: 'تذكير: اجتماع الهيئة غداً الساعة 11 صباحاً في غرفة الاجتماعات.' },
  { icon: '✅', label: 'إتمام المهمة', text: 'تذكير: يرجى إتمام المهمة الموكلة إليك والإفادة بالنتائج.' },
  { icon: '📝', label: 'تحديث السجلات', text: 'يرجى تحديث سجلاتك وبياناتك في المنصة.' },
  { icon: '🔔', label: 'تنبيه عام', text: '' },
];

const ROLE_LABELS: Record<string, string> = {
  president: 'رئيس الهيئة', vice_president: 'نائب الرئيس',
  office_head: 'رئيس مكتب', member: 'عضو', student: 'طالب',
};

interface SentNotification {
  id: string; title: string; message: string; created_at: string; recipientCount: number;
}

const FollowUpNotificationsPage = () => {
  const { profile, user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'send' | 'history'>('send');
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [mode, setMode] = useState<'select' | 'role'>('role');

  const canSend = profile?.role && ['president','vice_president','office_head','member'].includes(profile.role)
    && (profile.office === 'followup' || profile.role === 'president' || profile.role === 'vice_president');

  useEffect(() => {
    supabase.from('user_profiles').select('*').order('username')
      .then(({ data }) => { if (data) setUsers(data as UserProfile[]); });
  }, []);

  const filteredUsers = users.filter(u => {
    const matchRole = targetRole === 'all' || u.role === targetRole;
    const matchSearch = !search || (u.username || '').includes(search) || u.email.includes(search);
    return matchRole && matchSearch && u.id !== user?.id;
  });

  const toggleUser = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filteredUsers.map(u => u.id)));
  const clearAll = () => setSelected(new Set());

  const getRecipients = (): string[] => {
    if (mode === 'role') {
      const targets = targetRole === 'all' ? users : users.filter(u => u.role === targetRole);
      return targets.filter(u => u.id !== user?.id).map(u => u.id);
    }
    return Array.from(selected);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast.error('يرجى ملء العنوان والرسالة'); return; }
    const recipients = getRecipients();
    if (recipients.length === 0) { toast.error('يرجى اختيار مستلم واحد على الأقل'); return; }

    setSending(true);
    const notifications = recipients.map(userId => ({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
      type: 'followup',
      is_read: false,
      link: '/dashboard',
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      toast.error('فشل إرسال التنبيهات: ' + error.message);
    } else {
      toast.success(`تم إرسال التنبيه لـ ${recipients.length} شخص ✅`);
      setHistory(prev => [{ id: Date.now().toString(), title, message, created_at: new Date().toISOString(), recipientCount: recipients.length }, ...prev]);
      setTitle('');
      setMessage('');
      setSelected(new Set());
    }
    setSending(false);
  };

  if (!canSend) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Bell size={28} className="opacity-30" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">غير مصرح</p>
          <p className="text-sm mt-1">هذه الصفحة مخصصة لمكتب المتابعة والقيادة فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">تنبيهات مكتب المتابعة</h1>
          <p className="text-muted-foreground text-sm">إرسال تذكيرات وتنبيهات لأعضاء الهيئة</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium">{users.length} مستخدم متاح</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[{ key: 'send', label: 'إرسال تنبيه', icon: Send }, { key: 'history', label: 'السجل', icon: ClipboardList }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Compose */}
          <div className="space-y-4">
            <div className="glass-card-light rounded-2xl p-5 border border-gray-100 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Bell size={16} className="text-primary" />صياغة التنبيه
              </h2>

              {/* Templates */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">قوالب جاهزة:</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TEMPLATES.map((t, i) => (
                    <button key={i} onClick={() => { if (t.text) { setTitle(t.label); setMessage(t.text); } else setTitle(t.label); }}
                      className="text-right px-3 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">عنوان التنبيه *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: تذكير تسليم التقرير الأسبوعي"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">نص التنبيه *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب نص التنبيه هنا..." rows={4}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>

            {/* Preview */}
            {(title || message) && (
              <div className="glass-card-light rounded-2xl p-4 border border-primary/20 bg-primary/5">
                <p className="text-xs font-semibold text-primary mb-2">معاينة التنبيه:</p>
                <div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{title || '...'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{message || '...'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <div className="glass-card-light rounded-2xl p-5 border border-gray-100 space-y-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Users size={16} className="text-primary" />المستلمون
              </h2>

              {/* Mode toggle */}
              <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                <button onClick={() => setMode('role')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'role' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}>
                  حسب الدور
                </button>
                <button onClick={() => setMode('select')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'select' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}>
                  اختيار يدوي
                </button>
              </div>

              {mode === 'role' ? (
                <div>
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="all">الجميع</option>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <AlertCircle size={14} className="text-blue-500 shrink-0" />
                    <span>سيتم الإرسال لـ <strong className="text-blue-700">{getRecipients().length}</strong> شخص</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
                        className="w-full pr-8 pl-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <button onClick={selectAll} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20">الكل</button>
                    <button onClick={clearAll} className="px-2 py-1 text-xs bg-gray-100 text-muted-foreground rounded-lg hover:bg-gray-200">مسح</button>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredUsers.map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleUser(u.id)}
                          className="w-4 h-4 rounded accent-primary shrink-0" />
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {(u.username || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{u.username || u.email}</p>
                          <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selected.size > 0 && (
                    <p className="text-xs text-primary font-medium text-center">تم اختيار {selected.size} شخص</p>
                  )}
                </>
              )}
            </div>

            {/* Send button */}
            <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim() || getRecipients().length === 0}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
              {sending
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري الإرسال...</>
                : <><Send size={16} />إرسال لـ {getRecipients().length} شخص</>}
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
              <p>لا يوجد سجل إرسال بعد</p>
            </div>
          ) : history.map(h => (
            <div key={h.id} className="glass-card-light rounded-xl p-4 border border-gray-100 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCheck size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{h.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{h.message}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={10} />{h.recipientCount} مستلم</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(h.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <span className="text-xs text-green-600 font-medium self-start bg-green-50 px-2 py-1 rounded-lg border border-green-100">تم الإرسال ✅</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpNotificationsPage;
