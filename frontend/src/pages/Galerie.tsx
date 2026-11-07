import { useEffect, useState } from 'react';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { X, ZoomIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { getImageUrl as resolveImageUrl } from '@/lib/utils';
import { Link } from 'react-router-dom';



// Helper pour gérer les URLs relatives et absolues d'images
const FILIALE_PAGES = [
  { slug: 'restauration', nom: 'SEBA International' },
  { slug: 'immobilier', nom: 'MACOF Immobilier SARL' },
  { slug: 'fishing', nom: 'MACOF Fishing SARL' },
  { slug: 'transit', nom: 'MACOF Transit SARL' },
  { slug: 'print', nom: 'MACOF Print & Com SARL' },
  { slug: 'mining', nom: 'MACOF Mining SARL' },
];

export default function Galerie() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const { data: images = [] } = useQuery({
    queryKey: ['galerieData'],
    queryFn: async () => {
      try {
        const res = await api.get('/galerie?limit=100');
        const items = res.data?.success && Array.isArray(res.data.data?.items)
          ? res.data.data.items
          : [];
        return items;
      } catch (err) {
        console.warn("API Error galerie");
      }
      return [];
    },
    
  });

  const filteredImages = activeFilter === "Tous"
    ? images
    : images.filter((img: any) => (img.filiale_nom || img.filiale) === activeFilter);
  const filialNames = images.map((img: any) => String(img.filiale_nom || img.filiale || '')).filter(Boolean) as string[];
  const filters: string[] = ["Tous", ...Array.from(new Set<string>(filialNames))];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage !== null) {
        setSelectedImage(null);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  return (
    <AnimatedPage className="bg-[#050505] min-h-screen">
      <div className="pt-32 pb-24">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          
          <div className="mb-20 text-center">
            <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-6 tracking-tight">
              Nos <span className="italic text-white/50">Réalisations</span>
            </h1>
            <p className="text-white/60 font-sans font-light max-w-2xl mx-auto leading-relaxed text-lg">
              Une sélection visuelle illustrant l'excellence opérationnelle de MACOF Holding à travers ses six pôles d'expertise.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/restauration#menu-commande" className="inline-flex px-6 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] hover:bg-red-200 transition-colors">
                Découvrir le menu SEBA
              </Link>
              <Link to="/restauration" className="inline-flex px-6 py-3 border border-white/20 bg-white/5 text-white text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors">
                Voir la page Restauration
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-16">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2.5 text-xs font-sans tracking-[0.2em] uppercase transition-all duration-500 rounded-full border ${
                  activeFilter === f
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 text-white/70 hover:border-white/40 hover:text-white bg-white/[0.02]'
                }`}
              >
                {f.replace('MACOF ', '')}
              </button>
            ))}
          </div>

          {/* Grille Asymétrique avec Framer Motion */}
          <motion.div 
            layout
            className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            <AnimatePresence>
              {filteredImages.map((img: any, index: number) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                  key={img.id || index} 
                  className="break-inside-avoid relative group overflow-hidden bg-black/50 cursor-pointer rounded-sm"
                  onClick={() => setSelectedImage(img)}
                >
                  <div className="aspect-auto overflow-hidden">
                    <img
                      src={resolveImageUrl(img.image_path)}
                      alt={img.titre} 
                      className="w-full h-auto object-cover filter grayscale-[30%] group-hover:grayscale-0 transform group-hover:scale-110 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <span className="text-white/70 font-sans text-xs tracking-widest uppercase mb-3 block font-semibold">{img.filiale_nom || img.filiale}</span>
                      <h3 className="text-white font-serif text-2xl mb-2">{img.titre}</h3>
                      <div className="flex items-center gap-2 text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <ZoomIn size={16} /> <span>Agrandir</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Lightbox / Modal (Framer Motion) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-12"
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedImage(null); document.body.style.overflow = ''; } }}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-50 p-2 rounded-full hover:bg-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} strokeWidth={1} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-7xl w-full h-full flex flex-col items-center justify-center relative"
            >
              <img
                src={resolveImageUrl(selectedImage.image_path)}
                alt={selectedImage.titre}
                className="max-h-[75vh] w-auto object-contain shadow-2xl"
              />
              <div className="mt-8 text-center bg-black/40 px-8 py-6 rounded-lg backdrop-blur-md max-w-2xl w-full border border-white/10">
                <span className="text-white/50 font-sans text-xs tracking-[0.3em] uppercase block mb-3 font-semibold">{selectedImage.filiale_nom || selectedImage.filiale}</span>
                <h3 className="text-3xl font-serif text-white mb-4">{selectedImage.titre}</h3>
                <p className="text-white/80 font-light font-sans text-lg">{selectedImage.description_courte || selectedImage.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
