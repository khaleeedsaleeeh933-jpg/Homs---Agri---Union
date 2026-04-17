 import { useState, useEffect } from 'react';
import { X, Pin, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types/database';

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  news:         { emoji: '📰', color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  announcement: { emoji: '📢', color: 'text-blue-700',  bg: 'bg-blue-50',   border: 'border-blue-200' },
  alert:        { emoji: '🔔', color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200' },
  event:        { emoji: '📅', color: 'text-purple-700',bg: 'bg-purple-50', border: 'border-purple-200' },
};

const SEEN_KEY = 'seen_announcements_v1';

const AnnouncementPopup = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');

    supabase.from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const unseen = (data as Announcement[]).filter(a => !seen.includes(a.id));
        if (unseen.length > 0) {
          setAnnouncements(unseen);
          setVisible(true);
        }
      });
  }, []);

  const dismiss = () => {
    const ids = announcements.map(a => a.id);
    const prev: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...prev, ...ids])]));
    setVisible(false);
  };

  const next = () => {
    if (current < announcements.length - 1) setCurrent(c => c + 1);
    else dismiss();
  };

  if (!visible || announcements.length === 0) return null;

  const ann = announcements[current];
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.news;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 ${cfg.border} overflow-hidden animate-slide-up`}>
        {/* Header */}
        <div className={`${cfg.bg} px-5 pt-5 pb-3 flex items-start justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-white shadow-sm">
              {cfg.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {ann.is_pinned && <Pin size={12} className="text-primary" />}
                <span className={`text-xs font-bold ${cfg.color} uppercase tracking-wide`}>
                  {ann.type === 'news' ? 'خبر' : ann.type === 'announcement' ? 'إعلان' : ann.type === 'alert' ? 'تنبيه' : 'فعالية'}
                </span>
              </div>
              <p className={`text-xs ${cfg.color} opacity-70 mt-0.5`}>
                {new Date(ann.published_at).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-white/60 text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <h2 className="text-lg font-black text-foreground leading-snug mb-2">{ann.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{ann.content}</p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Bell size={11} />
            {ann.author}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {current + 1} من {announcements.length}
          </span>
          <div className="flex gap-2">
            {announcements.length > 1 && current < announcements.length - 1 && (
              <button onClick={dismiss} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                تجاهل الكل
              </button>
            )}
            <button onClick={next}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
              {current < announcements.length - 1 ? 'التالي ←' : 'حسناً، فهمت'}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        {announcements.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-4">
            {announcements.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-primary' : 'w-1.5 bg-gray-200'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementPopup;
