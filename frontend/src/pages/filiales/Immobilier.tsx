import { useEffect, useRef, useState , useMemo } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE, parseServices } from '../../lib/utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, HardHat, Building2, Landmark, Hammer, Ruler } from 'lucide-react';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'immobilier';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Immobilier',
  hero_subtitle: 'Promotion & BTP',
  hero_desc: 'Investissement immobilier, promotion foncière, construction de bâtiments et gestion de chantiers publics/privés de grande envergure.',
  hero_bg: 'https://images.unsplash.com/photo-1541888081119-74d156828551?q=80&w=2070&auto=format&fit=crop',
  vision_title: 'Notre Vision',
  vision_text_1: 'MACOF Immobilier SARL est la filiale experte dans l\'investissement immobilier, la promotion et les travaux publics (BTP). Nous concevons, réalisons et gérons des projets structurants avec une exigence stricte de qualité et de durabilité.',
  vision_text_2: 'Notre ambition est de contribuer activement au développement urbain et à la modernisation des infrastructures, en bâtissant les fondations de l\'économie guinéenne de demain.',
  stat_1_value: '15+',
  stat_1_label: 'Projets Majeurs',
  stat_2_value: '100%',
  stat_2_label: 'Conformité HQE',
  contact_email: 'macofholding2018@gmail.com',
  contact_phone: '+224 625 74 46 26',
};

const fallbackServices = [
  { title: "Acquisition & Terrains", desc: "Acquisition, viabilisation et valorisation de terrains à vocation résidentielle, commerciale ou industrielle.", icon: <Landmark size={32} /> },
  { title: "Bâtiments & Promotion", desc: "Construction de logements, immeubles, bureaux et complexes. Promotion immobilière de très haut standing.", icon: <Building2 size={32} /> },
  { title: "Travaux Publics", desc: "Réalisation d'infrastructures routières, ouvrages d'art, ponts et voiries avec un haut niveau d'ingénierie.", icon: <HardHat size={32} /> },
  { title: "Réhabilitation Urbaine", desc: "Rénovation, réhabilitation et modernisation de bâtiments existants et d'espaces urbains.", icon: <Hammer size={32} /> },
  { title: "Gestion Locative", desc: "Administration, maintenance et valorisation du parc immobilier pour nos partenaires et investisseurs.", icon: <Ruler size={32} /> },
];

