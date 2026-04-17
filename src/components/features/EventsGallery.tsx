import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  trainer?: string;
  image_url: string;
  type: 'event' | 'training';
}

const EventsGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [api, setApi] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchGalleryItems = async () => {
      const [eventsRes, trainingRes] = await Promise.all([
        supabase.from('events').select('id, title, description, date, location, image_url').neq('image_url', '').neq('image_url', null),
        supabase.from('training_courses').select('id, title, description, trainer, image_url').neq('image_url', '').neq('image_url', null),
      ]);

      const galleryItems: GalleryItem[] = [];

      if (eventsRes.data) {
        eventsRes.data.forEach((e: any) => {
          galleryItems.push({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.date,
            location: e.location,
            image_url: e.image_url,
            type: 'event',
          });
        });
      }

      if (trainingRes.data) {
        trainingRes.data.forEach((t: any) => {
          galleryItems.push({
            id: t.id,
            title: t.title,
            description: t.description,
            trainer: t.trainer,
            image_url: t.image_url,
            type: 'training',
          });
        });
      }

      setItems(galleryItems);
      setLoading(false);
    };

    fetchGalleryItems();
  }, []);

  useEffect(() => {
    if (!api || items.length === 0) return;

    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        api.scrollNext();
      }, 4000);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });

    startInterval();

    return () => stopInterval();
  }, [api, items.length]);

  const handleManualNavigation = (direction: 'prev' | 'next') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (direction === 'prev') api?.scrollPrev();
    else api?.scrollNext();
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        api?.scrollNext();
      }, 4000);
    }, 100);
  };

  if (loading || items.length === 0) return null;

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a2314 0%, #0f3d20 50%, #1a5530 100%)' }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="max-w-6xl mx-auto px-4 py-10 relative">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 border border-green-400/20 px-4 py-1.5 rounded-full mb-3">
            <Calendar size={14} />فعالياتنا وتدريباتنا
          </span>
          <h2 className="text-3xl font-black text-white">لوحة الصور</h2>
        </div>

        <div className="relative">
          <Carousel
            opts={{ loop: true, align: 'center' }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={`${item.type}-${item.id}`} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="relative group rounded-2xl overflow-hidden h-72 shadow-2xl mx-2">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.type === 'event' ? (
                          <span className="bg-blue-500/80 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar size={10} />فعالية
                          </span>
                        ) : (
                          <span className="bg-purple-500/80 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <GraduationCap size={10} />تدريب
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-white text-lg mb-1 leading-tight">{item.title}</h3>
                      <p className="text-white/70 text-xs line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex items-center gap-3 text-white/60 text-xs">
                        {item.date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(item.date).toLocaleDateString('ar-SY', { month: 'long', day: 'numeric' })}
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />{item.location}
                          </span>
                        )}
                        {item.trainer && (
                          <span className="flex items-center gap-1">
                            <GraduationCap size={10} />{item.trainer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <button
              onClick={() => handleManualNavigation('prev')}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center z-10"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => handleManualNavigation('next')}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center justify-center z-10"
            >
              <ChevronLeft size={20} />
            </button>
          </Carousel>

          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    api?.scrollTo(i);
                    intervalRef.current = setInterval(() => {
                      api?.scrollNext();
                    }, 4000);
                  }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-green-400 w-8' : 'bg-white/30 hover:bg-white/50 w-2.5'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsGallery;