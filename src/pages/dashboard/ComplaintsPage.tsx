import { useState, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Complaint, ComplaintStatus } from '@/types/database';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديدة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'transferred', label: 'محولة' },
  { value: 'solved', label: 'محلولة' },
  { value: 'closed', label: 'مغلقة' },
];

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'status-new' },
  processing: { label: 'قيد المعالجة', cls: 'status-processing' },
  transferred: { label: 'محولة', cls: 'status-pending' },
  solved: { label: 'تم الحل', cls: 'status-solved' },
  closed: { label: 'مغلقة', cls: 'status-closed' },
};

const ComplaintsPage = () => {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [response, setResponse] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchComplaints = async () => {
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (data) setComplaints(data as Complaint[]);
    setLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, []);

  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.title.includes(search) || c.description.includes(search);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    setUpdating(true);
    const { error } = await supabase.from('complaints').update({ status, response: response || null, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status, response: response || c.response } : c));
      setSelected(null);
      setResponse('');
      toast.success(`تم تحديث الشكوى إلى "${STATUS_CONFIG[status].label}"`);
    } else {
      toast.error('فشل تحديث الشكوى');
    }
    setUpdating(false);
  };

  const newCount = complaints.filter(c => c.status === 'new').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">إدارة الشكاوى</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} شكوى</p>
        </div>
        {newCount > 0 && (
          <div className="bg-primary text-white px-3 py-1.5 rounded-xl text-sm font-medium animate-pulse">
            {newCount} جديدة
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الشكاوى..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === opt.value ? 'bg-primary text-white shadow-md' : 'bg-white border border-border hover:border-primary'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} onClick={() => { setSelected(c); setResponse(c.response || ''); }}
              className="glass-card-light rounded-2xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-2">
                <span className={`status-badge text-xs ${STATUS_CONFIG[c.status].cls}`}>{STATUS_CONFIG[c.status].label}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('ar-SY')}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{c.type}</span>
                {c.submitter_name && <span>من: {c.submitter_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد شكاوى مطابقة</p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">{selected.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">النوع: {selected.type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">وصف الشكوى</p>
                <p>{selected.description}</p>
              </div>
              {(selected.submitter_name || selected.submitter_phone) && (
                <div className="flex gap-4 text-xs text-muted-foreground bg-blue-50 rounded-xl p-3">
                  {selected.submitter_name && <span>المُبلّغ: <strong className="text-foreground">{selected.submitter_name}</strong></span>}
                  {selected.submitter_phone && <span>هاتف: <strong className="text-foreground" dir="ltr">{selected.submitter_phone}</strong></span>}
                </div>
              )}
              {selected.location && <p className="text-xs text-muted-foreground">📍 {selected.location}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">رد الهيئة</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="اكتب رداً..." rows={3}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateStatus(selected.id, 'processing')} disabled={updating} className="bg-yellow-100 text-yellow-700 py-2 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50">قيد المعالجة</button>
              <button onClick={() => updateStatus(selected.id, 'transferred')} disabled={updating} className="bg-orange-100 text-orange-700 py-2 rounded-xl text-sm font-medium hover:bg-orange-200 transition-colors disabled:opacity-50">تحويل</button>
              <button onClick={() => updateStatus(selected.id, 'solved')} disabled={updating} className="bg-green-100 text-green-700 py-2 rounded-xl text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50">تم الحل</button>
              <button onClick={() => updateStatus(selected.id, 'closed')} disabled={updating} className="bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
