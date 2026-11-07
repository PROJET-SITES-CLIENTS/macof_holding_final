import { useEffect, useRef, useState , useMemo } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Ship, Plane, Truck, FileCheck, Globe2, Ticket } from 'lucide-react';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE, parseServices } from '../../lib/utils';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'transit';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Transit',
  hero_subtitle: "Transit, Logistique & Travel",
  hero_desc: "La maîtrise globale de vos flux mondiaux. Commissionnaire en douane agréé, transport multimodal et agence de voyages corporate.",
  hero_bg: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop',
  vision_title: 'Un hub multi-services',
  vision_text_1: "MACOF Transit SARL structure ses opérations autour de deux pôles d'excellence : la chaîne logistique internationale et les services aux voyageurs d'affaires.",
  vision_text_2: "De l'enlèvement en usine au dédouanement à destination, jusqu'à la réservation de vos vols internationaux, nous garantissons fluidité, sécurité et conformité réglementaire absolue.",
  contact_email: 'macofholding2018@gmail.com',
  contact_phone: '+224 625 74 46 26',
};

const fallbackServices = [
  { title: "Dédouanement & Conformité", desc: "Traitement douanier accéléré, déclarations anticipées et gestion experte des régimes économiques spéciaux.", icon: <FileCheck size={40} strokeWidth={1.5} /> },
  { title: "Fret Maritime & Aérien", desc: "Transport multimodal (FCL/LCL) et aérien express via un réseau de correspondants mondiaux de premier plan.", icon: <Ship size={40} strokeWidth={1.5} /> },
  { title: "Logistique Terrestre", desc: "Flotte dédiée pour le pré-acheminement et post-acheminement sur tout le territoire guinéen et sous-régional.", icon: <Truck size={40} strokeWidth={1.5} /> },
];

