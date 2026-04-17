import { useState, useEffect } from 'react';
import { Lightbulb, ThumbsUp, MessageCircle, Plus, X, Tag, TrendingUp, CheckSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Idea, IdeaComment, IdeaStatus, IdeaCategory } from '@/types/database';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<IdeaStatus, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'status-new' },
  studying: { label: 'قيد الدراسة', cls: 'status-processing' },
  implementing: { label: 'قيد التنفيذ', cls: 'bg-purple-100 text-purple-700' },
  rejected: { label: 'مرفوضة', cls: 'bg-red-100 text-red-600' },
  done: { label: 'منجزة', cls: 'status-solved' },
};

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  technical: 'تقنية', organizational: 'تنظيمية', events: 'فعاليات', training: 'تدريب', general: 'عامة',
};

const IdeasDashboardPage = () => {
  const { user, profile } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Idea | null>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general' as IdeaCategory, is_anonymous: false });
  const canManage = profile?.role !== 'student';

  const fetchIdeas = async () => {
    const { data } = await supabase.from('ideas').select('*').order('votes_count', { ascending: false });
    if (data) setIdeas(data as Idea[]);
    if (user) {
      const { data: votes } = await supabase.from('idea_votes').select('idea_id').eq('user_id', user.id);
      if (votes) setVotedIds(new Set(votes.map((v: any) => v.idea_id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchIdeas(); }, []);

  const filtered = ideas.filter(i => statusFilter === 'all' || i.status === statusFilter);

  const vote = async (idea: Idea) => {
    if (!user) { toast.error('يجب تسجيل الدخول للتصويت'); return; }
    const hasVoted = votedIds.has(idea.id);
    if (hasVoted) {
      await supabase.from('idea_votes').delete().eq('idea_id', idea.id).eq('user_id', user.id);
      await supabase.from('ideas').update({ votes_count: Math.max(0, idea.votes_count - 1) }).eq('id', idea.id);
      setVotedIds(prev => { const s = new Set(prev); s.delete(idea.id); return s; });
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, votes_count: Math.max(0, i.votes_count - 1) } : i));
    } else {
      await supabase.from('idea_votes').insert({ idea_id: idea.id, user_id: user.id });
      await supabase.from('ideas').update({ votes_count: idea.votes_count + 1 }).eq('id', idea.id);
      setVotedIds(prev => new Set([...prev, idea.id]));
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, votes_count: i.votes_count + 1 } : i));
    }
  };

  const updateStatus = async (id: string, status: IdeaStatus) => {
    const { error } = await supabase.from('ideas').update({ status }).eq('id', id);
    if (!error) {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      setSelected(prev => prev && prev.id === id ? { ...prev, status } : prev);
      toast.success('تم تحديث حالة الفكرة');
    }
  };

  const convertToTask = async (idea: Idea) => {
    const today = new Date(); today.setDate(today.getDate() + 14);
    const { error } = await supabase.from('tasks').insert({
      title: idea.title, description: idea.description, office: 'events',
      priority: 'medium', status: 'new', due_date: today.toISOString().split('T')[0],
      assigned_name: profile?.username || '', completion_rate: 0, tags: ['من صندوق الأفكار'],
      created_by: user?.id,
    });
    if (!error) {
      await updateStatus(idea.id, 'implementing');
      toast.success('تم تحويل الفكرة إلى مهمة');
      setSelected(null);
    } else { toast.error('فشل تحويل الفكرة'); }
  };

  const fetchComments = async (ideaId: string) => {
    const { data } = await supabase.from('idea_comments').select('*').eq('idea_id', ideaId).order('created_at');
    if (data) setComments(data as IdeaComment[]);
  };

  const addComment = async () => {
    if (!newComment.trim() || !selected || !user || !profile) return;
    const { data, error } = await supabase.from('idea_comments').insert({
      idea_id: selected.id, user_id: user.id, user_name: profile.username || profile.email, content: newComment.trim(),
    }).select().single();
    if (!error && data) {
      setComments(prev => [...prev, data as IdeaComment]);
      setNewComment('');
      setIdeas(prev => prev.map(i => i.id === selected.id ? { ...i, comments_count: i.comments_count + 1 } : i));
      await supabase.from('ideas').update({ comments_count: selected.comments_count + 1 }).eq('id', selected.id);
    }
  };

  const submitIdea = async () => {
    if (!form.title || !form.description) { toast.error('يرجى ملء العنوان والوصف'); return; }
    const { data, error } = await supabase.from('ideas').insert({
      ...form,
      submitter_id: form.is_anonymous ? null : (user?.id || null),
      submitter_name: form.is_anonymous ? null : (profile?.username || profile?.email || null),
      status: 'new', votes_count: 0, comments_count: 0,
    }).select().single();
    if (!error && data) {
      setIdeas(prev => [data as Idea, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', category: 'general', is_anonymous: false });
      toast.success('تم إضافة فكرتك!');
    } else { toast.error('فشل إضافة الفكرة'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">صندوق الأفكار</h1>
          <p className="text-muted-foreground text-sm">{ideas.length} فكرة مقدمة</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />فكرة جديدة
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>
            {s === 'all' ? 'الكل' : STATUS_CONFIG[s as IdeaStatus].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <div key={idea.id} className="glass-card-light rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-2">
                <span className={`status-badge text-xs ${STATUS_CONFIG[idea.status].cls}`}>{STATUS_CONFIG[idea.status].label}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-muted-foreground">{CATEGORY_LABELS[idea.category as IdeaCategory]}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1 cursor-pointer hover:text-primary line-clamp-2"
                onClick={() => { setSelected(idea); fetchComments(idea.id); }}>
                {idea.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{idea.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => vote(idea)} className={`flex items-center gap-1 text-xs transition-all ${votedIds.has(idea.id) ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'}`}>
                    <ThumbsUp size={14} className={votedIds.has(idea.id) ? 'fill-current' : ''} />{idea.votes_count}
                  </button>
                  <button onClick={() => { setSelected(idea); fetchComments(idea.id); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <MessageCircle size={14} />{idea.comments_count}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{idea.submitter_name || 'مجهول'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Idea Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <span className={`status-badge text-xs mb-2 inline-block ${STATUS_CONFIG[selected.status].cls}`}>{STATUS_CONFIG[selected.status].label}</span>
                <h2 className="font-black text-foreground">{selected.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{CATEGORY_LABELS[selected.category as IdeaCategory]} · {selected.submitter_name || 'مجهول'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg shrink-0"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{selected.description}</p>

              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => vote(selected)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${votedIds.has(selected.id) ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <ThumbsUp size={15} className={votedIds.has(selected.id) ? 'fill-current' : ''} />{selected.votes_count} صوت
                </button>
                {canManage && selected.status !== 'done' && (
                  <button onClick={() => convertToTask(selected)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                    <CheckSquare size={15} />تحويل لمهمة
                  </button>
                )}
              </div>

              {canManage && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">تغيير الحالة:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => updateStatus(selected.id, k as IdeaStatus)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selected.status === k ? 'ring-2 ring-primary' : 'hover:opacity-80'} ${v.cls}`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">التعليقات ({comments.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {comments.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground">{c.user_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('ar-SY')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>}
                </div>
                <div className="flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="أضف تعليقاً..."
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={addComment} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">إرسال</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">فكرة جديدة</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الفكرة *"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف تفصيلي للفكرة *" rows={3}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as IdeaCategory }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))} className="rounded" />
                <span className="text-sm text-muted-foreground">إرسال بشكل مجهول</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitIdea} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">إرسال الفكرة</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasDashboardPage;
