import { useEffect, useRef, useState } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE, parseServices } from '../../lib/utils';
import { api } from '@/lib/api';
import PublicMenu from '../../components/restauration/PublicMenu';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'restauration';

const fallbackContent: Record<string, string> = {
  hero_title: 'SEBA International',
  hero_subtitle: "Domaine d'Excellence 02",
  hero_desc: "L'art culinaire porté à son paroxysme. Service traiteur, restauration collective et l'excellence SEBA International.",
  hero_bg: '/plaquette-resto.jpeg',
  vision_title: 'Notre Philosophie',
  vision_text_1: "SEBA International s'impose comme une référence incontournable de la gastronomie et du service traiteur en Guinée. À travers notre marque phare SEBA International, nous offrons une expérience culinaire raffinée et mémorable.",
  vision_text_2: "Nos chefs élaborent des cartes qui allient les saveurs locales authentiques aux standards de la haute gastronomie internationale, garantissant une prestation sur-mesure pour chaque occasion.",
  stat_1_value: '5K+',
  stat_1_label: 'Repas/Jour',
  stat_2_value: '1er',
  stat_2_label: 'Traiteur B2B',
  contact_email: 'restauration@macofholding.com',
  contact_phone: '+224 621 00 00 00',
};

const fallbackServices = [
  { title: "SEBA International", desc: "Notre fleuron gastronomique. Restauration de luxe, salons VIP et expériences culinaires exclusives.", icon: "" },
  { title: "Traiteur Événementiel", desc: "Buffets, dîners de gala, cocktails d'entreprise et mariages. Une prestation clé en main.", icon: "" },
  { title: "Restauration Collective", desc: "Gestion de cantines d'entreprises, bases-vie minières et institutions avec rigueur et constance.", icon: "" },
];

