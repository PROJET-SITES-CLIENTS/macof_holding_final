import { useEffect, useRef, useState } from 'react';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mergeContent, getImageUrl, DEFAULT_FALLBACK_IMAGE, parseServices } from '../../lib/utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const SLUG = 'fishing';

const fallbackContent: Record<string, string> = {
  hero_title: 'MACOF Fishing',
  hero_subtitle: "Domaine d'Excellence 06",
  hero_desc: "Exploitation halieutique durable. De la capture hauturière à l'exportation internationale, dans le plus strict respect des écosystèmes.",
  hero_bg: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop',
  vision_title: 'Notre Vocation',
  vision_text_1: "MACOF Fishing valorise les ressources halieutiques guinéennes dans le respect strict des quotas et des écosystèmes marins.",
  vision_text_2: "Notre flotte moderne et nos usines de traitement intégrées nous permettent de garantir une fraîcheur absolue et de répondre aux exigences des marchés internationaux les plus stricts.",
  contact_email: 'export.fishing@macofholding.com',
  contact_phone: '+224 625 00 00 00',
};

const fallbackServices = [
  { title: "Pêche artisanale et industrielle", desc: "Pêche artisanale et industrielle.", icon: "" },
  { title: "Transformation et conservation", desc: "Transformation et conservation des produits halieutiques.", icon: "" },
  { title: "Commercialisation et distribution", desc: "Commercialisation et distribution des produits de la mer.", icon: "" },
  { title: "Exploitation durable des ressources", desc: "Activités liées à l'exploitation durable des ressources marines.", icon: "" },
  { title: "Qualité et normes sanitaires", desc: "Contrôle qualité et respect des normes sanitaires.", icon: "" },
];

