import { useEffect, useRef, useState , useMemo } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE } from '../../lib/utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, HardHat, Pickaxe, Truck, ShieldCheck, Leaf } from 'lucide-react';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'mining';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Mining SARL',
  hero_subtitle: 'Département Exploitation',
  hero_desc: 'Exploration, exploitation et valorisation des ressources minières avec rigueur et responsabilité environnementale.',
  hero_bg: 'https://images.unsplash.com/photo-1578508493466-231362e92c2f?q=80&w=2070&auto=format&fit=crop',
  vision_title: 'Notre Vision',
  vision_text_1: "MACOF Mining SARL opère avec des équipements lourds de pointe pour extraire et valoriser les minerais de manière responsable.",
  vision_text_2: "Nous mettons un point d'honneur à allier performance industrielle et respect strict des normes environnementales.",
  stat_1_value: "15+",
  stat_1_label: "Carrières actives",
  stat_2_value: "500K",
  stat_2_label: "Tonnes extraites/an",
  contact_email: "mining@macof-holding.com",
  contact_phone: "+224 600 000 000"
};

const fallbackServices = [
  { title: "Exploration & Exploitation", desc: "Forage, dynamitage et extraction de minerai avec des méthodes modernes et des équipements de dernière génération pour optimiser le rendement tout en minimisant l'impact.", icon: <Pickaxe size={40} strokeWidth={1.5} /> },
  { title: "Sous-traitance Minière", desc: "Mise à disposition de compétences techniques, location d'engins lourds (terrassement, excavation) et gestion opérationnelle sur les concessions de nos partenaires.", icon: <HardHat size={40} strokeWidth={1.5} /> },
  { title: "Transport & Logistique", desc: "Acheminement sécurisé et optimisé des produits miniers depuis les zones d'extraction jusqu'aux terminaux portuaires ou sites de traitement.", icon: <Truck size={40} strokeWidth={1.5} /> },
];

