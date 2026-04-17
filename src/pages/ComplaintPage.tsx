import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, User, Phone, ChevronDown, EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const COMPLAINT_TYPES = ['بنية تحتية', 'خدمات طلابية', 'إدارية', 'أكاديمية', 'اجتماعية', 'أخرى'];
const LOCATIONS = ['مبنى A', 'مبنى B', 'المدرج الكبير', 'المكتبة', 'المختبرات', 'الساحة الرئيسية', 'مكتب القبول', 'القسم الطبي', 'أخرى'];

const ComplaintPage = () => {
  const { qrCode } = useParams();
  const [form, setForm] = useState({
    title: '', description: '', type: COMPLAINT_TYPES[0], location: qrCode ? qrCode.replace(/-/g, ' ') : '',
    submitter_name: '', submitter_phone: '',
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('يرجى ملء العنوان والوصف'); return; }
    setSubmitting(true);

    const { data, error } = await supabase.from('complaints').insert({
      title: form.title,
      description: form.description,
      type: form.type,
      location: form.location || null,
      submitter_name: form.submitter_name || null,
      submitter_phone: form.submitter_phone || null,
      qr_source: qrCode || null,
      status: 'new',
    }).select('id').single();

    if (!error && data) {
      setComplaintId(data.id);
      setSubmitted(true);
      toast.success('تم إرسال شكواك بنجاح!');
    } else {
      toast.error('فشل إرسال الشكوى. حاول مرة أخرى.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 px-4 max-w-md mx-auto flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Send size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">تم إرسال شكواك!</h1>
            <p className="text-muted-foreground mb-6">سيتم النظر في شكواك والرد عليها في أقرب وقت ممكن</p>
            <div className="glass-card-light rounded-2xl p-4 border border-primary/20 mb-6">
              <p className="text-xs text-muted-foreground">رقم الشكوى</p>
              <p className="font-mono font-bold text-primary text-sm mt-1" dir="ltr">{complaintId.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">احتفظ بهذا الرقم لمتابعة شكواك</p>
            </div>
            <button onClick={() => { setSubmitted(false); setIsAnonymous(false); setForm({ title: '', description: '', type: COMPLAINT_TYPES[0], location: '', submitter_name: '', submitter_phone: '' }); }}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              تقديم شكوى أخرى
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Send size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground">تقديم شكوى</h1>
          <p className="text-muted-foreground mt-2">شكواك تُسمع وتُعالج باحترافية</p>
          {qrCode && <p className="mt-2 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">📍 الموقع: {form.location}</p>}
        </div>

        <form onSubmit={handleSubmit} className="glass-card-light rounded-2xl p-6 border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">عنوان الشكوى *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="وصف مختصر للمشكلة" required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">وصف تفصيلي *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="اشرح المشكلة بالتفصيل..." required rows={4}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">نوع الشكوى</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">الموقع</label>
              <select value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">— اختر الموقع —</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">بياناتك (اختياري)</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) {
                      setForm(p => ({ ...p, submitter_name: '', submitter_phone: '' }));
                    }
                  }}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <EyeOff size={14} /> تقديم كمجهول
                </span>
              </label>
            </div>
            {!isAnonymous && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={form.submitter_name} onChange={e => setForm(p => ({ ...p, submitter_name: e.target.value }))} placeholder="اسمك"
                    className="w-full border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="relative">
                  <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={form.submitter_phone} onChange={e => setForm(p => ({ ...p, submitter_phone: e.target.value }))} placeholder="رقم التواصل" type="tel"
                    className="w-full border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 mt-2 text-base shadow-lg">
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} />إرسال الشكوى</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintPage;
