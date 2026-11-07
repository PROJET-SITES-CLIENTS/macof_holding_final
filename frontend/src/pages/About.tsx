import { useEffect, useRef, useState } from 'react';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, Compass, Award, Lightbulb, Shield, HeartHandshake, Leaf, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../lib/api';

gsap.registerPlugin(ScrollTrigger);

const ABOUT_DATA = {
  hero_title: "Notre Histoire, <br/><span class=\"italic text-red-600\">Notre Vision.</span>",
  hero_desc: "MACOF Holding est un groupe de droit guinéen, structuré autour d'une vision ambitieuse : construire, développer et transformer durablement des secteurs stratégiques de l'économie. À travers une organisation moderne et une gouvernance rigoureuse, le groupe incarne « l'art de façonner l'avenir ».",
  hero_img: "https://media.istockphoto.com/id/1127740243/photo/people-who-achieved-good-results-in-business-system.jpg?s=612x612&w=0&k=20&c=u5e0zaOzI0nG6fs_K8T0YcMKV_cWT7zDU-GQtjpuBG0=",
  
  vision: "Devenir un groupe de référence, reconnu pour son excellence, sa performance durable et sa contribution au développement économique de la Guinée et au-delà de la sous-région ouest-africaine.",
  mission: "Structurer, piloter et développer nos filiales à travers une gouvernance rigoureuse, une stratégie claire et une gestion centralisée, afin de garantir une croissance durable et créatrice de valeur pour l'ensemble des parties prenantes.",
  
  historique: [
    { year: "2014", title: "Création DEDE", desc: "Création de DEDE GLOBAL BUSINESS, Société à Responsabilité Limitée (SARL)." },
    { year: "2018", title: "MACOF SARL", desc: "Fondation de MACOF SARL sous la forme d'une Société à Responsabilité Limitée (SARL) en République de Guinée, marquant le point de départ officiel des activités du groupe." },
    { year: "2023", title: "MACOF SA", desc: "Évolution vers une Société Anonyme (SA), traduisant une phase d'expansion et de structuration renforcée avec une gouvernance formelle." },
    { year: "2026", title: "MACOF Holding", desc: "Adoption d'un modèle de Holding afin d'optimiser la gouvernance, la coordination stratégique et le développement sectoriel du groupe." }
  ],

  valeurs: [
    { icon: <Award size={32}/>, title: "Excellence", desc: "Viser l'excellence dans tout ce que nous entreprenons." },
    { icon: <Lightbulb size={32}/>, title: "Innovation", desc: "Innover en permanence pour rester à la pointe." },
    { icon: <Shield size={32}/>, title: "Intégrité", desc: "Opérer avec transparence et respect de nos engagements." },
    { icon: <HeartHandshake size={32}/>, title: "Engagement", desc: "S'engager envers nos clients, partenaires et communauté." },
    { icon: <Leaf size={32}/>, title: "Responsabilité", desc: "Contrôler notre impact et contribuer au développement durable." },
    { icon: <Users size={32}/>, title: "Esprit d'équipe", desc: "Travailler ensemble pour atteindre l'excellence collective." }
  ]
};

// Valeurs par défaut (dégradées de ABOUT_DATA) pour les champs éditables via le CMS (page "about")
const ABOUT_DEFAULTS = {
  hero_title: ABOUT_DATA.hero_title,
  hero_desc: ABOUT_DATA.hero_desc,
  hero_img: ABOUT_DATA.hero_img,
  vision: ABOUT_DATA.vision,
  mission: ABOUT_DATA.mission,
};

type AboutContent = typeof ABOUT_DEFAULTS;

