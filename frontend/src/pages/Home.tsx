import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { MessageCircle, CheckCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../lib/utils';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  value: string;
  label: string;
}

interface Filiale {
  title: string;
  subtitle: string;
  img: string;
  fallbackImg?: string;
  link: string;
}

interface Realisation {
  title: string;
  category: string;
  image: string;
}

interface Partenaire {
  nom: string;
  logo_url: string;
}

interface Temoignage {
  nom: string;
  poste: string;
  entreprise: string;
  message: string;
  avatar_url: string;
  active?: boolean;
}

interface MacofData {
  hero_title_small: string;
  hero_title_main: string;
  hero_desc: string;
  hero_bg: string;
  vision_title_small: string;
  vision_desc_1: string;
  vision_desc_2: string;
  filiales: Filiale[];
  stats: Stat[];
  realisations: Realisation[];
  partenaires: Partenaire[];
  temoignages: Temoignage[];
}

const MACOF_DATA: MacofData = {
  hero_title_small: 'MACOF Holding',
  hero_title_main: "L'art de façonner <br/><span class=\"italic text-red-600 font-light\">l'avenir.</span>",
  hero_desc: "MACOF Holding est un groupe de droit guinéen structuré autour d'une vision ambitieuse : construire, développer et transformer durablement des secteurs stratégiques de l'économie. À travers une organisation moderne et une gouvernance rigoureuse, MACOF Holding crée de la valeur durable pour ses partenaires, ses collaborateurs et la nation.",
  hero_bg: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
  
  vision_title_small: 'Notre ADN',
  vision_desc_1: "Une organisation moderne et une gouvernance rigoureuse",
  vision_desc_2: "En mutualisant nos expertises, nous créons des synergies fortes entre nos différentes filiales pour relever les défis complexes de demain.",
  
  filiales: [
    { title: "MACOF Immobilier SARL", subtitle: "Immobilier & BTP", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop", link: "/immobilier" },
    { title: "SEBA International", subtitle: "Restauration & Gastronomie", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop", link: "/restauration" },
    { title: "MACOF Print & Com SARL", subtitle: "Communication & Design", img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?q=80&w=1000&auto=format&fit=crop", link: "/print" },
    { title: "MACOF Mining SARL", subtitle: "Industrie Minière", img: "https://images.unsplash.com/photo-1578507005479-7a0808a3d666?q=80&w=2070&auto=format&fit=crop", link: "/mining" },
    { title: "MACOF Transit SARL", subtitle: "Logistique & Import-Export", img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop", link: "/transit" },
    { title: "MACOF Fishing SARL", subtitle: "Pêche & Halieutique", img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop", link: "/fishing" }
  ],

  stats: [
    { value: '2014', label: 'Création historique' },
    { value: '6', label: 'Filiales expertes' },
    { value: '100+', label: 'Partenaires B2B' },
    { value: '3', label: 'Continents desservis' }
  ],

  realisations: [
    { title: "Développement Foncier", category: "Immobilier", image: "https://media.istockphoto.com/id/1572513989/photo/african-couple-viewing-real-estate-house.jpg?s=612x612&w=0&k=20" },
    { title: "Design & Aménagement", category: "Immobilier", image: "https://media.istockphoto.com/id/522336505/photo/happy-couple-at-homeware-store.webp?a=1&b=1&s=612x612&w=0&k=20&c=5ZKkTJadks8bitjWzlWKDrddNESsdzsleXUFgoLCBvU=" },
    { title: "Architecture d'Intérieur", category: "Immobilier", image: "https://media.istockphoto.com/id/1358799929/photo/young-couple-consulting-with-interior-designer.webp?a=1&b=1&s=612x612&w=0&k=20&c=4P02nWGGQP1xuJ3MF-jpuxHmSjSv875178bXyTfvQnM=" },
    { title: "Gestion de Biens", category: "Immobilier", image: "https://media.istockphoto.com/id/1572514012/photo/african-couple-viewing-real-estate-house.webp?a=1&b=1&s=612x612&w=0&k=20&c=_D-nrY18IaQCjce0jJGeONSqbuQ-6iCQM8X4qlnxw0g=" }
  ],

  partenaires: [
    { nom: "Partner 1", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/368px-Google_2015_logo.svg.png" },
    { nom: "Partner 2", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/439px-Microsoft_logo.svg.png" },
    { nom: "Partner 3", logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/600px-Amazon_logo.svg.png" }
  ],
  
  temoignages: [
    { 
      nom: "Jean-Pierre Duparc", 
      poste: "Directeur des Opérations", 
      entreprise: "Groupe Bolloré", 
      message: "L'expertise de MACOF dans la gestion logistique et le transit a radicalement amélioré nos délais de livraison. Un partenaire de confiance absolu.",
      avatar_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=200&auto=format&fit=crop"
    },
    { 
      nom: "Aminata Diallo", 
      poste: "CEO", 
      entreprise: "Global Trade Africa", 
      message: "Nous collaborons avec MACOF Immobilier depuis 3 ans sur des projets d'envergure. Leur rigueur et leur respect des normes internationales sont exemplaires.",
      avatar_url: "https://images.unsplash.com/photo-1531123414708-f47c4ce6d654?q=80&w=200&auto=format&fit=crop"
    }
  ]
};

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [content, setContent] = useState<MacofData>(MACOF_DATA);
  const [filiales, setFiliales] = useState<Filiale[]>(MACOF_DATA.filiales);

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        const [resContent, resFiliales, resGalerie] = await Promise.all([
          api.get('/pages/home'),
          api.get('/filiales'),
          api.get('/galerie?limit=4')
        ]);
        
        if (!isMounted) return;

        let newContent = { ...MACOF_DATA, realisations: [], partenaires: [], temoignages: [] };

        if (resContent.data?.success && Object.keys(resContent.data.data).length > 0) {
          const fetchedData = { ...resContent.data.data };

          ['partenaires', 'stats', 'temoignages'].forEach((key) => {
            if (fetchedData[key] && typeof fetchedData[key] === 'string') {
              try {
                const parsed = JSON.parse(fetchedData[key]);
                if (Array.isArray(parsed)) {
                  fetchedData[key] = key === 'temoignages'
                    ? parsed.map((item: Temoignage) => ({ ...item, active: item.active !== false }))
                    : parsed;
                } else {
                  delete fetchedData[key];
                }
              } catch {
                delete fetchedData[key];
              }
            }
          });

          newContent = mergeContent(newContent, fetchedData);
        }
        
        if (resGalerie.data?.success && resGalerie.data.data.items?.length > 0) {
          newContent.realisations = resGalerie.data.data.items.slice(0, 4).map((g: any) => ({
            title: g.titre,
            category: g.type_projet || g.filiale_nom || 'Projet',
            image: g.image_path
          }));
        }

        setContent(newContent);
        
        if (resFiliales.data?.success && resFiliales.data.data.length > 0) {
          const apiData = resFiliales.data.data;
          const formatted = MACOF_DATA.filiales.map((fallback) => {
            const f = apiData.find((apiItem: any) => 
              apiItem.slug === fallback.link.replace('/', '') || 
              apiItem.nom?.toLowerCase().includes(fallback.title.split(' ')[1]?.toLowerCase()) ||
              (apiItem.nom?.toLowerCase().includes(fallback.title.split(' ')[0]?.toLowerCase()) && fallback.title.split(' ')[0] !== 'MACOF')
            );
            if (f) {
              const apiImg = f.image_url || f.image_path;
              const finalImg = apiImg ? (apiImg.startsWith('http') || apiImg.startsWith('/') ? apiImg : `/uploads/${apiImg}`) : fallback.img;
              return {
                title: f.nom || fallback.title,
                subtitle: f.secteur || fallback.subtitle,
                img: finalImg,
                fallbackImg: fallback.img,
                link: fallback.link
              };
            }
            return { ...fallback, fallbackImg: fallback.img };
          });
          setFiliales(formatted);
        }
      } catch (error) {
        console.warn("Utilisation du contenu local de secours (fallback)", error);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Utilisation de scope pour garantir que GSAP nettoie uniquement les éléments de cette page
    const ctx = gsap.context(() => {
      // 1. Hero Animations
      gsap.fromTo(".hero-title", 
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2, stagger: 0.15 }
      );
      
      gsap.fromTo(".hero-desc", 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.6, stagger: 0.15 }
      );

      if (heroRef.current) {
        gsap.to(".hero-bg", {
          yPercent: 20,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }

      // 2. Scroll Reveal General
      const revealElements = gsap.utils.toArray<HTMLElement>('.reveal-up');
      revealElements.forEach((el) => {
        gsap.fromTo(el, 
          { y: 50, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none"
            }
          }
        );
      });

      // 3. Compteurs Animés
      const stats = gsap.utils.toArray<HTMLElement>('.stat-number');
      stats.forEach((stat) => {
        const targetValue = parseInt(stat.getAttribute('data-value') || '0', 10);
        if (!isNaN(targetValue)) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: targetValue,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: stat,
              start: "top 85%",
              toggleActions: "play none none none"
            },
            onUpdate: () => {
              stat.textContent = Math.floor(obj.val).toString();
            }
          });
        }
      });
    }, mainRef);

    return () => {
      ctx.revert(); // Nettoyage strict de toutes les animations/ScrollTriggers créés
    };
  }, [content, filiales]);

  return (
    <AnimatedPage className="bg-background">
      <div ref={mainRef}>
        {/* SECTION 1: HERO PREMIUM */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
            <img 
              src={getImageUrl(content.hero_bg)}
              alt="MACOF Building" 
              className="hero-bg w-full h-[120%] object-cover object-center -top-[10%] opacity-80"
            />
          </div>
          
          <div className="relative z-20 px-6 w-full max-w-7xl mx-auto pt-20">
            <div className="max-w-4xl">
              <p className="hero-title text-red-600 text-sm tracking-[0.4em] uppercase font-sans mb-6 font-semibold flex items-center gap-4">
                <span className="w-12 h-[2px] bg-red-600" />
                {content.hero_title_small}
              </p>
              <h1 
                className="hero-title text-5xl md:text-7xl lg:text-[6rem] font-serif text-white tracking-tight leading-[1.1] mb-8" 
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.hero_title_main) }} 
              />
              <p className="hero-desc text-base md:text-xl text-gray-300 font-sans font-light leading-relaxed mb-12 max-w-2xl border-l-2 border-white/20 pl-6">
                {content.hero_desc}
              </p>
              <div className="hero-desc flex flex-wrap gap-4">
                <Link to="/domaines">
                  <Button variant="luxury" size="lg" className="bg-red-600 text-white hover:bg-red-700 shadow-none px-8">
                    Découvrir le groupe
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white hover:text-black px-8">
                    Notre Vision
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTRODUCTION ASYMÉTRIQUE */}
        <section className="py-24 bg-white relative z-30">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="reveal-up">
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-6 font-semibold">
                  {content.vision_title_small}
                </h2>
                <h3 className="text-3xl md:text-5xl font-serif text-gray-900 leading-tight mb-8">
                  {content.vision_desc_1}
                </h3>
                <p className="text-gray-600 font-light text-lg leading-relaxed mb-8">
                  {content.vision_desc_2}
                </p>
                <ul className="space-y-4">
                  {['Performance accrue', 'Gouvernance stricte', 'Développement durable'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-800 font-medium">
                      <CheckCircle className="text-red-600 shrink-0" size={20} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal-up relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src="https://media.istockphoto.com/id/2151134701/photo/cyber-security-development-team.jpg?s=612x612&w=0&k=20&c=5EhVP6O5Ocu8kAuR26kaCHBoGBSz73Zxe0Q05XPUwC8=" 
                    alt="Bureau Corporate" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="absolute -bottom-8 -left-8 bg-blue-900 text-white p-8 rounded shadow-2xl hidden md:block">
                  <ShieldCheck size={48} className="text-red-500 mb-4" />
                  <p className="font-serif text-2xl font-light">Une fiabilité<br/>à toute épreuve.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: NOS FILIALES */}
        <section className="py-32 px-6 lg:px-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-[100rem] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 reveal-up">
              <div>
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Nos Filiales</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900">Nos 6 Piliers <span className="text-red-600 italic">d'Excellence</span></h3>
              </div>
              <Link to="/domaines" className="text-sm font-sans tracking-widest text-gray-500 hover:text-black uppercase flex items-center gap-2 mt-6 md:mt-0">
                Voir tout le portefeuille <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filiales.map((item, i) => (
                <Link 
                  to={item.link} 
                  key={i} 
                  className="reveal-up group relative block overflow-hidden aspect-[4/3] rounded bg-white shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={getImageUrl(item.img)} 
                      alt={item.title} 
                      className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-[1.5s] ease-out filter grayscale-[20%] group-hover:grayscale-0"
                      onError={(e) => { e.currentTarget.src = item.fallbackImg || DEFAULT_FALLBACK_IMAGE; }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/80 transition-colors duration-500" />
                  
                  <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-red-500 text-xs uppercase tracking-[0.2em] font-sans mb-3 font-semibold">
                      {item.subtitle}
                    </p>
                    <h4 className="text-2xl font-serif text-white font-light group-hover:text-red-100 transition-colors">{item.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CHIFFRES CLÉS ANIMÉS */}
        <section className="py-24 bg-blue-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)' }} />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/10">
              {content.stats.map((stat, i) => {
                const numericMatch = stat.value.match(/\d+/);
                const number = numericMatch ? numericMatch[0] : stat.value;
                const suffix = stat.value.replace(number, '');
                
                return (
                  <div key={i} className="reveal-up px-4">
                    <div className="text-5xl md:text-7xl font-serif text-white mb-4 flex items-center justify-center">
                      <span className="stat-number" data-value={number}>0</span>
                      <span className="text-red-500">{suffix}</span>
                    </div>
                    <div className="text-xs font-sans tracking-widest text-blue-200 uppercase">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: APERÇU GALERIE */}
        <section className="py-32 px-6 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Galerie</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">Nos Meilleures <span className="italic text-gray-500">Réalisations</span></h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Array.isArray(content.realisations) ? content.realisations : []).map((item, idx) => (
                <div key={idx} className={`group relative overflow-hidden reveal-up ${idx === 0 || idx === 3 ? 'aspect-[16/9]' : 'aspect-square'}`}>
                  <img 
                    src={getImageUrl(item.image)} 
                    alt={item.title} 
                    className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700" 
                    onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-6 backdrop-blur-sm">
                    <span className="text-red-500 text-xs font-sans tracking-widest uppercase mb-3 bg-white px-3 py-1 rounded-full">{item.category}</span>
                    <h4 className="text-white text-2xl font-serif">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center reveal-up">
              <Link to="/galerie">
                <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">Découvrir toute la galerie</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION PARTENAIRES */}
        <section className="py-24 bg-gray-50 border-t border-gray-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Nos Partenaires</h2>
            <h3 className="text-3xl md:text-4xl font-serif text-gray-900">Ils nous font <span className="italic text-gray-500">confiance</span></h3>
          </div>
          
          <div className="relative flex overflow-hidden group">
            <div className="animate-marquee flex gap-16 items-center min-w-full">
              {(content.partenaires || []).map((p, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center gap-4">
                  <img 
                    src={getImageUrl(p.logo_url)} 
                    alt={p.nom} 
                    className="h-16 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ))}
              {/* Duplication pour le défilement infini */}
              {(content.partenaires || []).map((p, i) => (
                <div key={`dup-${i}`} className="flex-shrink-0 flex flex-col items-center justify-center gap-4">
                  <img 
                    src={getImageUrl(p.logo_url)} 
                    alt={p.nom} 
                    className="h-16 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION TÉMOIGNAGES */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -skew-x-12 translate-x-20 z-0 hidden lg:block" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="text-center mb-16 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold flex items-center justify-center gap-3">
                <MessageCircle size={18} /> Paroles de Partenaires
              </h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900">L'Excellence <span className="italic text-gray-500">Reconnue</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {(content.temoignages || []).filter((t) => t.active !== false).map((t, i) => (
                <div key={i} className="reveal-up bg-white border border-gray-100 p-8 shadow-xl relative group hover:-translate-y-2 transition-transform duration-500">
                  <div className="absolute top-8 right-8 text-gray-100 group-hover:text-red-50 transition-colors duration-500">
                    <MessageCircle size={64} className="fill-current" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <img 
                        src={getImageUrl(t.avatar_url)} 
                        alt={t.nom} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                      />
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{t.nom}</h4>
                        <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">{t.poste}</p>
                        <p className="text-sm text-gray-500">{t.entreprise}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 font-light leading-relaxed text-lg italic">
                      "{t.message}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION CTA FINAL */}
        <section className="py-32 bg-red-600 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://media.istockphoto.com/id/1179885419/photo/four-confident-african-american-male-and-female-professionals-standing-together-in-bright.jpg?s=612x612&w=0&k=20&c=MFHVh3PYGxbqyRC02_ECSwX7ABfMA4ptgGw_eJ7V3w8=')] mix-blend-multiply opacity-20 object-cover" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-8 font-light">Prêt à construire l'avenir ensemble ?</h2>
            <p className="text-red-100 mb-12 text-xl font-light">Que vous cherchiez un partenariat B2B stratégique ou des services de très haute qualité, notre groupe est à votre écoute.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/contact">
                <Button variant="luxury" size="lg" className="bg-white text-red-600 hover:bg-gray-100 shadow-xl px-10 py-6 text-lg">Contactez-nous</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
}
