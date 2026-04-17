import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Lightbulb, Calendar, Newspaper, ChevronLeft, Star, Users,
  CheckCircle, QrCode, ArrowLeft, Megaphone, GraduationCap, Shield,
  Zap, MessageSquare, TrendingUp, Award, Globe, ChevronDown
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import EventsGallery from '@/components/features/EventsGallery';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const [stats, setStats] = useState({ complaints: 0, ideas: 0, events: 0, users: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [animatedStats, setAnimatedStats] = useState({ complaints: 0, ideas: 0, events: 0, users: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    Promise.all([
      supabase.from('complaints').select('id', { count: 'exact', head: true }),
      supabase.from('ideas').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('*').order('published_at', { ascending: false }).limit(4),
      supabase.from('events').select('*').eq('status', 'upcoming').order('date').limit(3),
    ]).then(([c, i, e, u, ann, ev]) => {
      const newStats = {
        complaints: c.count || 0,
        ideas: i.count || 0,
        events: e.count || 0,
        users: u.count || 0,
      };
      setStats(newStats);
      if (ann.data) setAnnouncements(ann.data);
      if (ev.data) setEvents(ev.data);
    });
  }, []);

  // Animate counters on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const duration = 1500;
        const steps = 60;
        const interval = duration / steps;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          const ease = 1 - Math.pow(1 - progress, 3);
          setAnimatedStats({
            complaints: Math.round(ease * stats.complaints),
            ideas: Math.round(ease * stats.ideas),
            events: Math.round(ease * stats.events),
            users: Math.round(ease * stats.users),
          });
          if (step >= steps) clearInterval(timer);
        }, interval);
      }
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [stats]);

  const offices = [
    { name: 'مكتب التنظيم', emoji: '📋', color: 'from-blue-500 to-blue-700', desc: 'تنظيم شؤون الهيئة والانتخابات والسجلات' },
    { name: 'مكتب الفعاليات', emoji: '📅', color: 'from-teal-500 to-teal-700', desc: 'تنسيق وتنفيذ الفعاليات والأنشطة الطلابية' },
    { name: 'مكتب التدريب', emoji: '🎓', color: 'from-purple-500 to-purple-700', desc: 'الدورات التدريبية وتطوير مهارات الطلاب' },
    { name: 'مكتب الإعلام', emoji: '📢', color: 'from-orange-500 to-orange-700', desc: 'التغطية الإعلامية والتوثيق وإدارة المحتوى' },
    { name: 'مكتب المتابعة', emoji: '📌', color: 'from-indigo-500 to-indigo-700', desc: 'متابعة الشكاوى والمهام والتقارير الدورية' },
    { name: 'الشؤون الأكاديمية', emoji: '🏛️', color: 'from-red-500 to-red-700', desc: 'دعم الطلاب في الشؤون الدراسية والأكاديمية' },
  ];

  const TYPE_CFG: Record<string, { emoji: string; color: string; bg: string }> = {
    news:         { emoji: '📰', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    announcement: { emoji: '📢', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
    alert:        { emoji: '🔔', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
    event:        { emoji: '📅', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ──────────────── HERO ──────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Overlay layers */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(5,25,14,0.95) 0%, rgba(15,55,30,0.88) 50%, rgba(10,40,22,0.93) 100%)' }} />

        {/* Floating decorative rings */}
        <div className="absolute top-24 right-8 w-72 h-72 rounded-full border border-green-500/10 animate-float" />
        <div className="absolute top-32 right-8 w-52 h-52 rounded-full border border-green-400/15 animate-float" />
        <div className="absolute bottom-24 left-8 w-64 h-64 rounded-full border border-emerald-500/10 animate-float-delay" />
        <div className="absolute bottom-20 left-8 w-40 h-40 rounded-full border border-emerald-400/15 animate-float-delay" />
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-green-400/30 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-emerald-300/40 rounded-full animate-float-delay" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-36 pb-24">
          {/* Logo glow */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full scale-150" />
            <div className="relative glass rounded-3xl p-4 inline-block border border-white/20">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
                alt="شعار الهيئة" className="h-20 w-auto mx-auto drop-shadow-2xl"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm font-medium">منصة رقمية رسمية لعام 2026</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-3 animate-slide-up"
            style={{ textShadow: '0 0 60px rgba(74,222,128,0.15)' }}>
            الهيئة الطلابية
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-8 animate-slide-up"
            style={{ background: 'linear-gradient(90deg, #86efac, #4ade80, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            كلية الهندسة الزراعية — جامعة حمص
          </h2>
          <p className="text-green-100/80 text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in">
            منصتك الرقمية الموحّدة للتواصل مع الهيئة الطلابية، تقديم الشكاوى، متابعة الفعاليات والتدريب، والمشاركة في بناء مستقبل كليتنا
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/complaint"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 border border-white/20 backdrop-blur-sm hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <FileText size={20} className="text-red-300" />
              <span className="text-white">تقديم شكوى</span>
              <ArrowLeft size={16} className="text-white/60 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link to="/ideas"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 border border-white/20 backdrop-blur-sm hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              <Lightbulb size={20} className="text-amber-300" />
              <span className="text-white">شارك فكرتك</span>
              <ArrowLeft size={16} className="text-white/60 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
              <Star size={20} className="text-white" />
              <span className="text-white">دخول الهيئة</span>
            </Link>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in">
            {[
              { href: '/events', label: 'الفعاليات', icon: '📅' },
              { href: '/training', label: 'التدريب', icon: '🎓' },
              { href: '/news', label: 'الأخبار', icon: '📰' },
            ].map(l => (
              <Link key={l.href} to={l.href}
                className="flex items-center gap-1.5 text-sm text-green-300/70 hover:text-green-300 transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 backdrop-blur-sm">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <p className="text-white/30 text-xs">مرر للأسفل</p>
          <ChevronDown size={20} className="text-white/30" />
        </div>
      </section>

      <EventsGallery />

      {/* ──────────────── LIVE STATS ──────────────── */}
      <section ref={statsRef} className="py-16 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a2314 0%, #0f3d20 50%, #1a5530 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 border border-green-400/20 px-4 py-1.5 rounded-full mb-4">
              <Zap size={14} />إحصائيات حية
            </span>
            <h2 className="text-3xl font-black text-white">أرقام تعكس نشاطنا</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: animatedStats.users || '50+', label: 'مستخدم مسجل', icon: '👥', color: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
              { value: animatedStats.complaints || '10+', label: 'شكوى معالجة', icon: '📋', color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30' },
              { value: animatedStats.ideas || '5+', label: 'فكرة مقترحة', icon: '💡', color: 'from-amber-500/20 to-amber-600/20', border: 'border-amber-500/30' },
              { value: animatedStats.events || '3+', label: 'فعالية منظّمة', icon: '🎉', color: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30' },
            ].map((s, i) => (
              <div key={i} className={`relative rounded-2xl p-6 text-center border backdrop-blur-sm ${s.border}`}
                style={{ background: `linear-gradient(135deg, ${s.color.replace('from-', '').replace(' to-', ', ')})` }}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <p className="text-4xl sm:text-5xl font-black text-white mb-2">{s.value}</p>
                <p className="text-white/60 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SERVICES ──────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-green-50/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
              <Globe size={14} />خدماتنا الرقمية
            </span>
            <h2 className="text-4xl font-black text-foreground">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">منصة متكاملة لخدمة الطلاب وأعضاء الهيئة على مدار العام الدراسي</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { href: '/complaint', icon: <FileText size={26} className="text-white" />, title: 'تقديم شكوى', desc: 'قدّم شكواك وتابع حالتها خطوة بخطوة حتى الحل', gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-100', tag: 'متاح للجميع' },
              { href: '/ideas', icon: <Lightbulb size={26} className="text-white" />, title: 'صندوق الأفكار', desc: 'شارك أفكارك لتطوير الكلية وصوّت للأفضل', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-100', tag: 'تصويت مباشر' },
              { href: '/events', icon: <Calendar size={26} className="text-white" />, title: 'الفعاليات', desc: 'اطّلع على الفعاليات القادمة وسجّل مشاركتك', gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'تسجيل فوري' },
              { href: '/training', icon: <GraduationCap size={26} className="text-white" />, title: 'الدورات التدريبية', desc: 'طوّر مهاراتك من خلال دوراتنا المتخصصة', gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-50', border: 'border-purple-100', tag: 'شهادات معتمدة' },
              { href: '/news', icon: <Newspaper size={26} className="text-white" />, title: 'الأخبار والإعلانات', desc: 'آخر أخبار الهيئة والكلية والإعلانات المهمة', gradient: 'from-emerald-500 to-green-700', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'محدّث يومياً' },
              { href: '/login', icon: <Shield size={26} className="text-white" />, title: 'لوحة التحكم', desc: 'للأعضاء وقيادة الهيئة — إدارة شاملة بصلاحيات', gradient: 'from-slate-600 to-gray-800', bg: 'bg-slate-50', border: 'border-slate-100', tag: 'أعضاء الهيئة' },
            ].map((card, i) => (
              <Link key={i} to={card.href}
                className={`group relative ${card.bg} ${card.border} border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />
                <div className={`w-13 h-13 bg-gradient-to-br ${card.gradient} rounded-xl p-3 inline-flex mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  {card.icon}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-black text-foreground text-lg">{card.title}</h3>
                  <span className="text-xs bg-white border border-gray-200 text-muted-foreground px-2 py-0.5 rounded-full font-medium shrink-0 mr-2">{card.tag}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{card.desc}</p>
                <div className="flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                  <span>اكتشف المزيد</span><ChevronLeft size={15} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── OFFICES ──────────────── */}
      <section className="py-20 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}>
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-200/30 rounded-full -translate-x-32 -translate-y-32 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-200/30 rounded-full translate-x-32 translate-y-32 blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
              <Users size={14} />مكاتبنا المتخصصة
            </span>
            <h2 className="text-4xl font-black text-foreground">6 مكاتب تخدمك</h2>
            <p className="text-muted-foreground mt-3">كل مكتب متخصص في مجاله لتقديم أفضل الخدمات</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offices.map((office, i) => (
              <div key={i}
                className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden cursor-default">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${office.color} opacity-5 rounded-full translate-x-8 -translate-y-8 group-hover:opacity-10 transition-opacity`} />
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-14 h-14 bg-gradient-to-br ${office.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {office.emoji}
                  </div>
                  <h3 className="font-black text-foreground text-base">{office.name}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{office.desc}</p>
                <div className={`mt-3 h-0.5 w-0 bg-gradient-to-r ${office.color} rounded-full group-hover:w-full transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ANNOUNCEMENTS ──────────────── */}
      {announcements.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-3">
                  <Megaphone size={14} />آخر الأخبار
                </span>
                <h2 className="text-4xl font-black text-foreground">الإعلانات الحديثة</h2>
              </div>
              <Link to="/news" className="hidden sm:flex items-center gap-1.5 text-primary font-semibold hover:gap-2.5 transition-all text-sm">
                عرض الكل <ArrowLeft size={16} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {announcements.map((ann, i) => {
                const cfg = TYPE_CFG[ann.type] || TYPE_CFG.news;
                const isFeatured = i === 0;
                return (
                  <div key={ann.id} className={`${cfg.bg} border rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5 ${isFeatured ? 'lg:col-span-2 lg:row-span-1' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{cfg.emoji}</span>
                      {ann.is_pinned && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">مثبت</span>}
                    </div>
                    <h3 className={`font-black text-foreground leading-snug mb-2 ${isFeatured ? 'text-lg' : 'text-sm'}`}>{ann.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{ann.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{ann.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ann.published_at).toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────── UPCOMING EVENTS ──────────────── */}
      {events.length > 0 && (
        <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-3">
                  <Calendar size={14} />قادمًا قريبًا
                </span>
                <h2 className="text-4xl font-black text-foreground">الفعاليات القادمة</h2>
              </div>
              <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-primary font-semibold hover:gap-2.5 transition-all text-sm">
                جميع الفعاليات <ArrowLeft size={16} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {events.map(ev => {
                const d = new Date(ev.date);
                const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
                return (
                  <div key={ev.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group">
                    <div className="h-3 w-full" style={{ background: 'linear-gradient(90deg, #1a6b3a, #2d9b5a, #4db87a)' }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                          <span className="text-xl font-black leading-none">{d.getDate()}</span>
                          <span className="text-[9px] font-medium">{d.toLocaleDateString('ar-SY', { month: 'short' })}</span>
                        </div>
                        {daysLeft <= 7 && daysLeft >= 0 && (
                          <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold animate-pulse">
                            {daysLeft === 0 ? 'اليوم!' : `بعد ${daysLeft} أيام`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-foreground mb-1 group-hover:text-primary transition-colors">{ev.title}</h3>
                      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{ev.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>📍 {ev.location}</span>
                        <span>👥 {ev.registered_count}/{ev.capacity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────── QR SECTION ──────────────── */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0f3d20, #1a5530)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-3xl p-8 sm:p-10 border border-white/20 flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 relative">
              <div className="absolute inset-0 blur-2xl bg-green-400/20 rounded-2xl scale-110" />
              <div className="relative w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <QrCode size={56} className="text-white" />
              </div>
            </div>
            <div className="text-right flex-1">
              <div className="inline-flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full mb-3">
                <Zap size={12} />خاصية حصرية
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">قدّم شكواك بمسح رمز QR</h2>
              <p className="text-green-200/80 mb-6 leading-relaxed">
                في كل موقع داخل الكلية ستجد رمز QR خاص. امسح الرمز ليتحدد موقعك تلقائياً وتُرسل شكواك مباشرةً للجهة المختصة — بدون تعقيد.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/complaint"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-green-900 transition-all hover:scale-105 active:scale-95 shadow-lg text-sm"
                  style={{ background: 'linear-gradient(135deg, #86efac, #4ade80)' }}>
                  <FileText size={16} />تقديم شكوى الآن
                </Link>
                <Link to="/login" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-sm">
                  <Shield size={16} />دخول الهيئة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── ABOUT ──────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-4">
              <Award size={14} />من نحن
            </span>
            <h2 className="text-4xl font-black text-foreground mb-4">الهيئة الطلابية</h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
              الجسر الرابط بين الطلاب وإدارة الكلية، نعمل على تنظيم الشؤون الطلابية، تنفيذ الفعاليات، معالجة الشكاوى، وتطوير الخدمات المقدمة لجميع طلاب كلية الهندسة الزراعية.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Users size={30} className="text-primary" />, label: 'فريق متكامل', desc: '6 مكاتب متخصصة تعمل بتنسيق كامل', color: 'bg-primary/5 border-primary/15' },
              { icon: <CheckCircle size={30} className="text-emerald-600" />, label: 'خدمة مستمرة', desc: 'دعم طلابي على مدار العام الدراسي', color: 'bg-emerald-50 border-emerald-100' },
              { icon: <TrendingUp size={30} className="text-blue-600" />, label: 'تميّز وإنجاز', desc: 'نسعى دائماً لتقديم الأفضل لطلابنا', color: 'bg-blue-50 border-blue-100' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded-2xl p-6 text-center hover:shadow-md transition-all hover:-translate-y-0.5`}>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {item.icon}
                </div>
                <p className="font-black text-foreground text-lg mb-2">{item.label}</p>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer style={{ background: 'linear-gradient(135deg, #051a0e 0%, #0a2a15 50%, #0f3d20 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png" alt="Logo" className="h-12"
                  style={{ filter: 'brightness(0) invert(1)' }} />
                <div>
                  <p className="text-white font-bold">الهيئة الطلابية</p>
                  <p className="text-green-400 text-xs">كلية الهندسة الزراعية</p>
                </div>
              </div>
              <p className="text-green-300/60 text-sm leading-relaxed">منصة رقمية شاملة لخدمة طلاب كلية الهندسة الزراعية في جامعة حمص.</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">روابط سريعة</h4>
              <div className="space-y-2">
                {[
                  { href: '/news', label: 'الأخبار والإعلانات' },
                  { href: '/events', label: 'الفعاليات' },
                  { href: '/training', label: 'الدورات التدريبية' },
                  { href: '/ideas', label: 'صندوق الأفكار' },
                  { href: '/complaint', label: 'تقديم شكوى' },
                ].map(l => (
                  <Link key={l.href} to={l.href} className="block text-green-300/60 hover:text-green-300 transition-colors text-sm">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Access */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">بوابة الأعضاء</h4>
              <div className="space-y-2">
                <Link to="/login" className="flex items-center gap-2 text-green-300/60 hover:text-green-300 transition-colors text-sm">
                  <Shield size={14} />تسجيل الدخول
                </Link>
                <Link to="/register" className="flex items-center gap-2 text-green-300/60 hover:text-green-300 transition-colors text-sm">
                  <Users size={14} />إنشاء حساب طالب
                </Link>
                <Link to="/setup" className="flex items-center gap-2 text-green-300/30 hover:text-green-300/60 transition-colors text-xs mt-4">
                  إعداد حساب الرئيس
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-green-300/40 text-sm">© 2026 الهيئة الطلابية — كلية الهندسة الزراعية — جامعة حمص</p>
            <p className="text-green-300/30 text-xs">جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
