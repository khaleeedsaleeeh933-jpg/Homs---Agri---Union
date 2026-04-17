import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Crown, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';

type Step = 'email' | 'otp' | 'details';

const PresidentSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      toast.success('تم إرسال رمز التحقق');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const complete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || password.length < 6 || !adminCode) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (verifyError) throw verifyError;

      const { data, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { username: name },
      });
      if (updateError) throw updateError;

      if (!data.user) throw new Error('لم يتم إنشاء المستخدم');

      await supabase.from('user_profiles').update({ username: name, phone: phone || null }).eq('id', data.user.id);

      const { data: result, error: rpcError } = await supabase.rpc('setup_president', {
        p_user_id: data.user.id,
        p_admin_code: adminCode,
      });

      if (rpcError) throw rpcError;
      if (!result) throw new Error('رمز الإدارة غير صحيح أو يوجد رئيس مسجل بالفعل');

      toast.success('تم إنشاء حساب رئيس الهيئة بنجاح!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 gradient-hero opacity-95" />
      <div className="relative z-10 flex items-center justify-center w-full p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <img src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
                alt="Logo" className="h-16 mx-auto drop-shadow-2xl" style={{ filter: 'brightness(0) invert(1)' }} />
            </Link>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Crown size={20} className="text-yellow-400" />
              <h1 className="text-2xl font-black text-white">إعداد حساب الرئيس</h1>
            </div>
            <p className="text-green-300 text-sm mt-1">هذه الصفحة لإنشاء حساب رئيس الهيئة فقط</p>
          </div>

          <div className="glass rounded-3xl p-6 border border-yellow-400/30">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-xl border border-yellow-400/20 mb-5">
              <Shield size={16} className="text-yellow-400" />
              <p className="text-yellow-300 text-xs">يتطلب رمز الإدارة الخاص. تواصل مع المشرف التقني للحصول عليه.</p>
            </div>

            {step === 'email' && (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">البريد الإلكتروني للرئيس</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="president@agr-homs.edu.sy" required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-yellow-400 text-green-900 font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <div className="w-5 h-5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : 'إرسال رمز التحقق'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); setStep('details'); }} className="space-y-4">
                <p className="text-white/80 text-sm text-center">أدخل رمز التحقق المُرسَل إلى <span className="text-yellow-300">{email}</span></p>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="0000" maxLength={6}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-4 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-yellow-400"
                  dir="ltr" />
                <button type="submit" disabled={otp.length < 4}
                  className="w-full bg-yellow-400 text-green-900 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">تأكيد</button>
              </form>
            )}

            {step === 'details' && (
              <form onSubmit={complete} className="space-y-3">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل *" required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-400 text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف" type="tel"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-400 text-sm" dir="ltr" />
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="كلمة المرور (6 أحرف+)" required minLength={6}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-400 text-sm pl-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="رمز الإدارة السري *" required
                  className="w-full bg-white/10 border border-yellow-400/30 text-white placeholder:text-white/40 px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-400 text-sm" />
                <button type="submit" disabled={loading}
                  className="w-full bg-yellow-400 text-green-900 font-bold py-3.5 rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <><Crown size={18} />إنشاء حساب الرئيس</>}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-green-300/60 text-xs mt-4">رمز الإدارة: AGHOMS2024</p>
          <p className="text-center mt-3"><Link to="/login" className="text-green-300 text-sm hover:text-white">← تسجيل الدخول</Link></p>
        </div>
      </div>
    </div>
  );
};

export default PresidentSetup;