export default function Mining() {
  const containerRef = useRef<HTMLDivElement>(null);
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
      } catch(e) {
        console.warn('API Error');
      }
      return fallbackContent;
    },
    
  });

  const [realisations, setRealisations] = useState<any[]>([]);
  useEffect(() => {
    api.get('/galerie?filiale=mining&limit=100').then(res => {
      if (res.data.success) {
        const reals = Array.isArray(res.data.data?.items) ? res.data.data.items : [];
        setRealisations(reals);
      }
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Mining', type_demande: 'devis' });
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

  // Force fallbackServices to display the rich text if DB items lack descriptions
  let services = fallbackServices;
  if (content?.services) {
    try {
      const parsed = JSON.parse(content.services);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].desc) {
        services = parsed;
      }
    } catch(e) {}
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".parallax-bg", { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true } });
      
      gsap.utils.toArray(".fade-up").forEach((el: any) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      gsap.from(".stat-box", {
        y: 50, opacity: 0, stagger: 0.2, duration: 1, ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".stats-section", start: "top 75%" }
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-[#111111]">
      <div ref={containerRef} className="text-gray-300 font-sans">
        
        {/* Hero Industriel */}
        <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            {/* Dark industrial overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111] z-10" />
            <img 
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)} 
              alt="Opérations Minières" 
              className="parallax-bg w-full h-[120%] object-cover -top-[10%] absolute opacity-80 filter contrast-125 saturate-50" 
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20 fade-up">
            <h2 className="text-[#C4A47C] text-sm uppercase tracking-[0.4em] font-semibold mb-6">
              {content?.hero_subtitle || fallbackContent.hero_subtitle}
            </h2>
            <h1 className="text-6xl md:text-8xl font-serif text-white mb-8 font-bold uppercase tracking-tight">
              MACOF <span className="text-[#C4A47C]">Mining</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
            <div className="mt-12 flex justify-center gap-6">
              <Button variant="luxury" size="lg" className="bg-[#C4A47C] text-black hover:bg-white transition-colors duration-500 rounded-none px-8">
                Découvrir nos opérations
              </Button>
            </div>
          </div>
        </section>

        {/* Vision & Introduction */}
        <section className="py-32 bg-[#111111] border-b border-white/5 relative z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="fade-up">
              <h2 className="text-[#C4A47C] text-xs uppercase tracking-widest mb-4 font-semibold">Présentation</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">
                L'Excellence <br/><span className="italic text-gray-500">Opérationnelle.</span>
              </h3>
              <div className="space-y-6 text-gray-400 font-light text-lg">
                <p>{content?.vision_text_1 || fallbackContent.vision_text_1}</p>
                <p>{content?.vision_text_2 || fallbackContent.vision_text_2}</p>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                <div>
                  <h4 className="text-4xl font-serif text-white mb-1">{content?.stat_1_value || fallbackContent.stat_1_value || '—'}</h4>
                  <p className="text-xs text-[#C4A47C] uppercase tracking-widest font-sans font-semibold">{content?.stat_1_label || fallbackContent.stat_1_label || 'Statistique'}</p>
                </div>
                <div>
                  <h4 className="text-4xl font-serif text-white mb-1">{content?.stat_2_value || fallbackContent.stat_2_value || '—'}</h4>
                  <p className="text-xs text-[#C4A47C] uppercase tracking-widest font-sans font-semibold">{content?.stat_2_label || fallbackContent.stat_2_label || 'Statistique'}</p>
                </div>
              </div>
            </div>
             <div className="relative fade-up mt-12 lg:mt-0">
               <img 
                 src="https://images.unsplash.com/photo-1573070088921-2292f3f1e941?q=80&w=600&auto=format&fit=crop" 
                 alt="Engins de chantier minier" 
                 className="w-full h-64 object-cover filter grayscale" 
                 onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
               />
               <img 
                 src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop" 
                 alt="Opérations d'extraction" 
                 className="w-full h-64 object-cover filter grayscale mt-12" 
                 onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
               />
             </div>
          </div>
        </section>

        {/* Activités Minières - Cartes Industrielles */}
        <section className="py-32 bg-[#161616]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 fade-up">
              <h2 className="text-[#C4A47C] text-xs uppercase tracking-[0.3em] font-semibold mb-4">Domaines d'Expertise</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-white">Nos Activités Minières</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((serv: any, i: number) => (
                <div key={i} className="fade-up bg-[#111111] border border-white/5 p-10 hover:border-[#C4A47C]/50 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-[#C4A47C]/10 transition-colors duration-500 transform scale-150 origin-top-right">
                    {serv.icon ? serv.icon : <Pickaxe size={120} />}
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-[#1A1A1A] text-[#C4A47C] flex items-center justify-center rounded-sm mb-8">
                      {serv.icon ? serv.icon : <Pickaxe size={32} strokeWidth={1.5} />}
                    </div>
                    <h4 className="text-2xl font-serif text-white mb-4">{serv.title}</h4>
                    <p className="text-gray-400 font-light leading-relaxed">{serv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Engagements RSE & HSE */}
        <section className="py-32 bg-black relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-fixed opacity-20 filter grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="max-w-3xl fade-up">
              <div className="flex gap-4 mb-6">
                <ShieldCheck className="text-[#C4A47C]" size={32} />
                <Leaf className="text-green-600" size={32} />
              </div>
              <h2 className="text-[#C4A47C] text-xs uppercase tracking-[0.3em] font-semibold mb-4">Responsabilité</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-white mb-8">Normes H.S.E & <br/>Développement Durable</h3>
              
              <div className="space-y-8 mt-12">
                <div className="flex gap-6 items-start">
                  <div className="text-3xl font-serif text-[#C4A47C] font-bold">01</div>
                  <div>
                    <h4 className="text-xl text-white font-medium mb-2">Santé & Sécurité au Travail (SST)</h4>
                    <p className="text-gray-400 font-light">Objectif « Zéro Incident ». Protocoles de sécurité stricts, EPI obligatoires, et formation continue de nos équipes sur le terrain.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start">
                  <div className="text-3xl font-serif text-[#C4A47C] font-bold">02</div>
                  <div>
                    <h4 className="text-xl text-white font-medium mb-2">Respect Environnemental</h4>
                    <p className="text-gray-400 font-light">Mise en place de plans de gestion environnementale (PGE), réhabilitation progressive des sites exploités et gestion rigoureuse des déchets industriels.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start">
                  <div className="text-3xl font-serif text-[#C4A47C] font-bold">03</div>
                  <div>
                    <h4 className="text-xl text-white font-medium mb-2">Contenu Local & Communautés</h4>
                    <p className="text-gray-400 font-light">Recrutement prioritaire de la main-d'œuvre locale, construction d'infrastructures communautaires (écoles, forages) pour un impact social positif direct.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Industrielles */}
        <section className="stats-section py-20 bg-[#C4A47C]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-black/10">
              {[
                { label: 'Engins Lourds', val: '150+' },
                { label: 'Projets Actifs', val: '12' },
                { label: 'Tonnes/Jour', val: '10K+' },
                { label: 'Incident HSE', val: '0' },
              ].map((stat, i) => (
                <div key={i} className="stat-box text-center">
                  <div className="text-4xl md:text-5xl font-serif text-black font-bold mb-2">{stat.val}</div>
                  <div className="text-black/70 text-sm uppercase tracking-widest font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Galerie d'Opérations */}
        <section className="py-32 bg-[#161616]">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 fade-up">
            <div className="text-center mb-16">
              <h2 className="text-[#C4A47C] text-xs uppercase tracking-[0.3em] font-semibold mb-4">Aperçu Terrain</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-white">Galerie d'Opérations</h3>
            </div>
            
            {realisations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {realisations.map((item: any, idx: number) => (
                  <div key={idx} className="group relative overflow-hidden aspect-[4/3] bg-[#111111]">
                    <img 
                      src={getImageUrl(item.image || item.image_path)} 
                      alt={(item.title || item.titre) || 'Portfolio'} 
                      className="w-full h-full object-cover filter grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <span className="text-[#C4A47C] text-xs font-sans tracking-widest uppercase mb-2 font-semibold">{item.type_projet || 'Opération'}</span>
                      <h4 className="text-white text-xl font-serif">{(item.title || item.titre)}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Extraction Bauxite", img: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop" },
                  { title: "Flotte Logistique", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop" },
                  { title: "Exploration", img: "https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=800&auto=format&fit=crop" },
                ].map((item, idx) => (
                  <div key={idx} className="group relative overflow-hidden bg-[#111111] aspect-[4/3]">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover filter grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <span className="text-[#C4A47C] text-xs font-sans tracking-widest uppercase mb-2 font-semibold">Terrain</span>
                      <h4 className="text-white text-xl font-serif">{item.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact / Partenariat */}
        <section className="py-32 bg-[#111111] border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 fade-up">
              <div>
                <h2 className="text-[#C4A47C] text-xs uppercase tracking-[0.3em] font-semibold mb-4">Collaboration</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-white mb-6">Demande de <br/>Partenariat Minier.</h3>
                <p className="text-gray-400 font-light max-w-md mb-12">
                  Que ce soit pour une demande de sous-traitance, de location d'engins lourds ou un partenariat d'exploitation sur vos concessions, contactez notre direction.
                </p>
                <div className="bg-[#161616] p-8 border border-white/5">
                  <h4 className="text-xl font-serif text-white mb-4">Direction des Opérations Minières</h4>
                  <p className="text-gray-400 font-light text-sm mb-2">Email : {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-gray-400 font-light text-sm mb-2">Téléphone : {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                  <p className="text-gray-400 font-light text-sm mt-4 text-[#C4A47C]">Manquepa, Kaloum, République de Guinée</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-[#161616] border border-[#C4A47C]/30 rounded-none p-8 text-center">
                    <p className="text-white font-serif text-2xl mb-4">Requête transmise</p>
                    <p className="text-gray-400 text-sm mb-2">Référence: <span className="text-[#C4A47C] font-semibold">{reference}</span></p>
                    <p className="text-gray-400 text-sm mb-6">Notre département des opérations analysera votre demande.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 bg-[#C4A47C] text-black hover:bg-white transition-colors font-medium rounded-none">
                        <MessageCircle size={18} /> Suivi sur WhatsApp
                      </a>
                    )}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <Button variant="outline" className="text-gray-300 border-white/20 hover:bg-white/5 w-full rounded-none" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Nouvelle requête</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-[#161616] p-8 border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Société / Entreprise</label>
                        <Input required placeholder="Nom de l'entreprise" className="border-white/10 bg-[#111111] text-white focus:border-[#C4A47C] rounded-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Email pro</label>
                        <Input required type="email" placeholder="contact@..." className="border-white/10 bg-[#111111] text-white focus:border-[#C4A47C] rounded-none" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Nature du Besoin</label>
                        <select className="flex h-10 w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A47C] rounded-none">
                          <option>Sous-traitance d'exploitation</option>
                          <option>Location d'engins (Terrassement)</option>
                          <option>Transport & Logistique Minière</option>
                          <option>Autre Partenariat</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Localisation (Site)</label>
                        <Input required placeholder="Région, Préfecture..." className="border-white/10 bg-[#111111] text-white focus:border-[#C4A47C] rounded-none" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Détails (Volume, Durée...)</label>
                      <textarea
                        required
                        rows={4}
                        className="flex w-full border border-white/10 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A47C] rounded-none"
                        placeholder="Précisez vos besoins techniques..."
                      />
                    </div>
                    
                    <Button variant="luxury" size="lg" className="w-full bg-[#C4A47C] text-black hover:bg-white transition-colors uppercase tracking-widest text-sm rounded-none font-bold" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Transmission...' : 'Envoyer la demande'}
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

