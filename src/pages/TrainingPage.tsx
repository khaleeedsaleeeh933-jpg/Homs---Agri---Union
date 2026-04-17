import { useState, useEffect } from 'react';
import { GraduationCap, Clock, Users, BookOpen, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { TrainingCourse } from '@/types/database';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'قادمة', cls: 'status-new' },
  ongoing: { label: 'جارية', cls: 'status-processing' },
  completed: { label: 'منتهية', cls: 'status-closed' },
};

const TrainingPage = () => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const fetchCourses = async () => {
    const { data } = await supabase.from('training_courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data as TrainingCourse[]);
    if (user) {
      const { data: enrolls } = await supabase.from('training_enrollments').select('course_id').eq('user_id', user.id);
      if (enrolls) setEnrolledIds(new Set(enrolls.map((e: any) => e.course_id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const filtered = courses.filter(c => filter === 'all' || c.status === filter);

  const handleEnroll = async (course: TrainingCourse) => {
    if (!user || !profile) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    if (enrolledIds.has(course.id)) {
      await supabase.from('training_enrollments').delete().eq('course_id', course.id).eq('user_id', user.id);
      await supabase.from('training_courses').update({ enrolled_count: Math.max(0, course.enrolled_count - 1) }).eq('id', course.id);
      setEnrolledIds(prev => { const s = new Set(prev); s.delete(course.id); return s; });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, enrolled_count: Math.max(0, c.enrolled_count - 1) } : c));
      toast.info('تم إلغاء تسجيلك');
    } else {
      const { error } = await supabase.from('training_enrollments').insert({ course_id: course.id, user_id: user.id });
      if (!error) {
        await supabase.from('training_courses').update({ enrolled_count: course.enrolled_count + 1 }).eq('id', course.id);
        setEnrolledIds(prev => new Set([...prev, course.id]));
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, enrolled_count: c.enrolled_count + 1 } : c));
        toast.success('تم تسجيلك في الدورة!');
      } else { toast.error('فشل التسجيل'); }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">التدريب والدورات</h1>
          <p className="text-muted-foreground mt-2">طوّر مهاراتك مع دورات الهيئة الطلابية</p>
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
            {filtered.map(course => (
              <div key={course.id} className="glass-card-light rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                  {course.image_url ? (
                    <img src={course.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap size={48} className="text-primary/30" />
                  )}
                  <span className={`absolute top-3 right-3 status-badge ${STATUS_MAP[course.status]?.cls}`}>{STATUS_MAP[course.status]?.label}</span>
                  {enrolledIds.has(course.id) && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">مسجّل ✓</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-2">{course.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-2"><BookOpen size={11} className="text-primary" />المدرب: {course.trainer}</div>
                    {course.duration && <div className="flex items-center gap-2"><Clock size={11} className="text-primary" />{course.duration}</div>}
                    {course.schedule && <div className="flex items-center gap-2"><Clock size={11} className="text-primary" />{course.schedule}</div>}
                    <div className="flex items-center gap-2"><Users size={11} className="text-primary" />{course.enrolled_count}/{course.capacity} مسجل</div>
                  </div>
                  <div className="mb-3 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min((course.enrolled_count / course.capacity) * 100, 100)}%` }} />
                  </div>
                  {course.status !== 'completed' && course.enrolled_count < course.capacity ? (
                    <button onClick={() => handleEnroll(course)}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${enrolledIds.has(course.id) ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary text-white hover:bg-primary/90'}`}>
                      <CheckCircle size={15} />{enrolledIds.has(course.id) ? 'إلغاء التسجيل' : 'سجّل الآن'}
                    </button>
                  ) : (
                    <div className="text-center py-2 text-xs text-muted-foreground">{course.status === 'completed' ? 'الدورة منتهية' : 'الأماكن مكتملة'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد دورات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingPage;
