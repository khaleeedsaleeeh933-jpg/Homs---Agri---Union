import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuth as useAuthHook } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import type { Event } from '@/types/database';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'قادمة', cls: 'status-new' },
  ongoing: { label: 'جارية', cls: 'status-processing' },
  completed: { label: 'منتهية', cls: 'status-closed' },
  cancelled: { label: 'ملغاة', cls: 'bg-red-100 text-red-700' },
};

const EventsPage = () => {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Event | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (data) setEvents(data as Event[]);
    if (user) {
      const { data: regs } = await supabase.from('event_registrations').select('event_id').eq('user_id', user.id);
      if (regs) setRegisteredIds(new Set(regs.map((r: any) => r.event_id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = events.filter(e => filter === 'all' || e.status === filter);

  const handleRegister = async (event: Event) => {
    if (!user || !profile) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    if (registeredIds.has(event.id)) {
      await supabase.from('event_registrations').delete().eq('event_id', event.id).eq('user_id', user.id);
      await supabase.from('events').update({ registered_count: Math.max(0, event.registered_count - 1) }).eq('id', event.id);
      setRegisteredIds(prev => { const s = new Set(prev); s.delete(event.id); return s; });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, registered_count: Math.max(0, e.registered_count - 1) } : e));
      toast.info('تم إلغاء تسجيلك');
    } else {
      const { error } = await supabase.from('event_registrations').insert({ event_id: event.id, user_id: user.id, name: profile.username || profile.email });
      if (!error) {
        await supabase.from('events').update({ registered_count: event.registered_count + 1 }).eq('id', event.id);
        setRegisteredIds(prev => new Set([...prev, event.id]));
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, registered_count: e.registered_count + 1 } : e));
        toast.success('تم تسجيلك في الفعالية!');
      } else { toast.error('فشل التسجيل'); }
    }
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">الفعاليات</h1>
          <p className="text-muted-foreground mt-2">تابع فعاليات الهيئة الطلابية وسجّل مشاركتك</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 justify-center">
          {['all', 'upcoming', 'ongoing', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === s ? 'bg-primary text-white' : 'bg-white border border-border hover:border-primary'}`}>
              {s === 'all' ? 'الكل' : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(event => (
              <div key={event.id} className="glass-card-light rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group" onClick={() => setSelected(event)}>
                <div className="relative h-44 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {event.image_url ? (
                    <img src={event.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Calendar size={48} className="text-primary/30" />
                  )}
                  <span className={`absolute top-3 right-3 status-badge ${STATUS_MAP[event.status]?.cls}`}>{STATUS_MAP[event.status]?.label}</span>
                  {registeredIds.has(event.id) && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">مسجّل ✓</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-2 leading-tight">{event.title}</h3>
                  <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{event.description}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar size={11} className="text-primary" />{new Date(event.date).toLocaleDateString('ar-SY', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    <div className="flex items-center gap-2"><MapPin size={11} className="text-primary" />{event.location}</div>
                    <div className="flex items-center gap-2"><Users size={11} className="text-primary" />{event.registered_count}/{event.capacity} مسجل</div>
                  </div>
                  <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min((event.registered_count / event.capacity) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد فعاليات</p>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
              {selected.image_url ? (
                <img src={selected.image_url} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-32 gradient-primary flex items-center justify-center">
                  <Calendar size={48} className="text-white/50" />
                </div>
              )}
              <div className="p-6">
                <span className={`status-badge mb-3 inline-block ${STATUS_MAP[selected.status]?.cls}`}>{STATUS_MAP[selected.status]?.label}</span>
                <h2 className="font-black text-foreground text-xl mb-2">{selected.title}</h2>
                <p className="text-muted-foreground text-sm mb-4">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-muted-foreground">التاريخ</p><p className="font-medium mt-0.5">{new Date(selected.date).toLocaleDateString('ar-SY', { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-muted-foreground">الموقع</p><p className="font-medium mt-0.5">{selected.location}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-muted-foreground">المنظم</p><p className="font-medium mt-0.5">{selected.organizer}</p></div>
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-muted-foreground">الأماكن المتبقية</p><p className="font-bold mt-0.5 text-primary">{selected.capacity - selected.registered_count}</p></div>
                </div>
                {selected.status === 'upcoming' && selected.registered_count < selected.capacity ? (
                  <button onClick={() => handleRegister(selected)} className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${registeredIds.has(selected.id) ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary text-white hover:bg-primary/90'}`}>
                    <CheckCircle size={18} />{registeredIds.has(selected.id) ? 'إلغاء التسجيل' : 'سجّل مشاركتك'}
                  </button>
                ) : (
                  <div className="text-center py-2 text-muted-foreground text-sm">{selected.status !== 'upcoming' ? 'انتهت الفعالية' : 'الأماكن مكتملة'}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
