import { useEffect, useRef, useState , useMemo } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Palette, Printer, Presentation, Megaphone } from 'lucide-react';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE, parseServices } from '../../lib/utils';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'print';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Print & Com',
  hero_subtitle: "Design, Print & Événementiel",
  hero_desc: "L'art de la communication visuelle et de l'impression professionnelle. Nous donnons vie à vos idées avec une précision colorimétrique absolue et une créativité sans limite.",
  hero_bg: 'https://images.unsplash.com/photo-1562283838-89c0a6b4deaf?q=80&w=2070&auto=format&fit=crop', // Usine d'impression / Presse Offset
  vision_title: 'Notre Vision Créative',
  vision_text_1: "MACOF Print & Com SARL est la filiale experte en stratégie de marque, impression haute définition et organisation événementielle.",
  vision_text_2: "Nous accompagnons les entreprises dans le déploiement de leur identité visuelle avec un parc machine de pointe (Offset/Numérique) et une équipe dédiée à l'événementiel B2B.",
  stat_1_value: '360°',
  stat_1_label: 'Accompagnement',
  stat_2_value: 'HD',
  stat_2_label: 'Impression Offset',
  contact_email: 'macofholding2018@gmail.com',
  contact_phone: '+224 625 74 46 26',
};

const fallbackServices = [
  { title: "Identité Visuelle & Design", desc: "Création de logos, chartes graphiques, packaging et conception de rapports annuels institutionnels. Une direction artistique pointue pour sublimer votre image.", icon: <Palette size={40} strokeWidth={1} /> },
  { title: "Impression & Façonnage", desc: "Tirages haute qualité Offset et Numérique : brochures, magazines, papeterie. Finitions premium (dorure, vernis sélectif, pelliculage).", icon: <Printer size={40} strokeWidth={1} /> },
  { title: "Signalétique & Grand Format", desc: "Enseignes lumineuses, habillage de façades, PLV, banderoles et totems. Une visibilité maximale pour vos espaces commerciaux.", icon: <Presentation size={40} strokeWidth={1} /> },
];

