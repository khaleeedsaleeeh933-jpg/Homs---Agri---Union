import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center gradient-hero">
    <div className="text-center text-white">
      <img
        src="https://cdn-ai.onspace.ai/onspace/files/bYnsQXvSqbEkK3zXYr7hdi/Logo.png"
        className="h-16 mx-auto mb-6 opacity-80"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
      <h1 className="text-6xl font-black mb-4">404</h1>
      <p className="text-green-300 text-lg mb-8">الصفحة التي تبحث عنها غير موجودة</p>
      <Link to="/" className="flex items-center gap-2 bg-white text-green-800 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-colors mx-auto w-fit">
        <Home size={18} />العودة للرئيسية
      </Link>
    </div>
  </div>
);

export default NotFound;