export default function Fishing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ nom_complet: '', email: '', telephone: '', objet: '', message: '' });
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [filialeData, setFilialeData] = useState<any>(null);

  // Fetch page content and filiale data
  useEffect(() => {
    Promise.all([
      api.get(`/pages/${SLUG}`).catch(() => null),
      api.get(`/filiales/${SLUG}`).catch(() => null)
    ]).then(([pagesRes, filialesRes]) => {
      if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
      else setContent(fallbackContent);
      if (filialesRes?.data?.success) setFilialeData(filialesRes.data.data);
    });
  }, []);

  // Polling every 30s
  useEffect(() => {
    const poll = setInterval(() => {
      Promise.all([
        api.get(`/pages/${SLUG}`).catch(() => null),
        api.get(`/filiales/${SLUG}`).catch(() => null)
      ]).then(([pagesRes, filialesRes]) => {
        if (pagesRes?.data?.success) setContent(mergeContent(fallbackContent, pagesRes.data.data));
        if (filialesRes?.data?.success) setFilialeData(filialesRes.data.data);
      });
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const response = await api.post('/demandes', { ...formData, filiale: 'MACOF Fishing', type_demande: 'devis' });
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
      gsap.to(".header-img", { yPercent: 20, ease: "none", scrollTrigger: { trigger: ".header-section", start: "top top", end: "bottom top", scrub: true } });
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
            <img src={getImageUrl(content?.hero_bg || fallbackContent.hero_bg)} alt="Pêche Industrielle en haute mer" className="header-img w-full h-[120%] object-cover -top-[10%] absolute opacity-80" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
          </div>
          <div className="relative z-20 text-center px-4 max-w-5xl mt-20">
            <p className="text-white text-xs uppercase tracking-[0.4em] font-sans mb-6 reveal-up">{content?.hero_subtitle || fallbackContent.hero_subtitle}</p>
            <h1 className="text-7xl md:text-9xl font-serif text-white mb-8 font-light leading-none reveal-up">{content?.hero_title || fallbackContent.hero_title}</h1>
            <p className="text-xl md:text-2xl text-white/90 font-light font-sans max-w-3xl mx-auto leading-relaxed reveal-up">
              {content?.hero_desc || fallbackContent.hero_desc}
            </p>
            <div className="mt-12 reveal-up">
              <Button variant="luxury" size="lg" className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white hover:text-black transition-all duration-500 text-sm tracking-widest uppercase">
                Consulter notre flotte
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
             <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
          </div>
        </section>

        {/* Présentation */}
        <section className="content-section py-32 bg-secondary relative z-20">
          <div className="max-w-4xl mx-auto px-6 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">{content?.vision_title || fallbackContent.vision_title}</h2>
            <p className="text-2xl font-serif text-white leading-relaxed font-light mb-8">
              {content?.vision_text_1 || fallbackContent.vision_text_1}
            </p>
            <p className="text-red-100 font-light text-lg">
              {content?.vision_text_2 || fallbackContent.vision_text_2}
            </p>
          </div>
        </section>

        {/* Éco-Responsabilité (Nouveau contenu) */}
        <section className="py-32 bg-background border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20 reveal-up">
              <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-4">Notre Charte Éthique</h2>
              <h3 className="text-4xl font-serif text-white">L'Océan, Notre Avenir</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { n: "01", t: "Quotas Rigoureux", d: "Nous pêchons strictement dans la limite des quotas alloués pour préserver la biomasse et lutter contre la surpêche." },
                { n: "02", t: "Sélectivité des Engins", d: "Utilisation de maillages réglementaires spécifiques pour éviter les prises accessoires et protéger les espèces menacées." },
                { n: "03", t: "Valorisation Locale", d: "Contribution active à la sécurité alimentaire guinéenne par la mise sur le marché local d'une part significative de nos captures." }
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

        {/* Chaîne de valeur */}
        <section className="py-32 bg-background border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 className="text-3xl font-serif text-white mb-16 text-center reveal-up">Notre Chaîne de Valeur</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((serv, i) => (
                <div key={i} className="p-8 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors reveal-up text-center group">
                  <div className="text-primary text-4xl mb-6 font-serif opacity-50 group-hover:opacity-100 transition-opacity">0{i+1}</div>
                  <h3 className="text-xl font-serif text-white mb-4 group-hover:text-primary transition-colors">{serv.title}</h3>
                  <p className="text-blue-100 font-light leading-relaxed text-sm">{serv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalogue Produits */}
        <section className="py-32 bg-secondary border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center reveal-up">
            <h2 className="text-sm font-sans tracking-[0.3em] text-red-200 uppercase mb-6">Nos Espèces Phares</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-white mb-16">Catalogue Produits</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { n: "Dorade Royale", i: "https://images.unsplash.com/photo-1517427958611-30dbb69829ec?q=80&w=400&auto=format&fit=crop" },
                { n: "Sole", i: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop" },
                { n: "Thon", i: "https://images.unsplash.com/photo-1544552866-d3ed42536fcb?q=80&w=400&auto=format&fit=crop" },
                { n: "Crevettes & Céphalopodes", i: "https://images.unsplash.com/photo-1559742811-822873691fc8?q=80&w=400&auto=format&fit=crop" }
              ].map((prod, i) => (
                <div key={i} className="group relative overflow-hidden bg-card border border-white/5">
                  <div className="aspect-square overflow-hidden">
                    <img src={getImageUrl(prod.i)} alt={prod.n} className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
                  </div>
                  <div className="p-4 bg-white/[0.02]">
                    <h4 className="text-lg font-serif text-white">{prod.n}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
               <Button variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                 Télécharger le catalogue complet (PDF)
               </Button>
            </div>
          </div>
        </section>

        {/* Flotte & Certifications */}
        <section className="py-32 bg-card relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-up grid grid-cols-2 gap-4">
              <img src={getImageUrl("https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop")} alt="Flotte de Pêche" className="w-full h-64 object-cover filter grayscale-[20%]" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
              <img src={getImageUrl("https://images.unsplash.com/photo-1621689973873-1004bb152843?q=80&w=800&auto=format&fit=crop")} alt="Traitement" className="w-full h-64 object-cover filter grayscale-[20%] mt-8 hidden md:block" onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} />
            </div>
            
            <div className="reveal-up">
              <h2 className="text-3xl font-serif text-white mb-6">Traçabilité & Certifications Sanitaires</h2>
              <p className="text-white font-light leading-relaxed mb-8">
                L'industrie des produits de la mer exige une rigueur sanitaire implacable. MACOF Fishing a mis en place un protocole HACCP de bout en bout.
              </p>
              <ul className="space-y-6 text-white font-light">
                <li className="flex items-start gap-4">
                  <span className="text-primary mt-1">✦</span>
                  <div><strong className="text-white font-serif">Agrément Exportation UE</strong><br/><span className="text-sm text-blue-200">Autorisation sanitaire d'exportation vers le marché européen.</span></div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-primary mt-1">✦</span>
                  <div><strong className="text-white font-serif">Méthode HACCP</strong><br/><span className="text-sm text-blue-200">Contrôle strict de la chaîne du froid et de l'hygiène des usines.</span></div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-primary mt-1">✦</span>
                  <div><strong className="text-white font-serif">Pêche Durable (MSC)</strong><br/><span className="text-sm text-blue-200">Respect des périodes de repos biologique et des maillages réglementaires.</span></div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Formulaire */}
        <section className="py-32 bg-background relative overflow-hidden border-t border-white/5">
          <div className="absolute -left-1/4 top-1/2 -translate-y-1/2 w-1/2 h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start reveal-up">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Approvisionnement <br/>B2B.</h2>
                <p className="text-white font-light max-w-md mb-12">
                  Grossistes, centrales d'achat ou industriels de l'agroalimentaire : contactez notre cellule export pour vos besoins en volumes.
                </p>
                <div className="bg-white/5 p-8 border border-white/10">
                  <h4 className="text-xl font-serif text-white mb-4">Cellule Commerciale & Export</h4>
                  <p className="text-blue-200 font-light text-sm mb-2">Email: {filialeData?.email || content?.contact_email || fallbackContent.contact_email}</p>
                  <p className="text-blue-200 font-light text-sm">Téléphone: {filialeData?.telephone || content?.contact_phone || fallbackContent.contact_phone}</p>
                </div>
              </div>
              
              <div>
                {formStatus === 'success' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium">Votre demande a été envoyée !</p>
                    <p className="text-green-600 text-sm">Référence: {reference}</p>
                    <p className="text-green-700 text-sm mt-1">Notre département commercial export vous contactera dans les plus brefs délais.</p>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        <MessageCircle size={18} />
                        Envoyer via WhatsApp
                      </a>
                    )}
                    <div className="mt-4">
                      <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-100" onClick={() => { setFormStatus('idle'); setReference(''); setWhatsappUrl(''); }}>Nouvelle demande</Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="bg-white p-8 border border-white/10 shadow-2xl">
                    <h3 className="text-2xl font-serif text-black mb-8">Formulaire de Commande Gros Volume</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Nom / Centrale d'achat</label>
                        <Input required placeholder="Votre entité" value={formData.nom_complet} onChange={(e) => setFormData({ ...formData, nom_complet: e.target.value })} className="border-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Email acheteur</label>
                        <Input required type="email" placeholder="contact@..." value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border-gray-200" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Type de produit</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary">
                          <option>Poissons Pélagiques (Congelés)</option>
                          <option>Poissons Démersaux</option>
                          <option>Céphalopodes</option>
                          <option>Produits transformés (Filets)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Volume souhaité (Tonnage)</label>
                        <Input placeholder="Ex: 50 Tonnes / mois" value={formData.objet} onChange={(e) => setFormData({ ...formData, objet: e.target.value })} className="border-gray-200" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Destination (Pays/Port)</label>
                        <Input required placeholder="Ex: Port de Valence, Espagne" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="border-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500">Incoterm Souhaité</label>
                        <select className="flex h-10 w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary">
                          <option>FOB Conakry</option>
                          <option>CFR</option>
                          <option>CIF</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      <label className="text-xs uppercase tracking-widest text-gray-500">Spécifications Qualité / Calibrage</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="flex w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary"
                        placeholder="Précisez le calibre attendu, type de conditionnement (cartons, blocs)..."
                      />
                    </div>
                    <Button variant="luxury" size="lg" className="w-full bg-primary text-white hover:bg-primary/90" disabled={formStatus === 'loading'}>
                      {formStatus === 'loading' ? 'Envoi...' : 'Solliciter le département commercial'}
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
