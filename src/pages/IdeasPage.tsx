import { useState, useEffect } from 'react';
import { Lightbulb, ThumbsUp, MessageCircle, Plus, X, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Idea, IdeaCategory } from '@/types/database';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', studying: 'قيد الدراسة', implementing: 'قيد التنفيذ', rejected: 'مرفوضة', done: 'منجزة',
};
const STATUS_CLS: Record<string, string> = {
  new: 'status-new', studying: 'status-processing', implementing: 'bg-purple-100 text-purple-700', rejected: 'bg-red-100 text-red-600', done: 'status-solved',
};
const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  technical: 'تقنية', organizational: 'تنظيمية', events: 'فعاليات', training: 'تدريب', general: 'عامة',
};

const IdeasPage = () => {
  const { user, profile } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', category: 'general' as IdeaCategory, is_anonymous: false });

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

  const filtered = ideas.filter(i => {
    const matchSearch = !search || i.title.includes(search) || i.description.includes(search);
    const matchCat = catFilter === 'all' || i.category === catFilter;
    return matchSearch && matchCat;
  });

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

  const submitIdea = async () => {
    if (!form.title || !form.description) { toast.error('يرجى ملء العنوان والوصف'); return; }
    const { data, error } = await supabase.from('ideas').insert({
      ...form,
      submitter_id: form.is_anonymous ? null : (user?.id || null),
      submitter_name: form.is_anonymous ? null : (profile?.username || profile?.email || 'مجهول'),
      status: 'new', votes_count: 0, comments_count: 0,
    }).select().single();
    if (!error && data) {
      setIdeas(prev => [data as Idea, ...prev]);
      setShowModal(false);
      setForm({ title: '', description: '', category: 'general', is_anonymous: false });
      toast.success('تم إرسال فكرتك!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lightbulb size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">صندوق الأفكار</h1>
          <p className="text-muted-foreground mt-2">شاركنا أفكارك لتطوير الهيئة والكلية</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الأفكار..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            <Plus size={16} />أضف فكرتك
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {['all', ...Object.keys(CATEGORY_LABELS)].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${catFilter === c ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>
              {c === 'all' ? 'الكل' : CATEGORY_LABELS[c as IdeaCategory]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(idea => (
              <div key={idea.id} className="glass-card-light rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <span className={`status-badge text-xs ${STATUS_CLS[idea.status] || ''}`}>{STATUS_LABELS[idea.status]}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-muted-foreground">{CATEGORY_LABELS[idea.category as IdeaCategory]}</span>
                </div>
                <h3 className="font-bold text-foreground mb-2 leading-snug">{idea.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{idea.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => vote(idea)} className={`flex items-center gap-1 text-sm font-medium transition-all hover:scale-110 ${votedIds.has(idea.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                      <ThumbsUp size={16} className={votedIds.has(idea.id) ? 'fill-current' : ''} />
                      <span>{idea.votes_count}</span>
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle size={16} />{idea.comments_count}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{idea.submitter_name || 'مجهول'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد أفكار بعد. كن الأول!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">شاركنا فكرتك</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الفكرة *"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="اشرح فكرتك بالتفصيل *" rows={3}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as IdeaCategory }))} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(p => ({ ...p, is_anonymous: e.target.checked }))} />
                <span className="text-sm text-muted-foreground">إرسال بشكل مجهول</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitIdea} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">إرسال</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasPage;
