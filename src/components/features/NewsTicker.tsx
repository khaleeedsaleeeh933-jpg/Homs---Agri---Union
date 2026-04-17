import { useState, useEffect, useRef } from 'react';
import { Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const NewsTicker = () => {
  const [items, setItems] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    supabase.from('announcements').select('title,type').order('published_at', { ascending: false }).limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const typeEmoji: Record<string, string> = { news: '📰', announcement: '📢', alert: '🔔', event: '📅' };
          setItems(data.map(a => `${typeEmoji[a.type] || '📢'} ${a.title}`));
        }
      });
  }, []);

  if (items.length === 0) return null;

  const tickerContent = [...items, ...items]; // duplicate for seamless loop

  return (
    <div
      className="w-full overflow-hidden border-y border-white/10 bg-black/20 backdrop-blur-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 h-8">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white/15 px-2.5 py-0.5 rounded-md ml-3">
          <Radio size={10} className="text-red-400 animate-pulse" />
          <span className="text-white/90 text-[10px] font-bold tracking-wide whitespace-nowrap">آخر الأخبار</span>
        </div>

        {/* Ticker */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{
              animation: paused ? 'none' : 'ticker-scroll 40s linear infinite',
            }}>
            {tickerContent.map((item, i) => (
              <span key={i} className="text-white/80 text-[11px] font-medium shrink-0 flex items-center gap-1">
                {item}
                <span className="text-white/30 mx-2">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