export default function Transit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'logistique' | 'travel'>('logistique');

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
    api.get('/galerie?filiale=transit&limit=100').then(res => {
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
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Transit', type_demande: 'devis' });
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
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

      // Horizontal flow animations
      gsap.utils.toArray(".flow-right").forEach((el: any) => {
        gsap.from(el, { x: -100, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray(".flow-left").forEach((el: any) => {
        gsap.from(el, { x: 100, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-white">
      <div ref={containerRef} className="font-sans text-gray-900">
        
        <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            {/* Dark industrial overlay matching Print & Mining */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111] z-10" />
            <img 
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)} 
              alt="Opérations Transit & Logistique" 
              className="hero-bg w-full h-[120%] object-cover -top-[10%] absolute opacity-80 filter contrast-125 saturate-50"
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 mt-20 text-center fade-up">
            <h2 className="text-red-600 text-sm uppercase tracking-[0.4em] font-semibold mb-6">
              {content?.hero_subtitle || fallbackContent.hero_subtitle}
            </h2>
            <h1 className="text-6xl md:text-8xl font-serif text-white mb-8 font-bold uppercase tracking-tight">
              Global <span className="text-red-600">Supply Chain.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed mb-10">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button variant="luxury" size="lg" className="bg-red-600 text-white hover:bg-white hover:text-black transition-colors duration-500 rounded-none px-8">
                Demander une cotation
              </Button>
            </div>
          </div>
        </section>


        {/* Double Pôle */}
        <section className="py-24 bg-white relative z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="fade-up">
              <h2 className="text-sm font-sans tracking-[0.2em] text-red-600 uppercase mb-4 font-bold">{content?.vision_title || fallbackContent.vision_title}</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">Connecter <br/>les marchés <span className="italic text-gray-500">mondiaux.</span></h3>
              <p className="text-gray-600 font-light text-lg mb-4">{content?.vision_text_1 || fallbackContent.vision_text_1}</p>
              <p className="text-gray-600 font-light text-lg">{content?.vision_text_2 || fallbackContent.vision_text_2}</p>
              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                <div>
                  <h4 className="text-4xl font-serif text-gray-900 mb-1">{content?.stat_1_value || fallbackContent.stat_1_value || '—'}</h4>
                  <p className="text-xs text-red-600 uppercase tracking-widest font-sans font-semibold">{content?.stat_1_label || fallbackContent.stat_1_label || 'Statistique'}</p>
                </div>
                <div>
                  <h4 className="text-4xl font-serif text-gray-900 mb-1">{content?.stat_2_value || fallbackContent.stat_2_value || '—'}</h4>
                  <p className="text-xs text-red-600 uppercase tracking-widest font-sans font-semibold">{content?.stat_2_label || fallbackContent.stat_2_label || 'Statistique'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 fade-up">
              <div className="bg-gray-50 p-10 border border-gray-100 flex items-center gap-6 group hover:bg-[#111111] transition-colors duration-500">
                <Globe2 size={48} strokeWidth={1} className="text-red-600 group-hover:text-red-500 transition-colors" />
                <div>
                  <h4 className="font-serif text-2xl text-gray-900 group-hover:text-white transition-colors mb-2">Transit & Logistique</h4>
                  <p className="text-gray-500 group-hover:text-gray-400 font-light transition-colors">Import/Export, Douane, Fret</p>
                </div>
              </div>
              <div className="bg-gray-50 p-10 border border-gray-100 flex items-center gap-6 group hover:bg-[#111111] transition-colors duration-500">
                <Ticket size={48} strokeWidth={1} className="text-red-600 group-hover:text-red-500 transition-colors" />
                <div>
                  <h4 className="font-serif text-2xl text-gray-900 group-hover:text-white transition-colors mb-2">Agence de Voyages</h4>
                  <p className="text-gray-500 group-hover:text-gray-400 font-light transition-colors">Billetterie, Visas, B2B Travel</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Atouts Concurrentiels */}
        <section className="py-24 bg-[#111111] text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="flow-right">
                <div className="text-4xl font-serif text-red-600 mb-4 font-bold">01</div>
                <h4 className="text-xl font-bold mb-4 font-serif">Fiabilité & Rapidité</h4>
                <p className="text-gray-400 font-light">Circuit de dédouanement accéléré grâce à notre intégration avec les systèmes douaniers (SYDONIA).</p>
              </div>
              <div className="fade-up">
                <div className="text-4xl font-serif text-red-600 mb-4 font-bold">02</div>
                <h4 className="text-xl font-bold mb-4 font-serif">Conformité Légale</h4>
                <p className="text-gray-400 font-light">Expertise avérée en classification tarifaire et régimes douaniers particuliers. Zéro risque de contentieux.</p>
              </div>
              <div className="flow-left">
                <div className="text-4xl font-serif text-red-600 mb-4 font-bold">03</div>
                <h4 className="text-xl font-bold mb-4 font-serif">Tracking Temps Réel</h4>
                <p className="text-gray-400 font-light">Visibilité de bout en bout sur l'acheminement de vos cargaisons, du port d'embarquement jusqu'à vos entrepôts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabulateur de Services */}
        <section className="py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col items-center mb-16 fade-up">
              <div className="bg-white p-1 shadow-sm border border-gray-200 inline-flex">
                <button 
                  onClick={() => setActiveTab('logistique')}
                  className={`px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all ${activeTab === 'logistique' ? 'bg-[#111111] text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Transit & Logistique
                </button>
                <button 
                  onClick={() => setActiveTab('travel')}
                  className={`px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all ${activeTab === 'travel' ? 'bg-[#111111] text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  MACOF Travel
                </button>
              </div>
            </div>

            <div className="bg-white shadow-xl border border-gray-100 min-h-[600px] flex">
              {activeTab === 'logistique' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 w-full animate-in fade-in duration-500">
                  <div className="p-12 lg:p-16 flex flex-col justify-center bg-[#111111] text-white">
                    <h3 className="text-3xl md:text-5xl font-serif text-white mb-8">Solutions <span className="text-red-600 italic">Logistiques.</span></h3>
                    <div className="space-y-8">
                      {services.map((serv: any, i: number) => (
                        <div key={i} className="flex gap-6 items-start">
                          <div className="w-14 h-14 border border-red-600/30 text-red-600 flex items-center justify-center flex-shrink-0">
                            {serv.icon}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold font-serif text-white mb-2">{serv.title}</h4>
                            <p className="text-gray-400 font-light leading-relaxed">{serv.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="relative hidden lg:block">
                    <img 
                      src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1000&auto=format&fit=crop" 
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-80" 
                      alt="Port autonome" 
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-[#111111]/40 mix-blend-multiply" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 w-full animate-in fade-in duration-500">
                  <div className="p-12 lg:p-16 flex flex-col justify-center bg-white">
                    <h3 className="text-3xl md:text-5xl font-serif text-gray-900 mb-8">Agence <span className="text-red-600 italic">Travel.</span></h3>
                    <p className="text-gray-600 font-light text-lg mb-8 leading-relaxed">
                      Notre département de billetterie offre un service B2B sur-mesure pour la gestion globale de la mobilité de vos collaborateurs et cadres dirigeants.
                    </p>
                    <div className="space-y-8">
                      <div className="flex gap-6 items-start">
                        <div className="w-14 h-14 border border-red-600/30 text-red-600 flex items-center justify-center flex-shrink-0"><Plane size={24} /></div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Billetterie Aérienne</h4>
                          <p className="text-gray-500 font-light">Réservation et émission de billets sur toutes les compagnies régionales et internationales.</p>
                        </div>
                      </div>
                      <div className="flex gap-6 items-start">
                        <div className="w-14 h-14 border border-red-600/30 text-red-600 flex items-center justify-center flex-shrink-0"><FileCheck size={24} /></div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Assistance Administrative</h4>
                          <p className="text-gray-500 font-light">Facilitation d'obtention de visas, assurances voyage et réservations hôtelières à travers le monde.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative hidden lg:block">
                    <img 
                      src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop" 
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-90" 
                      alt="Avion en vol" 
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-[#111111]/30 mix-blend-multiply" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* Galerie Logistique */}
        {realisations.length > 0 && (
          <section className="py-32 bg-white">
            <div className="max-w-[100rem] mx-auto px-6 lg:px-12 fade-up">
              <div className="text-center mb-16">
                <h2 className="text-sm font-sans tracking-[0.2em] text-red-600 uppercase mb-4 font-bold">Infrastructures</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900">En Immersion <span className="italic text-gray-500">Opérationnelle</span></h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {realisations.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="group relative overflow-hidden bg-gray-100 aspect-square">
                    <img
                      src={getImageUrl((item.image || item.image_path))}
                      alt={(item.title || item.titre)}
                      className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-[#111111]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8 text-center items-center backdrop-blur-sm">
                      <span className="text-red-600 text-xs font-sans tracking-widest uppercase mb-3 font-bold">{item.type_projet || 'Logistique'}</span>
                      <h4 className="text-white text-2xl font-serif">{(item.title || item.titre)}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Formulaire Cotation Express */}
        <section className="py-32 bg-[#111111] relative overflow-hidden">
          {/* Dynamic background lines */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start fade-up">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Cotation Logistique <br/><span className="text-red-600 italic">Express.</span></h2>
                <p className="text-gray-400 font-light max-w-md mb-12 text-lg">
                  Décrivez les spécificités de votre expédition. Nos experts cotateurs vous fourniront une solution optimisée sous 24h.
                </p>
                <div className="bg-white/5 p-8 border border-white/10 backdrop-blur-md">
                  <h4 className="text-xl font-serif text-white mb-6 flex items-center gap-3"><MessageCircle className="text-red-600"/> Contact Transit</h4>
                  <p className="text-gray-400 font-light text-sm mb-3">Email: {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-gray-400 font-light text-sm mb-3">Téléphone: {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                  <p className="text-gray-400 font-light text-sm">Adresse : Manquepa, Kaloum, Conakry</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-900/20 border border-green-500/30 p-8 text-center backdrop-blur-md">
                    <p className="text-green-400 font-serif text-2xl mb-4">Demande de cotation transmise !</p>
                    <p className="text-gray-300 text-sm mb-2">Référence: <span className="text-white font-mono">{reference}</span></p>
                    <p className="text-gray-400 text-sm mb-6">Un agent de cotation a été assigné à votre dossier.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-500 transition-colors font-medium">
                        <MessageCircle size={18} /> Discuter de votre fret via WhatsApp
                      </a>
                    )}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <Button variant="outline" className="text-gray-300 border-white/20 hover:bg-white/10 w-full" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Nouvelle cotation</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white p-10 shadow-2xl">
                    <h3 className="text-2xl font-serif text-gray-900 mb-8">Détails du Fret</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Société</label>
                        <Input required placeholder="Votre entreprise" className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Email pro</label>
                        <Input required type="email" placeholder="contact@..." className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Port/Aéroport de Départ</label>
                        <Input required placeholder="Ex: Shanghai (CNSHA)" className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Destination</label>
                        <Input required placeholder="Ex: Conakry (GNCKY)" className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Incoterm</label>
                        <select className="flex h-11 w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-red-600">
                          <option>FOB</option>
                          <option>CIF</option>
                          <option>EXW</option>
                          <option>DAP</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Volume (CBM/EVP)</label>
                        <Input placeholder="Ex: 1x 40' HC" className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Poids Brut</label>
                        <Input placeholder="Ex: 24 T" className="bg-gray-50 border-gray-200 focus:bg-white focus:border-red-600" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Description de la marchandise</label>
                      <textarea
                        required
                        rows={3}
                        className="flex w-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-red-600"
                        placeholder="Marchandise générale, périssable, classe OMI..."
                      />
                    </div>
                    
                    <Button variant="luxury" size="lg" className="w-full bg-[#111111] text-white hover:bg-red-600 hover:text-black transition-colors duration-300 h-14 font-bold text-sm tracking-widest uppercase rounded-none" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Analyse...' : 'Obtenir une cotation'}
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