export default function Immobilier() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [content, setContent] = useState(fallbackContent);
  const [loading, setLoading] = useState(true);
  const [filialeData, setFilialeData] = useState<any>(null);

    useEffect(() => {
    Promise.all([
      api.get(`/pages/${SLUG}`).catch(() => null),
      api.get(`/filiales/${SLUG}`).catch(() => null)
    ]).then(([pagesRes, filialesRes]) => {
      if (pagesRes?.data?.success) {
        setContent(mergeContent(fallbackContent, pagesRes.data.data));
      } else {
        setContent(fallbackContent);
      }
      if (filialesRes?.data?.success) {
        setFilialeData(filialesRes.data.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      api.get(`/pages/${SLUG}`)
        .then(res => { if (res.data.success) setContent(mergeContent(fallbackContent, res.data.data)); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  const [realisations, setRealisations] = useState<any[]>([]);
  useEffect(() => {
    api.get('/galerie?filiale=immobilier&limit=100').then(res => {
      if (res.data.success) {
        const immoReals = Array.isArray(res.data.data?.items) ? res.data.data.items : [];
        setRealisations(immoReals);
      }
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Immobilier', type_demande: 'devis' });
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
      gsap.to(".header-img", {
        yPercent: 15, ease: "none",
        scrollTrigger: { trigger: ".header-section", start: "top top", end: "bottom top", scrub: true }
      });
      gsap.utils.toArray(".reveal-up").forEach((el: any) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <AnimatedPage className="bg-white">
      <div ref={containerRef}>
        {/* Header B2B Strict */}
        <section className="header-section relative h-screen flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-10" />
            <img
              src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)}
              alt="MACOF Immobilier"
              className="header-img w-full h-[120%] object-cover -top-[10%] absolute opacity-80 filter grayscale-[40%]"
              onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
            />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20">
            <p className="text-red-500 text-xs uppercase tracking-[0.4em] font-sans mb-6 font-semibold reveal-up">
              {content?.hero_subtitle || fallbackContent.hero_subtitle}
            </p>
            <h1 className="text-6xl md:text-8xl font-serif text-white mb-8 font-light leading-none reveal-up">
              {content?.hero_title || fallbackContent.hero_title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light font-sans max-w-3xl mx-auto leading-relaxed reveal-up border-t border-white/20 pt-8">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
          </div>
        </section>

        {/* Vision & Expertise */}
        <section className="py-32 bg-white relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="reveal-up">
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-6 font-semibold flex items-center gap-3">
                  <span className="w-8 h-px bg-red-600"></span>
                  {content?.vision_title || fallbackContent.vision_title}
                </h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-8 leading-tight">
                  Construire les piliers <br/><span className="italic text-gray-500">de demain.</span>
                </h3>
                <div className="space-y-6 text-gray-700 font-light leading-relaxed font-sans text-lg">
                  <p>{content?.vision_text_1 || fallbackContent.vision_text_1}</p>
                  <p>{content?.vision_text_2 || fallbackContent.vision_text_2}</p>
                </div>
                <div className="mt-16 grid grid-cols-2 gap-12 border-t border-gray-200 pt-12">
                  <div>
                    <h4 className="text-5xl font-serif text-gray-900 mb-2">{content?.stat_1_value || fallbackContent.stat_1_value}</h4>
                    <p className="text-xs text-red-600 uppercase tracking-widest font-sans font-semibold">{content?.stat_1_label || fallbackContent.stat_1_label}</p>
                  </div>
                  <div>
                    <h4 className="text-5xl font-serif text-gray-900 mb-2">{content?.stat_2_value || fallbackContent.stat_2_value}</h4>
                    <p className="text-xs text-red-600 uppercase tracking-widest font-sans font-semibold">{content?.stat_2_label || fallbackContent.stat_2_label}</p>
                  </div>
                </div>
              </div>
              <div className="relative reveal-up">
                <div className="aspect-[3/4] overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src="https://images.unsplash.com/photo-1541888081119-74d156828551?q=80&w=1000&auto=format&fit=crop"
                    alt="Ingénierie BTP" 
                    className="w-full h-full object-cover filter grayscale-[10%]"
                    onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                  />
                </div>
                <div className="absolute -bottom-10 -left-10 bg-white p-8 border border-gray-100 shadow-2xl max-w-xs hidden md:block">
                  <p className="text-sm font-sans text-gray-900 leading-relaxed font-medium">
                    "L'alliance de la rigueur technique et de l'innovation architecturale."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nos Compétences (Cartes Visuelles) */}
        <section className="py-32 bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center reveal-up">
             <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Savoir-faire</h2>
             <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-20">Nos Compétences <span className="italic text-gray-500">BTP</span></h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
               {services.map((serv: any, i: number) => (
                   <div key={i} className="group bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-500 hover:border-red-600/30">
                     <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-500">
                        {serv.icon ? serv.icon : <Building2 size={32} />}
                     </div>
                     <h3 className="text-2xl font-serif text-gray-900 mb-4">{serv.title}</h3>
                     <p className="text-gray-600 font-light leading-relaxed">{serv.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* Processus BTP de A à Z */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Méthodologie BTP</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-gray-900">Un processus maîtrisé <span className="italic text-gray-500">de A à Z</span></h3>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                {[
                  { n: "01", t: "Étude technique", d: "Topographie, géotechnique, et calcul de structures pour un socle parfait." },
                  { n: "02", t: "Ingénierie & Plan", d: "Plans architecturaux, modélisation BIM et validation des normes." },
                  { n: "03", t: "Construction", d: "Déploiement des engins et réalisation des travaux sous haute supervision." },
                  { n: "04", t: "Livraison & Suivi", d: "Contrôle qualité final, remise des clés et gestion des garanties." }
                ].map((step, i) => (
                  <div key={i} className="bg-white p-8 border border-gray-200 shadow-sm relative group hover:-translate-y-2 transition-transform duration-300 reveal-up">
                    <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center font-serif text-xl mb-6 shadow-lg">
                      {step.n}
                    </div>
                    <h4 className="text-xl font-serif text-gray-900 mb-4">{step.t}</h4>
                    <p className="text-gray-600 font-light text-sm leading-relaxed">{step.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Galerie Réalisations */}
        <section className="py-32 bg-gray-900 border-t border-gray-800">
          <div className="max-w-[100rem] mx-auto px-6 lg:px-12 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-500 uppercase mb-6 font-semibold">Nos Projets</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-16">Galerie des <span className="italic text-gray-400">Réalisations</span></h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              {realisations.length > 0 ? (
                realisations.slice(0, 6).map((item: any, i: number) => (
                  <div key={i} className="relative group overflow-hidden bg-black aspect-[4/3]">
                    <img
                      src={getImageUrl((item.image || item.image_path))}
                      alt={(item.title || item.titre)}
                      className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-80 group-hover:opacity-100"
                      onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 text-left">
                      <span className="text-red-500 text-xs uppercase tracking-widest mb-2 font-semibold">{item.type_projet || 'Génie Civil'}</span>
                      <h4 className="text-white font-serif text-2xl">{(item.title || item.titre)}</h4>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="relative group overflow-hidden bg-black aspect-[4/3]">
                    <img src="https://images.unsplash.com/photo-1541888081119-74d156828551?q=80&w=1000&auto=format&fit=crop" alt="Chantier" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
                  </div>
                  <div className="relative group overflow-hidden bg-black aspect-[4/3]">
                    <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop" alt="Architecture" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
                  </div>
                  <div className="relative group overflow-hidden bg-black aspect-[4/3]">
                    <img src="https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=1000&auto=format&fit=crop" alt="Bâtiment" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>


        {/* Formulaire de Contact BTP */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="absolute -right-1/4 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-red-50 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start reveal-up">
              <div>
                <h2 className="text-sm font-sans tracking-[0.3em] text-red-600 uppercase mb-4 font-semibold">Consultation</h2>
                <h3 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">Confiez-nous <br/>votre <span className="italic text-gray-500">projet BTP.</span></h3>
                <p className="text-gray-600 font-light max-w-md mb-12 leading-relaxed">
                  Qu'il s'agisse d'un projet de construction civile, d'une promotion immobilière ou d'un aménagement d'envergure, le bureau d'études MACOF Immobilier est à votre disposition.
                </p>
                <div className="bg-gray-50 p-8 border border-gray-200">
                  <h4 className="text-xl font-serif text-gray-900 mb-4">Ligne Directe BTP</h4>
                  <p className="text-gray-600 font-light text-sm mb-2">Email : {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-gray-600 font-light text-sm mb-2">Téléphone : {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                  <p className="text-gray-600 font-light text-sm">Adresse : Manquepa, en face de Banc Bleu, Kaloum, Conakry</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-50 border border-green-200 p-8 text-center">
                    <p className="text-green-800 font-serif text-2xl mb-4">Demande transmise avec succès</p>
                    <p className="text-green-700 text-sm mb-2">Référence: <span className="font-semibold">{reference}</span></p>
                    <p className="text-green-600 text-sm mb-6">Notre département ingénierie prendra contact avec vous dans les plus brefs délais.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                        <MessageCircle size={18} /> Continuer sur WhatsApp
                      </a>
                    )}
                    <div className="mt-6 pt-6 border-t border-green-200">
                      <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-100 w-full" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Initier un autre projet</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white p-8 border border-gray-200 shadow-xl">
                    <h3 className="text-2xl font-serif text-gray-900 mb-8">Dossier de Consultation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Nom Complet / Société</label>
                        <Input required placeholder="Votre entité" className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Téléphone</label>
                        <Input required placeholder="+224 ..." className="border-gray-200 bg-gray-50 focus:bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Nature du projet</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-red-600">
                          <option>Gros œuvre & Bâtiment</option>
                          <option>Génie Civil & VRD</option>
                          <option>Promotion Immobilière</option>
                          <option>Réhabilitation</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Budget Estimé</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-red-600">
                          <option>&lt; 1 Milliard GNF</option>
                          <option>1 - 5 Milliards GNF</option>
                          <option>5 - 10 Milliards GNF</option>
                          <option>&gt; 10 Milliards GNF</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Cahier des charges synthétique</label>
                      <textarea required rows={5} className="flex w-full rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-red-600" placeholder="Décrivez les grandes lignes de votre projet..." />
                    </div>
                    <Button variant="luxury" size="lg" className="w-full bg-gray-900 text-white hover:bg-red-600 transition-colors uppercase tracking-widest text-sm" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Transmission...' : 'Soumettre le dossier'}
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