export default function Restauration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [realisations, setRealisations] = useState<any[]>([]);

  // Fetch page content and filiale data
  useEffect(() => {
    Promise.all([
      api.get(`/pages/${SLUG}`).catch(() => null),
    ]).then(([pagesRes]) => {
      if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
      else setContent(fallbackContent);
    });
  }, []);

  // Polling every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      Promise.all([
        api.get(`/pages/${SLUG}`).catch(() => null),
      ]).then(([pagesRes]) => {
        if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
      });
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const fetchRealisations = async () => {
      try {
        const response = await api.get('/galerie?filiale=restauration&limit=100');
        if (response.data?.success && Array.isArray(response.data.data?.items)) {
          setRealisations(response.data.data.items);
        }
      } catch (error) {
        console.warn('Erreur chargement des réalisations SEBA:', error);
      }
    };

    fetchRealisations();
  }, []);


  const configuredServices = parseServices(content?.services);
  const services = configuredServices.length > 0 ? configuredServices : fallbackServices;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".header-img", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".header-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
      gsap.utils.toArray(".reveal-up").forEach((el: any) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-background">
      <div ref={containerRef}>
        {/* Header Filiale */}
        <section className="header-section relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-blue-900/40 to-background z-10" />
            <img
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)}
              alt="Restaurant gastronomique de luxe"
              className="header-img w-full h-[120%] object-cover -top-[10%] absolute opacity-80"
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20">
            <p className="text-white text-xs uppercase tracking-[0.4em] font-sans mb-6 reveal-up">{content?.hero_subtitle || fallbackContent.hero_subtitle}</p>
            <h1 className="text-7xl md:text-9xl font-serif text-white mb-8 font-light leading-none reveal-up">
              {content?.hero_title || fallbackContent.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-light font-sans max-w-3xl mx-auto leading-relaxed reveal-up">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
            <div className="mt-12 reveal-up">
              <Button variant="luxury" size="lg" onClick={() => document.getElementById('menu-commande')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white hover:text-black transition-all duration-500 text-sm tracking-widest uppercase">
                Commander au menu
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
             <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
          </div>
        </section>

        <PublicMenu />

        {/* Philosophie & SEBA International */}
        <section className="content-section py-32 bg-background relative border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 relative reveal-up">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src={getImageUrl("https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop")}
                    alt="Plat gastronomique" 
                    className="w-full h-full object-cover filter grayscale-[10%]"
                    onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-card p-8 border border-white/5 max-w-xs hidden md:block">
                  <p className="text-sm font-sans text-foreground leading-relaxed">
                    "L'excellence de la table au service de vos événements les plus prestigieux."
                  </p>
                </div>
              </div>

              <div className="order-1 lg:order-2 reveal-up">
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">{content?.vision_title || fallbackContent.vision_title}</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">Éveiller <br/><span className="italic text-blue-200">les Sens.</span></h3>
                <div className="space-y-6 text-white font-light leading-relaxed font-sans text-lg">
                  <p>
                    {content?.vision_text_1 || fallbackContent.vision_text_1}
                  </p>
                  <p>
                    {content?.vision_text_2 || fallbackContent.vision_text_2}
                  </p>
                </div>

                <div className="mt-16 grid grid-cols-2 gap-12 border-t border-white/10 pt-12">
                  <div>
                    <h4 className="text-5xl font-serif text-white mb-2">{content?.stat_1_value || fallbackContent.stat_1_value}</h4>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-sans">{content?.stat_1_label || fallbackContent.stat_1_label}</p>
                  </div>
                  <div>
                    <h4 className="text-5xl font-serif text-white mb-2">{content?.stat_2_value || fallbackContent.stat_2_value}</h4>
                    <p className="text-xs text-blue-200 uppercase tracking-widest font-sans">{content?.stat_2_label || fallbackContent.stat_2_label}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* L'Expérience Gastronomique (Nouveau contenu) */}
        <section className="py-32 bg-background border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-4">Notre Signature</h2>
              <h3 className="text-4xl font-serif text-white">L'Engagement Qualité MACOF</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { n: "01", t: "Ingrédients d'Exception", d: "Une sélection rigoureuse de produits locaux de saison et d'ingrédients nobles importés pour garantir une fraîcheur et des saveurs incomparables." },
                { n: "02", t: "Savoir-Faire Artisanal", d: "Nos chefs maîtrisent aussi bien les techniques traditionnelles africaines que la haute gastronomie française, créant ainsi une fusion parfaite." },
                { n: "03", t: "Service Sur-Mesure", d: "Chaque événement est orchestré avec une précision d'orfèvre : décoration, arts de la table, et un personnel de salle formé aux standards internationaux." }
              ].map((step, i) => (
                <div key={i} className="relative p-10 border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/50 transition-all duration-500 reveal-up group text-center md:text-left">
                  <span className="absolute -top-6 right-6 md:-left-6 text-7xl font-serif text-white/5 group-hover:text-primary/20 transition-colors duration-500">{step.n}</span>
                  <h4 className="text-2xl font-serif text-white mb-4 relative z-10">{step.t}</h4>
                  <p className="text-white/60 font-light leading-relaxed relative z-10">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nos Domaines d'Intervention */}
        <section className="py-32 bg-secondary border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center reveal-up">
             <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">Expertise Culinaire</h2>
             <h3 className="text-4xl md:text-5xl font-serif text-white mb-20">Nos Solutions</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {services.map((serv, i) => (
                 <div key={i} className="p-10 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left group">
                   <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-primary transition-colors">{serv.title}</h3>
                   <p className="text-blue-100 font-light leading-relaxed">{serv.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* Galerie */}
        <section className="py-32 bg-card border-t border-white/5">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">Aperçu</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-16">Galerie Réalisations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(realisations.length > 0 ? realisations.slice(0, 6) : [
                { titre: 'Restaurant 1', image_path: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop' },
                { titre: 'Restaurant 2', image_path: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop' },
                { titre: 'Restaurant 3', image_path: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop' },
              ]).map((item: any, index: number) => (
                <img
                  key={item.id || index}
                  src={getImageUrl(item.image_path)}
                  alt={item.titre || 'Réalisation SEBA'}
                  className="w-full h-80 object-cover hover:opacity-80 transition-opacity"
                  onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                />
              ))}
            </div>
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
}


