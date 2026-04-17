import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ChevronDown, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('مرحباً بك في المنصة!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message === 'Invalid login credentials' ? 'البريد أو كلمة المرور غير صحيحة' : error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 gradient-hero opacity-90" />
      <div className="absolute top-20 right-20 w-32 h-32 rounded-full border border-white/10 animate-float" />
      <div className="absolute bottom-20 left-20 w-20 h-20 rounded-full border border-white/10 animate-float-delay" />

      <div className="relative z-10 flex items-center justify-center w-full p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <img
                src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
                alt="Logo" className="h-16 mx-auto drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <h1 className="text-2xl font-black text-white mt-4">مرحباً بك</h1>
            <p className="text-green-300 text-sm mt-1">سجّل دخولك للوصول إلى منصة الهيئة</p>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/25">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@agr-homs.edu.sy" required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-4 py-3 rounded-xl focus:outline-none focus:border-green-400 focus:bg-white/15 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pr-10 pl-10 py-3 rounded-xl focus:outline-none focus:border-green-400 focus:bg-white/15 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-white text-green-800 font-bold py-3.5 rounded-xl hover:bg-green-50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" /> : <><LogIn size={18} />تسجيل الدخول</>}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2 text-center text-sm">
              <Link to="/register" className="text-green-300 hover:text-white transition-colors">
                طالب جديد؟ أنشئ حسابك
              </Link>
              <Link to="/setup" className="text-white/40 hover:text-white/70 text-xs transition-colors">
                إعداد حساب رئيس الهيئة
              </Link>
            </div>
          </div>

          <p className="text-center text-green-300 text-sm mt-6">
            <Link to="/" className="hover:text-white transition-colors">← العودة للموقع الرئيسي</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
