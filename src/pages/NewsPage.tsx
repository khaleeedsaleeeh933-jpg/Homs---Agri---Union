import { useState, useEffect } from 'react';
import { Newspaper, Pin, Search, Calendar } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types/database';

const TYPE_MAP: Record<string, { label: string; cls: string; emoji: string }> = {
  news: { label: 'خبر', cls: 'bg-green-100 text-green-700', emoji: '📰' },
  announcement: { label: 'إعلان', cls: 'bg-blue-100 text-blue-700', emoji: '📢' },
  alert: { label: 'تنبيه', cls: 'bg-red-100 text-red-700', emoji: '🔔' },
};

const NewsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('published_at', { ascending: false })
      .then(({ data }) => { if (data) setAnnouncements(data as Announcement[]); setLoading(false); });
  }, []);

  const filtered = announcements.filter(a => {
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search);
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  const pinned = filtered.filter(a => a.is_pinned);
  const rest = filtered.filter(a => !a.is_pinned);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Newspaper size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">الأخبار والإعلانات</h1>
          <p className="text-muted-foreground mt-2">تابع آخر أخبار الهيئة والكلية</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="البحث..." className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-2">
            {['all', 'news', 'announcement', 'alert'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${typeFilter === t ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>
                {t === 'all' ? 'الكل' : TYPE_MAP[t]?.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />)}</div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1"><Pin size={12} />مثبتة</p>
                <div className="space-y-4">{pinned.map(ann => <AnnouncementCard key={ann.id} ann={ann} pinned />)}</div>
              </div>
            )}
            <div className="space-y-4">{rest.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}</div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground"><Newspaper size={40} className="mx-auto mb-3 opacity-30" /><p>لا توجد نتائج</p></div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AnnouncementCard = ({ ann, pinned }: { ann: Announcement; pinned?: boolean }) => {
  const type = TYPE_MAP[ann.type] || TYPE_MAP.news;
  return (
    <div className={`glass-card-light rounded-2xl overflow-hidden border transition-all hover:shadow-md ${pinned ? 'border-primary/30' : 'border-gray-100'}`}>
      <div className="flex gap-4 p-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0`} style={{ background: 'rgba(0,0,0,0.04)' }}>
          {type.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`status-badge text-xs ${type.cls}`}>{type.label}</span>
            {pinned && <span className="flex items-center gap-1 text-xs text-primary font-medium"><Pin size={10} />مثبت</span>}
          </div>
          <h3 className="font-bold text-foreground leading-snug mb-1">{ann.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2">{ann.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar size={11} />{new Date(ann.published_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>{ann.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
