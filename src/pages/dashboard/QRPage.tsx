import { useState, useEffect } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LOCATIONS = [
  { id: 'building-a', name: 'مبنى A', emoji: '🏫' },
  { id: 'building-b', name: 'مبنى B', emoji: '🏛' },
  { id: 'library', name: 'المكتبة', emoji: '📚' },
  { id: 'labs', name: 'المختبرات', emoji: '🔬' },
  { id: 'main-hall', name: 'المدرج الكبير', emoji: '🎓' },
  { id: 'main-square', name: 'الساحة الرئيسية', emoji: '🌿' },
  { id: 'admission', name: 'مكتب القبول', emoji: '📋' },
  { id: 'medical', name: 'القسم الطبي', emoji: '🏥' },
];

const QRPage = () => {
  const { profile } = useAuth();
  const [selected, setSelected] = useState(LOCATIONS[0]);
  const baseUrl = window.location.origin;

  const getQrUrl = (locationId: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${baseUrl}/complaint/${locationId}`)}&format=png&color=1a5c35&bgcolor=ffffff&qzone=2`;
  };

  const canAccess = profile?.role === 'president' || profile?.role === 'vice_president';

  if (!canAccess) {
    return <div className="text-center py-20 text-muted-foreground">ليس لديك صلاحية الوصول</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-foreground">رموز QR</h1>
        <p className="text-muted-foreground text-sm">أنشئ وطبع رموز QR لكل موقع في الكلية</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LOCATIONS.map(loc => (
          <button key={loc.id} onClick={() => setSelected(loc)}
            className={`glass-card-light rounded-2xl p-4 border text-right transition-all hover:shadow-md hover:-translate-y-0.5 ${selected.id === loc.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}>
            <p className="text-2xl mb-2">{loc.emoji}</p>
            <p className="font-semibold text-foreground text-sm">{loc.name}</p>
          </button>
        ))}
      </div>

      <div className="glass-card-light rounded-2xl p-6 border border-gray-100 max-w-sm mx-auto text-center">
        <h2 className="font-bold text-foreground mb-1">{selected.emoji} {selected.name}</h2>
        <p className="text-xs text-muted-foreground mb-4">امسح هذا الرمز للإبلاغ عن مشكلة في هذا الموقع</p>

        <div className="bg-white p-4 rounded-2xl inline-block shadow-inner border border-gray-100 mb-4">
          <img
            src={getQrUrl(selected.id)}
            alt={`QR ${selected.name}`}
            className="w-48 h-48"
          />
        </div>

        <p className="text-xs text-muted-foreground font-mono mb-4 bg-gray-50 px-3 py-2 rounded-xl break-all" dir="ltr">
          {`${baseUrl}/complaint/${selected.id}`}
        </p>

        <div className="flex gap-3 justify-center">
          <a href={getQrUrl(selected.id)} download={`qr-${selected.id}.png`} target="_blank"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Download size={16} />تحميل
          </a>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
            <Printer size={16} />طباعة
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRPage;