const ABOUT_CMS_KEYS = ['hero_title', 'hero_desc', 'hero_img', 'vision', 'mission'] as const;

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<AboutContent>(ABOUT_DEFAULTS);

  // Chargement du contenu CMS de la page "about" (objet plat clé → valeur), fallback silencieux sur les défauts
  useEffect(() => {
    let isMounted = true;

    api.get('/pages/about')
      .then((res) => {
        if (!isMounted || !res.data?.success || !res.data.data) return;
        const data = res.data.data;
        const received: Partial<AboutContent> = {};
        ABOUT_CMS_KEYS.forEach((key) => {
          if (typeof data[key] === 'string' && data[key]) {
            received[key] = data[key];
          }
        });
        setContent((prev) => ({ ...prev, ...received }));
      })
      .catch(() => {
        // Erreur silencieuse : on conserve les valeurs par défaut
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax Hero
      gsap.fromTo(".about-hero-img", 
        { yPercent: 0 },
        { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".about-hero", start: "top top", end: "bottom top", scrub: true } }
      );

      // Reveal General
      gsap.utils.toArray(".reveal-up").forEach((el: any) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      
      // Timeline Animation
      const timelineItems = gsap.utils.toArray(".timeline-node");
      timelineItems.forEach((el: any, i: number) => {
        gsap.from(el, { 
          opacity: 0, 
          scale: 0.5, 
          duration: 0.8, 
          ease: "back.out(1.7)", 
          scrollTrigger: { trigger: el, start: "top 80%" },
          delay: i * 0.2
        });
      });
      
      const timelineLines = gsap.utils.toArray(".timeline-line");
      timelineLines.forEach((el: any) => {
        gsap.from(el, {
          scaleY: 0,
          transformOrigin: "top",
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 70%" }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-white">
      <div ref={containerRef}>
        
        {/* SECTION 1: HERO NARRATIF */}
        <section className="about-hero relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img 
              src={content.hero_img}
              alt="Bureau Corporate" 
              className="about-hero-img w-full h-[120%] object-cover -top-[10%] absolute"
            />
          </div>
          <div className="relative z-20 text-center px-6 max-w-4xl mt-20 reveal-up">
            <p className="text-red-500 text-xs uppercase tracking-[0.4em] font-sans mb-6 font-semibold">À propos du groupe</p>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 leading-tight" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.hero_title) }} />
            <p className="text-lg md:text-xl text-gray-300 font-light font-sans max-w-3xl mx-auto leading-relaxed border-t border-white/20 pt-8">
              {content.hero_desc}
            </p>
          </div>
        </section>

        {/* SECTION 2: VISION & MISSION */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-200 reveal-up">
              {/* Vision */}
              <div className="p-12 md:p-20 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-gray-200 group-hover:text-red-100 transition-colors">
                  <Compass size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-6 font-semibold flex items-center gap-3">
                    <span className="w-8 h-px bg-red-600"></span>
                    Notre Vision
                  </h3>
                  <p className="text-gray-800 font-serif text-2xl md:text-3xl leading-relaxed">
                    "{content.vision}"
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="p-12 md:p-20 bg-blue-950 text-white relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 p-8 text-blue-900 group-hover:text-blue-800 transition-colors">
                  <Target size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-sans tracking-[0.3em] text-blue-300 uppercase mb-6 font-semibold flex items-center gap-3">
                    <span className="w-8 h-px bg-blue-300"></span>
                    Notre Mission
                  </h3>
                  <p className="text-gray-200 font-light text-xl leading-relaxed">
                    {content.mission}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: L'HISTORIQUE (Timeline Interactive) */}
        <section className="py-32 bg-gray-50 border-y border-gray-200 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-24 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Parcours</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900">Une croissance <span className="italic text-gray-500">maîtrisée</span></h3>
            </div>
            
            <div className="relative">
              <div className="absolute left-[24px] md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
              
              {ABOUT_DATA.historique.map((step, i) => (
                <div key={i} className={`relative flex items-center justify-between mb-16 md:mb-24 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:block w-[45%]"></div>
                  
                  {/* Node */}
                  <div className="absolute left-0 md:left-1/2 -translate-x-[4px] md:-translate-x-1/2 w-[50px] h-[50px] rounded-full bg-white border-4 border-red-600 z-10 flex items-center justify-center shadow-lg timeline-node">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  </div>
                  
                  {/* Content */}
                  <div className={`w-full md:w-[45%] pl-20 md:pl-0 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'} reveal-up`}>
                    <div className="text-5xl font-serif text-gray-300 mb-2 font-light">{step.year}</div>
                    <h4 className="text-2xl font-serif text-gray-900 mb-4">{step.title}</h4>
                    <p className="text-gray-600 font-light leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: NOS VALEURS FONDAMENTALES */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">ADN du groupe</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900">Nos Valeurs <span className="italic text-gray-500">Fondamentales</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              {ABOUT_DATA.valeurs.map((val, i) => (
                <div key={i} className="reveal-up group">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                    {val.icon}
                  </div>
                  <h4 className="text-2xl font-serif text-gray-900 mb-4">{val.title}</h4>
                  <p className="text-gray-600 font-light leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: CTA VERS FILIALES */}
        <section className="py-24 bg-gray-900 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1497215842851-9d54e4c29402?q=80&w=2000&auto=format&fit=crop')] object-cover mix-blend-screen" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 reveal-up">
            <h2 className="text-3xl md:text-5xl font-serif text-white mb-8">Découvrez la synergie de nos <span className="italic text-red-500">6 filiales</span></h2>
            <Link to="/domaines" className="inline-flex items-center gap-4 px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 transition-colors rounded uppercase tracking-widest text-sm font-semibold">
              Explorer nos domaines d'expertise <ChevronRight size={20} />
            </Link>
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
}
