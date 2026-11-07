import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../lib/utils';
import { AnimatedPage } from '../components/layout/AnimatedPage';

interface Partenaire {
  nom: string;
  logo_url: string;
  lien?: string;
}

export default function Partenaires() {
  const { data: partenaires = [], isLoading } = useQuery({
    queryKey: ['publicPartenaires'],
    queryFn: async () => {
      const response = await api.get('/pages/home');
      const raw = response.data?.success ? response.data.data?.partenaires : null;
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed as Partenaire[] : [];
      } catch {
        return [];
      }
    },
  });

  return (
    <AnimatedPage className="bg-[#07111d] min-h-screen">
      <main className="relative isolate overflow-hidden pt-32 pb-24">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=2200&auto=format&fit=crop')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[#07111d]/90" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[#07111d]/45" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <p className="text-red-300 text-xs uppercase tracking-[0.35em] mb-5 font-semibold">Écosystème MACOF</p>
            <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-7">
              Nos <span className="italic text-white/50">Partenaires</span>
            </h1>
            <div className="mx-auto mb-7 h-px w-16 bg-red-300/70" />
            <p className="text-white/70 text-lg font-light leading-relaxed">
              Des collaborations durables avec des acteurs qui partagent notre exigence d'excellence.
            </p>
          </motion.header>

          {isLoading ? (
            <div className="py-20 text-center text-white/50">Chargement des partenaires...</div>
          ) : partenaires.length === 0 ? (
            <div className="border border-white/15 bg-[#07111d]/70 py-20 px-6 text-center text-white/50 backdrop-blur-sm">
              Aucun partenaire publié pour le moment.
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="flex gap-5 overflow-x-auto pb-5 snap-x snap-mandatory [scrollbar-color:rgba(255,255,255,0.25)_transparent]"
            >
              {partenaires.map((partenaire, index) => (
                <motion.article
                  key={`${partenaire.nom}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  whileHover={{ y: -5, borderColor: 'rgba(252, 165, 165, 0.55)' }}
                  className="min-w-[220px] min-h-40 snap-start border border-white/15 bg-[#07111d]/75 p-8 flex flex-col items-center justify-center gap-5 backdrop-blur-sm transition-colors"
                >
                  {partenaire.lien ? (
                    <a href={partenaire.lien} target="_blank" rel="noopener noreferrer" aria-label={`Visiter le site de ${partenaire.nom}`}>
                      <img
                        src={getImageUrl(partenaire.logo_url)}
                        alt={partenaire.nom}
                        className="max-h-20 max-w-full object-contain"
                        onError={(event) => { event.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                      />
                    </a>
                  ) : (
                    <img
                      src={getImageUrl(partenaire.logo_url)}
                      alt={partenaire.nom}
                      className="max-h-20 max-w-full object-contain"
                      onError={(event) => { event.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                  )}
                  <h2 className="text-white/75 text-sm text-center tracking-wide">{partenaire.nom}</h2>
                </motion.article>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <Link to="/contact" className="inline-flex border border-white/60 px-6 py-3 text-white text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#07111d] transition-colors">
              Devenir partenaire
            </Link>
          </motion.div>
        </div>
      </main>
    </AnimatedPage>
  );
}