import { useEffect, useRef } from 'react';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_FALLBACK_IMAGE } from '../lib/utils';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_DOMAINES = [
  {
    id: '01', title: "MACOF Immobilier SARL", subtitle: "Immobilier & BTP", desc: "Investissement immobilier, promotion foncière, construction de bâtiments et gestion de chantiers publics/privés de grande envergure.", details: ["Promotion immobilière", "Travaux publics", "Architecture urbaine", "Gestion locative"], link: "/immobilier", img: "https://media.istockphoto.com/id/2151134721/photo/happy-group-of-business-people-standing.jpg?s=612x612&w=0&k=20&c=iTFwKo-IkwoBxrpb-BqwyUR6bK3DrCnnw3pB_wQN-O0="
  },
  {
    id: '02', title: "SEBA International", subtitle: "Restauration & Gastronomie", desc: "Service traiteur premium, restauration d'entreprise et événementielle de très haut niveau, soutenue par une exigence stricte de qualité et de sécurité alimentaire.", details: ["Service Traiteur VIP", "Boulangerie & Pâtisserie", "Restauration Collective", "Événementiel Gastronomique"], link: "/restauration", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '03', title: "MACOF Print & Com SARL", subtitle: "Design & Imprimerie", desc: "Agence créative spécialisée dans la stratégie de marque, l'impression grand format, la création d'identités visuelles et l'événementiel d'entreprise.", details: ["Impression Numérique/Offset", "Identité Visuelle", "Signalétique", "Organisation d'événements"], link: "/print", img: "https://media.istockphoto.com/id/1492549645/photo/black-friday-shoppers-tired-of-waiting.jpg?s=612x612&w=0&k=20&c=WAUcS_XmMOQ9ZhVR7NwOxm9fXjxgZmuST468rRIQv3s="
  },
  {
    id: '04', title: "MACOF Mining SARL", subtitle: "Industrie Minière", desc: "Opérations d'exploration, exploitation responsable, transport spécialisé et sous-traitance dans le secteur minier guinéen.", details: ["Exploration", "Exploitation responsable", "Logistique minière", "Sous-traitance"], link: "/mining", img: "https://images.unsplash.com/photo-1578507005479-7a0808a3d666?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '05', title: "MACOF Transit SARL", subtitle: "Logistique Globale", desc: "Maîtrise de bout en bout de la chaîne d'approvisionnement : fret maritime et aérien, dédouanement et service de billetterie d'affaires.", details: ["Dédouanement expert", "Fret International", "Supply Chain", "Billetterie d'affaires"], link: "/transit", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '06', title: "MACOF Fishing SARL", subtitle: "Pêche & Halieutique", desc: "Exploitation durable des ressources marines, transformation certifiée et commercialisation de produits de la mer sur les marchés locaux et internationaux.", details: ["Pêche industrielle", "Transformation", "Conservation frigorifique", "Distribution globale"], link: "/fishing", img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function Domaines() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: domaines = [] } = useQuery({
    queryKey: ['domainesData'],
    queryFn: async () => {
      try {
        const res = await api.get('/filiales'); 
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const apiData = res.data.data;
          // Iterate over FALLBACK_DOMAINES to maintain strict 01-06 order
          return FALLBACK_DOMAINES.map((fallback, index) => {
            // Try to find the matching API item by slug or title prefix
            const f = apiData.find((apiItem: any) => {
              const itemSlug = apiItem.slug?.toLowerCase().replace('macof-', '').replace('seba-', '');
              const fbSlug = fallback.link.replace('/', '').toLowerCase();
              return itemSlug === fbSlug;
            });
            
            if (f) {
              const apiImg = f.image_url || f.image_path;
              const finalImg = apiImg ? (apiImg.startsWith('http') || apiImg.startsWith('/') ? apiImg : `/uploads/${apiImg}`) : fallback.img;
              
              return {
                id: fallback.id,
                title: f.nom || fallback.title,
                subtitle: f.secteur || fallback.subtitle,
                desc: f.description || fallback.desc,
                details: fallback.details, // Force rich details from fallback
                link: fallback.link, // Keep fallback link to ensure routing works
                img: finalImg,
                fallbackImg: fallback.img
              };
            }
            return { ...fallback, fallbackImg: fallback.img };
          });
        }
      } catch (err) {
        console.warn("Erreur API filiales, chargement du fallback en dur.");
      }
      return FALLBACK_DOMAINES;
    },
    
  });

  useEffect(() => {
    if (domaines.length > 0) {
      const ctx = gsap.context(() => {
        gsap.utils.toArray('.domain-block').forEach((block: any) => {
          const textContent = block.querySelector('.text-content');
          const imgContent = block.querySelector('.img-content');
          
          gsap.fromTo(textContent, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: block, start: "top 75%" } }
          );

          gsap.fromTo(imgContent, 
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.5, ease: "power3.out", scrollTrigger: { trigger: block, start: "top 80%" } }
          );
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [domaines]);

  return (
    <AnimatedPage className="bg-white">
      <div ref={containerRef}>
        
        {/* Header Institutionnel */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gray-900">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2070&auto=format&fit=crop"
              alt="Pôles d'expertise"
              className="w-full h-full object-cover filter grayscale-[30%] opacity-70" 
            />
          </div>
          <div className="relative z-20 text-center px-6 max-w-4xl mt-20">
            <p className="text-red-500 text-xs uppercase tracking-[0.4em] font-sans mb-6 font-semibold">Portefeuille du Groupe</p>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 font-light">
              Nos Domaines <br/><span className="text-red-500 italic">d'Intervention</span>
            </h1>
            <p className="text-lg text-gray-300 font-light font-sans max-w-2xl mx-auto leading-relaxed border-t border-white/20 pt-8">
              Une spécialisation sectorielle pour une expertise de pointe. Découvrez les six filiales indépendantes qui constituent la force de frappe de MACOF Holding.
            </p>
          </div>
        </section>

        {/* Grille Dynamique / Liste Détaillée */}
        <section className="py-32 bg-white">
          <div className="max-w-[90rem] mx-auto px-6 lg:px-12 space-y-32">
            {domaines.map((domaine, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={domaine.id} className={`domain-block flex flex-col lg:flex-row gap-16 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                  
                  {/* Image Block */}
                  <div className="img-content w-full lg:w-[55%] relative group">
                    <div className="absolute inset-0 bg-blue-900/5 -translate-x-4 translate-y-4 md:-translate-x-6 md:translate-y-6 z-0 rounded" />
                    <div className="relative z-10 aspect-[4/3] overflow-hidden border border-gray-200 bg-gray-100 shadow-xl">
                      <img 
                        src={domaine.img} 
                        alt={domaine.title} 
                        className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-[2s] ease-out" 
                        onError={(e) => { e.currentTarget.src = domaine.fallbackImg || DEFAULT_FALLBACK_IMAGE; }}
                      />
                    </div>
                  </div>

                  {/* Text Block */}
                  <div className="text-content w-full lg:w-[45%] relative z-20">
                    <div className="absolute -top-16 -left-8 text-[10rem] font-serif font-black text-gray-100 select-none pointer-events-none leading-none z-0">
                      {domaine.id}
                    </div>
                    
                    <div className="relative z-10">
                      <span className="text-xs font-sans tracking-[0.3em] text-red-600 uppercase mb-4 block font-semibold flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-red-600"></span>
                        {domaine.subtitle}
                      </span>
                      <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-8">{domaine.title}</h2>
                      
                      <p className="text-gray-600 font-light leading-relaxed mb-10 text-lg">
                        {domaine.desc}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-12">
                        {domaine.details.map((detail: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 border-b border-gray-100 pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                            <span className="text-gray-800 font-medium text-sm">{detail}</span>
                          </div>
                        ))}
                      </div>

                      <Link to={domaine.link}>
                        <Button variant="luxury" className="bg-gray-900 text-white hover:bg-red-600 transition-colors px-8 py-6 rounded-none shadow-none text-sm tracking-widest uppercase">
                          Explorer cette expertise
                        </Button>
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
}
