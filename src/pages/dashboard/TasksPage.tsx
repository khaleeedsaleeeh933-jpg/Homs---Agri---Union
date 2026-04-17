import { useState, useEffect } from 'react';
import { Plus, Search, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Task, TaskStatus, TaskPriority, OfficeType } from '@/types/database';
import { toast } from 'sonner';

const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
const STATUS_LABELS: Record<TaskStatus, string> = { new: 'جديدة', in_progress: 'قيد التنفيذ', review: 'مراجعة', completed: 'مكتملة', late: 'متأخرة' };
const STATUS_CLS: Record<TaskStatus, string> = { new: 'status-new', in_progress: 'status-processing', review: 'status-pending', completed: 'status-solved', late: 'bg-red-100 text-red-700' };
const PRIORITY_CLS: Record<TaskPriority, string> = { low: 'text-green-500', medium: 'text-yellow-500', high: 'text-orange-500', urgent: 'text-red-500' };
const OFFICES: Record<OfficeType, string> = { organization: 'التنظيم', followup: 'المتابعة', media: 'الإعلام', events: 'الفعاليات', training: 'التدريب' };

const TasksPage = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assigned_name: '', due_date: '', priority: 'medium' as TaskPriority, office: 'events' as OfficeType });

  const canCreate = profile?.role !== 'student' && profile?.role !== 'member';

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.includes(search) || (t.assigned_name || '').includes(search);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.title || !form.assigned_name || !form.due_date) { toast.error('يرجى ملء جميع الحقول'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('tasks').insert({
      ...form, status: 'new', completion_rate: 0, tags: [], created_by: user?.id,
    }).select().single();
    if (!error && data) {
      setTasks(prev => [data as Task, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', assigned_name: '', due_date: '', priority: 'medium', office: 'events' });
      toast.success('تم إنشاء المهمة');
    } else { toast.error('فشل إنشاء المهمة'); }
    setSaving(false);
  };

  const updateProgress = async (id: string, rate: number) => {
    const newStatus: TaskStatus = rate === 100 ? 'completed' : rate > 0 ? 'in_progress' : 'new';
    const { error } = await supabase.from('tasks').update({ completion_rate: rate, status: newStatus }).eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completion_rate: rate, status: newStatus } : t));
      setSelected(prev => prev && prev.id === id ? { ...prev, completion_rate: rate, status: newStatus } : prev);
      toast.success('تم تحديث نسبة الإنجاز');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">إدارة المهام</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} مهمة</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />إنشاء مهمة
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', ...Object.keys(STATUS_LABELS)].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>
              {s === 'all' ? 'الكل' : STATUS_LABELS[s as TaskStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={`glass-card-light rounded-xl p-3 text-center border ${key === 'late' ? 'border-red-200' : 'border-gray-100'}`}>
            <p className="text-xl font-black">{tasks.filter(t => t.status === key).length}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} onClick={() => setSelected(t)} className="glass-card-light rounded-2xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-2">
                <span className={`status-badge text-xs ${STATUS_CLS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                <span className={`text-xs font-semibold ${PRIORITY_CLS[t.priority]}`}>{PRIORITY_LABELS[t.priority]}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{t.title}</h3>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{t.assigned_name}</span>
                <span className="flex items-center gap-1"><Calendar size={10} />{new Date(t.due_date).toLocaleDateString('ar-SY')}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${t.completion_rate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.completion_rate}% مكتمل</p>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد مهام مطابقة</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">إنشاء مهمة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان المهمة *"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف المهمة" rows={2}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <input value={form.assigned_name} onChange={e => setForm(p => ({ ...p, assigned_name: e.target.value }))} placeholder="المسؤول *"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))} className="border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={form.office} onChange={e => setForm(p => ({ ...p, office: e.target.value as OfficeType }))} className="border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {Object.entries(OFFICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'إنشاء المهمة'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-foreground">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            {selected.description && <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">المسؤول</p>
                <p className="font-medium">{selected.assigned_name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">الموعد</p>
                <p className="font-medium">{new Date(selected.due_date).toLocaleDateString('ar-SY')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">المكتب</p>
                <p className="font-medium">{OFFICES[selected.office]}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">الأولوية</p>
                <p className={`font-medium ${PRIORITY_CLS[selected.priority]}`}>{PRIORITY_LABELS[selected.priority]}</p>
              </div>
            </div>
            <div className="mb-3">
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${selected.completion_rate}%` }} />
              </div>
              <p className="text-sm text-center font-bold text-primary">{selected.completion_rate}%</p>
            </div>
            {canCreate && (
              <div>
                <p className="text-sm font-medium mb-2">تحديث نسبة الإنجاز:</p>
                <div className="flex gap-2 flex-wrap">
                  {[0, 25, 50, 75, 100].map(rate => (
                    <button key={rate} onClick={() => updateProgress(selected.id, rate)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selected.completion_rate === rate ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
