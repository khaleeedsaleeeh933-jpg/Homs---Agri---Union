import { useState, useEffect } from 'react';
import { Newspaper, Plus, X, Trash2, Pin, PinOff, Search, Bell, AlertTriangle, Megaphone, Edit2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Announcement } from '@/types/database';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  news:         { label: 'خبر',    emoji: '📰', color: 'bg-green-100 text-green-700',  border: 'border-green-200' },
  announcement: { label: 'إعلان',  emoji: '📢', color: 'bg-blue-100 text-blue-700',    border: 'border-blue-200' },
  alert:        { label: 'تنبيه',  emoji: '🔔', color: 'bg-red-100 text-red-700',      border: 'border-red-200' },
  event:        { label: 'فعالية', emoji: '📅', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
};

const AnnouncementsManagePage = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'news', is_pinned: false });

  const canManage = profile?.role && ['president','vice_president','office_head'].includes(profile.role);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });
    if (data) setAnnouncements(data as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', type: 'news', is_pinned: false });
    setShowModal(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setForm({ title: ann.title, content: ann.content, type: ann.type, is_pinned: ann.is_pinned });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('يرجى ملء العنوان والمحتوى'); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from('announcements').update({
        title: form.title, content: form.content, type: form.type, is_pinned: form.is_pinned,
      }).eq('id', editing.id);
      if (error) toast.error('فشل التحديث');
      else { toast.success('تم تحديث الإعلان ✅'); setShowModal(false); fetchAnnouncements(); }
    } else {
      const { error } = await supabase.from('announcements').insert({
        title: form.title, content: form.content, type: form.type,
        is_pinned: form.is_pinned, author: profile?.username || profile?.email || 'الهيئة',
        author_id: profile?.id || null,
      });
      if (error) toast.error('فشل إنشاء الإعلان');
      else { toast.success('تم نشر الإعلان ✅'); setShowModal(false); fetchAnnouncements(); }
    }
    setSaving(false);
  };

  const togglePin = async (ann: Announcement) => {
    await supabase.from('announcements').update({ is_pinned: !ann.is_pinned }).eq('id', ann.id);
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_pinned: !a.is_pinned } : a));
    toast.success(ann.is_pinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الإعلان');
  };

  const deleteAnn = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success('تم حذف الإعلان');
  };

  const filtered = announcements.filter(a => {
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search);
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">الإعلانات والأخبار</h1>
          <p className="text-muted-foreground text-sm">{announcements.length} إعلان منشور</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />إعلان جديد
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <div key={type} className="glass-card-light rounded-xl p-3 text-center border border-gray-100">
            <p className="text-2xl mb-1">{cfg.emoji}</p>
            <p className="text-xl font-black text-foreground">{announcements.filter(a => a.type === type).length}</p>
            <p className="text-xs text-muted-foreground">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الإعلانات..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTypeFilter('all')} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>الكل</button>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(k)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${typeFilter === k ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
          <p>لا توجد إعلانات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => {
            const cfg = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.news;
            return (
              <div key={ann.id} className={`glass-card-light rounded-2xl border overflow-hidden transition-all hover:shadow-md ${ann.is_pinned ? 'border-primary/30 bg-primary/5' : 'border-gray-100'}`}>
                <div className="flex gap-4 p-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gray-50">
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`status-badge text-xs ${cfg.color}`}>{cfg.label}</span>
                      {ann.is_pinned && <span className="flex items-center gap-0.5 text-xs text-primary font-semibold"><Pin size={10} />مثبت</span>}
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-snug mb-1">{ann.title}</h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{ann.author}</span>
                      <span>·</span>
                      <span>{new Date(ann.published_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => openEdit(ann)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500" title="تعديل">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => togglePin(ann)} className={`p-1.5 rounded-lg ${ann.is_pinned ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-gray-100 text-muted-foreground'}`} title={ann.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
                        {ann.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button onClick={() => deleteAnn(ann.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-foreground">{editing ? 'تعديل الإعلان' : 'إعلان جديد'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="عنوان الإعلان *" className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="محتوى الإعلان *" rows={5} className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">نوع الإعلان</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_pinned ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => setForm(p => ({ ...p, is_pinned: !p.is_pinned }))}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${form.is_pinned ? 'translate-x-0.5' : 'translate-x-5'}`} />
                    </div>
                    <span className="text-sm text-foreground">تثبيت الإعلان</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />حفظ ونشر</>}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-foreground py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagePage;
