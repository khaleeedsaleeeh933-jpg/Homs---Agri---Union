import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';

type Step = 'email' | 'otp' | 'details';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      toast.success('تم إرسال رمز التحقق إلى بريدك');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('يرجى إدخال اسمك'); return; }
    if (password.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (verifyError) throw verifyError;

      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { username: name },
      });
      if (updateError) throw updateError;

      if (data.user) {
        await supabase.from('user_profiles').update({ username: name, phone: phone || null }).eq('id', data.user.id);
      }

      toast.success('تم إنشاء حسابك بنجاح!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message === 'Token has expired or is invalid' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <div className="relative z-10 flex items-center justify-center w-full p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <img src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
                alt="Logo" className="h-16 mx-auto drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                style={{ filter: 'brightness(0) invert(1)' }} />
            </Link>
            <h1 className="text-2xl font-black text-white mt-4">تسجيل طالب جديد</h1>
            <p className="text-green-300 text-sm mt-1">أنشئ حسابك للتفاعل مع الهيئة الطلابية</p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {['البريد', 'التحقق', 'البيانات'].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  (step === 'email' && i === 0) || (step === 'otp' && i === 1) || (step === 'details' && i === 2)
                    ? 'bg-white text-green-800'
                    : (step === 'otp' && i === 0) || (step === 'details' && i <= 1)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white'
                }`}>{i + 1}</div>
                <span className="text-white/70 text-xs hidden sm:block">{s}</span>
                {i < 2 && <div className="w-8 h-0.5 bg-white/20 mx-1" />}
              </div>
            ))}
          </div>

          <div className="glass rounded-3xl p-6 border border-white/25">
            {step === 'email' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="example@email.com" required
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-4 py-3 rounded-xl focus:outline-none focus:border-green-400 text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-white text-green-800 font-bold py-3.5 rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <div className="w-5 h-5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : 'إرسال رمز التحقق'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); setStep('details'); }} className="space-y-4">
                <p className="text-white/80 text-sm text-center mb-2">أدخل الرمز المكون من 4 أرقام المُرسَل إلى <span className="text-green-300">{email}</span></p>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="0000" maxLength={6}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-4 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-green-400"
                  dir="ltr" />
                <button type="submit" disabled={otp.length < 4}
                  className="w-full bg-white text-green-800 font-bold py-3.5 rounded-xl hover:bg-green-50 transition-all disabled:opacity-50">
                  تأكيد الرمز
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full text-white/60 text-sm hover:text-white">← تغيير البريد</button>
              </form>
            )}

            {step === 'details' && (
              <form onSubmit={verifyAndComplete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">الاسم الكامل *</label>
                  <div className="relative">
                    <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" required
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-4 py-3 rounded-xl focus:outline-none focus:border-green-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">رقم الهاتف (اختياري)</label>
                  <div className="relative">
                    <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" type="tel"
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-4 py-3 rounded-xl focus:outline-none focus:border-green-400 text-sm" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">كلمة المرور *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل" required minLength={6}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-10 py-3 rounded-xl focus:outline-none focus:border-green-400 text-sm" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-white text-green-800 font-bold py-3.5 rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <div className="w-5 h-5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <><UserPlus size={18} />إنشاء الحساب</>}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-green-300 text-sm mt-6">
            لديك حساب؟ <Link to="/login" className="text-white font-semibold hover:underline">سجّل دخولك</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