export default function Print() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('Tous');
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const { data: filialeData } = useQuery({
    queryKey: ['filialeData', SLUG],
    queryFn: async () => {
      try {
        const res = await api.get(`/filiales/${SLUG}`);
        if (res.data.success) return res.data.data;
      } catch (e) {
        console.warn('API Error filiale');
      }
      return null;
    },
    
  });

  const { data: content, isLoading: loading } = useQuery({
    queryKey: ['pageContent', SLUG],
    queryFn: async () => {
      try {
        const res = await api.get(`/pages/${SLUG}`);
        if (res.data.success && res.data.data) return mergeContent(fallbackContent, res.data.data);
      } catch (err) {
        console.warn('API Error');
      }
      return fallbackContent;
    },
    
  });

  const [realisations, setRealisations] = useState<any[]>([]);
  useEffect(() => {
    api.get('/galerie?filiale=print&limit=100').then(res => {
      if (res.data.success) {
        const printReals = Array.isArray(res.data.data?.items) ? res.data.data.items : [];
        setRealisations(printReals);
      }
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Print & Com', type_demande: 'devis' });
      if (response.data.success) {
        setReference(response.data.data?.reference || '');
        setWhatsappUrl(response.data.data?.whatsapp_url || '');
      }
      setFormStatus('success');
      setFormData({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
    } catch (err) {
      console.error('Erreur formulaire:', err);
      setFormStatus('error');
    }
  };

  const configuredServices = parseServices(content?.services);
  const services = configuredServices.length > 0 ? configuredServices : fallbackServices;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".hero-bg", { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true } });
      
      gsap.utils.toArray(".fade-up").forEach((el: any) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      // Special creative reveal for columns
      gsap.from(".service-col", {
        y: 100, opacity: 0, stagger: 0.2, duration: 1.2, ease: "back.out(1.5)",
        scrollTrigger: { trigger: ".services-section", start: "top 70%" }
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-white">
      <div ref={containerRef}>
        
        {/* Hero Créatif */}
        <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-black/80 to-red-900/40 z-10 mix-blend-multiply" />
            <img 
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)} 
              alt="Studio de Création" 
              className="hero-bg w-full h-[120%] object-cover -top-[10%] absolute opacity-60 filter contrast-125"
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20">
            <div className="inline-block px-6 py-2 border border-white/30 rounded-full mb-8 backdrop-blur-sm fade-up">
              <span className="text-white text-xs uppercase tracking-[0.4em] font-sans font-medium">{content?.hero_subtitle || fallbackContent.hero_subtitle}</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-serif text-white mb-8 font-light leading-none fade-up">
              Creative <span className="italic font-normal">&</span> Print
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light font-sans max-w-2xl mx-auto leading-relaxed fade-up">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
          </div>
        </section>

        {/* 3 Colonnes de Prestations Nettes */}
        <section className="services-section py-32 bg-white relative z-20 -mt-10">
          <div className="max-w-[90rem] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((serv: any, i: number) => (
                <div key={i} className="service-col bg-white border border-gray-100 p-12 shadow-xl hover:-translate-y-4 transition-transform duration-500 group text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-8 group-hover:bg-blue-900 group-hover:text-white transition-colors duration-500">
                    {serv.icon ? serv.icon : <Palette size={40} strokeWidth={1} />}
                  </div>
                  <h3 className="text-2xl font-serif text-gray-900 mb-6">{serv.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{serv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision & Studio */}
        <section className="py-32 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-blue-900/5 -skew-x-12 transform origin-top hidden lg:block" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="fade-up">
                <h2 className="text-sm font-sans tracking-[0.3em] text-blue-900 uppercase mb-6 font-semibold flex items-center gap-3">
                  <span className="w-8 h-px bg-blue-900"></span>
                  {content?.vision_title || fallbackContent.vision_title}
                </h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-8 leading-tight">L'impact visuel <br/><span className="italic text-gray-500">sans compromis.</span></h3>
                <div className="space-y-6 text-gray-700 font-light leading-relaxed font-sans text-lg">
                  <p>{content?.vision_text_1 || fallbackContent.vision_text_1}</p>
                  <p>{content?.vision_text_2 || fallbackContent.vision_text_2}</p>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-8 border-t border-gray-200 pt-8">
                  <div>
                    <h4 className="text-4xl font-serif text-gray-900 mb-1">{content?.stat_1_value || fallbackContent.stat_1_value || '—'}</h4>
                    <p className="text-xs text-blue-900 uppercase tracking-widest font-sans font-semibold">{content?.stat_1_label || fallbackContent.stat_1_label || 'Statistique'}</p>
                  </div>
                  <div>
                    <h4 className="text-4xl font-serif text-gray-900 mb-1">{content?.stat_2_value || fallbackContent.stat_2_value || '—'}</h4>
                    <p className="text-xs text-blue-900 uppercase tracking-widest font-sans font-semibold">{content?.stat_2_label || fallbackContent.stat_2_label || 'Statistique'}</p>
                  </div>
                </div>
              </div>
              <div className="relative fade-up">
                <div className="aspect-square overflow-hidden bg-gray-200 p-2">
                  <img
                    src="https://images.unsplash.com/photo-1562564055-71e051d33c19?q=80&w=1000&auto=format&fit=crop"
                    alt="Presse Offset" 
                    className="w-full h-full object-cover filter grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Événementiel B2B */}
        <section className="py-32 bg-blue-950 text-white relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-fixed opacity-10 mix-blend-overlay" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="text-center mb-20 fade-up">
               <Megaphone size={48} strokeWidth={1} className="mx-auto mb-6 text-blue-400" />
               <h2 className="text-sm font-sans tracking-[0.3em] text-blue-400 uppercase mb-4">Focus Spécial</h2>
               <h3 className="text-4xl md:text-5xl font-serif">L'Organisation <span className="italic">Événementielle Corporate</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="fade-up space-y-8">
                 <p className="text-xl font-light leading-relaxed text-blue-100">
                   Au-delà de l'impression, MACOF Print & Com déploie une expertise complète dans la conception et l'organisation d'événements B2B majeurs (congrès, salons, lancements de produits).
                 </p>
                 <ul className="space-y-4">
                   <li className="flex items-start gap-4">
                     <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                     <span className="font-light text-gray-300">Conception 3D et aménagement de stands modulaires ou sur-mesure.</span>
                   </li>
                   <li className="flex items-start gap-4">
                     <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                     <span className="font-light text-gray-300">Signalétique événementielle, PLV, badges, accréditations.</span>
                   </li>
                   <li className="flex items-start gap-4">
                     <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                     <span className="font-light text-gray-300">Logistique technique (sonorisation, éclairage, écrans LED) via nos partenaires.</span>
                   </li>
                 </ul>
               </div>
               <div className="fade-up grid grid-cols-2 gap-4">
                 <img 
                   src="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=600&auto=format&fit=crop" 
                   alt="Bureau Corporate" 
                   className="w-full h-48 object-cover" 
                   onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                 />
                 <img 
                   src="https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600&auto=format&fit=crop" 
                   alt="Presse Offset" 
                   className="w-full h-48 object-cover mt-8" 
                   onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                 />
               </div>
            </div>
          </div>
        </section>

        {/* Portfolio / Galerie Design */}
        <section className="py-32 bg-white">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 fade-up">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 pb-8 mb-16">
              <div>
                <h2 className="text-sm font-sans tracking-[0.3em] text-blue-900 uppercase mb-4 font-semibold">Nos Créations</h2>
                <h3 className="text-4xl font-serif text-gray-900">Portfolio & Design</h3>
              </div>
              {realisations.length === 0 && (
                <div className="flex gap-4 mt-8 md:mt-0 flex-wrap">
                  {['Tous', 'Institutionnel', 'Événementiel', 'Identité', 'Impression'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs uppercase tracking-widest px-4 py-2 transition-colors border ${filter === f ? 'border-blue-900 text-white bg-blue-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {realisations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {realisations.map((item: any, idx: number) => (
                  <div key={idx} className="group relative overflow-hidden aspect-[3/4] bg-gray-100">
                    <img
                      src={getImageUrl(item.image || item.image_path)}
                      alt={(item.title || item.titre)}
                      className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 text-center">
                      <span className="text-blue-900 text-xs font-sans tracking-widest uppercase mb-4">{item.type_projet || 'Design'}</span>
                      <h4 className="text-gray-900 text-2xl font-serif">{(item.title || item.titre)}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 bg-gray-50 px-6 py-16 text-center text-gray-500">
                Aucune réalisation Print &amp; Com n'est publiée pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* Simulateur / Devis Print */}
        <section className="py-32 bg-gray-50 relative overflow-hidden">
          <div className="absolute -left-1/4 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-blue-100 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start fade-up">
              <div>
                <h2 className="text-sm font-sans tracking-[0.3em] text-blue-900 uppercase mb-4 font-semibold">Devis Sur-Mesure</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">Briefez votre <br/><span className="italic text-gray-500">Projet d'impression.</span></h3>
                <p className="text-gray-600 font-light max-w-md mb-12">
                  Décrivez-nous les spécifications techniques de votre projet. Nos experts pré-presse vous répondront avec un devis détaillé.
                </p>
                <div className="bg-white p-8 border border-gray-200 shadow-sm">
                  <h4 className="text-xl font-serif text-gray-900 mb-4">Contact Direct Print & Com</h4>
                  <p className="text-gray-600 font-light text-sm mb-2">Email : {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-gray-600 font-light text-sm mb-2">Téléphone : {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                  <p className="text-gray-600 font-light text-sm">Adresse : Manquepa, en face de Banc Bleu, Kaloum, Conakry</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <p className="text-green-800 font-serif text-2xl mb-4">Brief reçu avec succès</p>
                    <p className="text-green-700 text-sm mb-2">Référence: <span className="font-semibold">{reference}</span></p>
                    <p className="text-green-600 text-sm mb-6">Notre équipe commerciale analysera votre besoin et vous contactera sous 24h.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                        <MessageCircle size={18} /> Discuter via WhatsApp
                      </a>
                    )}
                    <div className="mt-6 pt-6 border-t border-green-200">
                      <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-100 w-full" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Nouvelle demande</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white p-8 border border-gray-200 shadow-xl">
                    <h3 className="text-2xl font-serif text-gray-900 mb-8">Formulaire de Devis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Nom / Société</label>
                        <Input required placeholder="Votre nom" className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Téléphone</label>
                        <Input required placeholder="+224 ..." className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Type de Support</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-900">
                          <option>Impression Papier (Offset/Numérique)</option>
                          <option>Grand Format (Bâche, Vinyle)</option>
                          <option>Signalétique Rigide (Alucobond, PVC)</option>
                          <option>Événementiel (Stand, Matériel)</option>
                          <option>Création Graphique (Logo, Charte)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Finition Spécifique</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-900">
                          <option>Standard</option>
                          <option>Vernis sélectif 3D / Dorure</option>
                          <option>Pelliculage Mat / Brillant</option>
                          <option>Non applicable</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Quantité / Format</label>
                        <Input placeholder="Ex: 5000 ex, format A4" className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Délai souhaité</label>
                        <Input type="date" className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Spécifications & Brief</label>
                      <textarea
                        required
                        rows={3}
                        className="flex w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-blue-900"
                        placeholder="Précisez le grammage, le lieu de l'événement, ou l'utilisation finale..."
                      />
                    </div>
                    
                    <Button variant="luxury" size="lg" className="w-full bg-blue-950 text-white hover:bg-blue-800 transition-colors uppercase tracking-widest text-sm" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Calcul en cours...' : 'Envoyer la demande'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </AnimatedPage>
  );
}

