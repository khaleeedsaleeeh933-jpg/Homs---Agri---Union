import { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar, MapPin, GraduationCap, Clock, Users, Newspaper, Pin, ImagePlus, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  type: 'events' | 'training' | 'news';
}

const ImageUploader = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('فشل رفع الصورة: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        onChange(urlData.publicUrl);
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error('فشل الحصول على رابط الصورة');
      }
    } catch (err) {
      console.error('Upload catch error:', err);
      toast.error('حدث خطأ غير متوقع أثناء الرفع');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl transition-all ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {value ? (
        <div className="relative p-2">
          <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="absolute top-4 left-4 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 cursor-pointer">
          {uploading ? (
            <Loader2 size={28} className="text-primary animate-spin mb-2" />
          ) : (
            <ImagePlus size={28} className="text-gray-400 mb-2" />
          )}
          <p className="text-xs text-gray-500 text-center">{uploading ? 'جاري الرفع...' : placeholder}</p>
          <p className="text-xs text-gray-400 mt-1">اسحب الصورة هنا أو انقر للاختيار</p>
        </div>
      )}
    </div>
  );
};

const EventsTrainingDashboardPage = ({ type }: Props) => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const tableName = type === 'events' ? 'events' : type === 'training' ? 'training_courses' : 'announcements';

  const fetchItems = async () => {
    const orderField = type === 'events' ? 'date' : type === 'training' ? 'created_at' : 'published_at';
    const { data } = await supabase.from(tableName).select('*').order(orderField, { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [type]);

  const handleCreate = async () => {
    setSaving(true);
    let insertData: Record<string, any> = { ...form };
    if (type === 'events') {
      insertData = { title: form.title, description: form.description || '', date: form.date, location: form.location, capacity: parseInt(form.capacity) || 100, organizer: form.organizer || profile?.username || '', status: 'upcoming', registered_count: 0, created_by: user?.id, image_url: form.image_url || null };
    } else if (type === 'training') {
      insertData = { title: form.title, description: form.description || '', trainer: form.trainer, duration: form.duration || null, schedule: form.schedule || null, capacity: parseInt(form.capacity) || 30, category: form.category || 'general', status: 'upcoming', enrolled_count: 0, created_by: user?.id, image_url: form.image_url || null };
    } else {
      insertData = { title: form.title, content: form.content, type: form.type || 'news', is_pinned: form.is_pinned || false, author: profile?.username || '', author_id: user?.id };
    }
    const { data, error } = await supabase.from(tableName).insert(insertData).select().single();
    if (!error && data) {
      setItems(prev => [data, ...prev]);
      setShowModal(false);
      setForm({});
      toast.success('تمت الإضافة بنجاح');
    } else { toast.error('فشلت العملية: ' + error?.message); }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (!error) { setItems(prev => prev.filter(i => i.id !== id)); toast.success('تم الحذف'); }
  };

  const canManage = ['president', 'vice_president', 'office_head'].includes(profile?.role || '');

  const titles: Record<string, string> = { events: 'الفعاليات', training: 'دورات التدريب', news: 'الأخبار والإعلانات' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">{titles[type]}</h1>
          <p className="text-muted-foreground text-sm">{items.length} عنصر</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />إضافة
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="glass-card-light rounded-2xl p-4 border border-gray-100 relative group hover:shadow-md transition-all">
              {canManage && (
                <button onClick={() => deleteItem(item.id)} className="absolute top-3 left-3 p-1 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">
                  <X size={14} />
                </button>
              )}
              {type === 'events' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-xs status-badge status-new">{item.status === 'upcoming' ? 'قادمة' : item.status === 'ongoing' ? 'جارية' : 'منتهية'}</span>
                  </div>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded-xl mb-2" />
                  )}
                  <h3 className="font-bold text-foreground mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1"><Calendar size={10} />{new Date(item.date).toLocaleDateString('ar-SY')}</div>
                    <div className="flex items-center gap-1"><MapPin size={10} />{item.location}</div>
                    <div className="flex items-center gap-1"><Users size={10} />{item.registered_count}/{item.capacity}</div>
                  </div>
                </>
              )}
              {type === 'training' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap size={16} className="text-primary" />
                    <span className="text-xs status-badge status-new">{item.status === 'upcoming' ? 'قادمة' : item.status === 'ongoing' ? 'جارية' : 'منتهية'}</span>
                  </div>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded-xl mb-2" />
                  )}
                  <h3 className="font-bold text-foreground mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{item.trainer}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {item.duration && <div className="flex items-center gap-1"><Clock size={10} />{item.duration}</div>}
                    <div className="flex items-center gap-1"><Users size={10} />{item.enrolled_count}/{item.capacity}</div>
                  </div>
                </>
              )}
              {type === 'news' && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.type === 'alert' ? '🔔' : item.type === 'announcement' ? '📢' : '📰'}</span>
                    {item.is_pinned && <Pin size={12} className="text-primary" />}
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.author} · {new Date(item.published_at).toLocaleDateString('ar-SY')}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">إضافة {titles[type]}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="العنوان *"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {type !== 'news' ? (
                <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="الوصف" rows={2}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              ) : (
                <textarea value={form.content || ''} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="المحتوى *" rows={3}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              )}
              {type === 'events' && (
                <>
                  <input type="datetime-local" value={form.date || ''} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="الموقع *"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={form.organizer || ''} onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))} placeholder="المنظم"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="number" value={form.capacity || ''} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="السعة"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <ImageUploader value={form.image_url || ''} onChange={(v) => setForm(p => ({ ...p, image_url: v }))} placeholder="صورة الفعالية" />
                </>
              )}
              {type === 'training' && (
                <>
                  <input value={form.trainer || ''} onChange={e => setForm(p => ({ ...p, trainer: e.target.value }))} placeholder="اسم المدرب *"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={form.duration || ''} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="المدة (مثال: 10 ساعات)"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={form.schedule || ''} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} placeholder="جدول المحاضرات"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input type="number" value={form.capacity || ''} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="السعة القصوى"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <ImageUploader value={form.image_url || ''} onChange={(v) => setForm(p => ({ ...p, image_url: v }))} placeholder="صورة الدورة" />
                </>
              )}
              {type === 'news' && (
                <div className="flex gap-3">
                  <select value={form.type || 'news'} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
                    <option value="news">خبر</option>
                    <option value="announcement">إعلان</option>
                    <option value="alert">تنبيه</option>
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_pinned || false} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} />
                    <span className="text-sm text-muted-foreground">تثبيت</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'إضافة'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-semibold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsTrainingDashboardPage;
