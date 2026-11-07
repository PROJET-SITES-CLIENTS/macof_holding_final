import { AnimatedPage } from '../components/layout/AnimatedPage';
import { ContactForm } from '../components/ContactForm';
import { useSettings } from '../hooks/useSettings';
import { MapPin, Phone, Mail, Clock, Building2, Globe2, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DOMPurify from 'dompurify';

// Fallback data
const FALLBACK = {
  title: 'Lignes Directes',
  subtitle: "Nos équipes dédiées sont à votre entière disposition pour répondre à vos demandes de partenariat, de cotation ou d'informations sur l'ensemble de nos pôles d'activités.",
  siege_name: 'Siège MACOF Holding',
  adresse: 'Manquepa en face de banc bleu\nKaloum, République de Guinée',
  telephone: '+224 625 74 46 26 / 623 98 75 11',
  email: 'macofholding2018@gmail.com',
  horaires: 'Lundi - Vendredi : 08h00 - 18h00\nSamedi : 09h00 - 13h00',
  map_label: 'Siège MACOF, Kaloum',
  map_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15764.128795550267!2d-13.7153676!3d9.510001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzAnMzYuMCJOIDEzwrA0MicyNS4zIlc!5e0!3m2!1sfr!2s!4v1600000000000!5m2!1sfr!2s',
};

const FALLBACK_FILIALES = [
  { nom: 'MACOF Holding' },
  { nom: 'MACOF Immobilier', slug: 'immobilier' },
  { nom: 'SEBA International', slug: 'restauration' },
  { nom: 'MACOF Transit', slug: 'transit' },
  { nom: 'MACOF Mining', slug: 'mining' },
  { nom: 'MACOF Print & Com', slug: 'print' },
  { nom: 'MACOF Fishing', slug: 'fishing' },
];

export default function Contact() {
  const { data } = useQuery({
    queryKey: ['contactData'],
    queryFn: async () => {
      let pageData = null;
      let filialesData = [];

      // 1. Récupération des données de la page Contact
      try {
        const pageRes = await api.get('/pages/contact');
        if (pageRes.data?.success) {
          pageData = pageRes.data.data;
        }
      } catch (e) {
        console.warn("Info: Page CMS contact non configurée ou introuvable, utilisation du fallback.");
      }

      // 2. Récupération des filiales (changement de /api/v1/filiales -> /filiales)
      try {
        const filialesRes = await api.get('/filiales');
        if (filialesRes.data?.success) {
          const raw = filialesRes.data.data;
          filialesData = Array.isArray(raw) ? raw : (raw?.items || []);
        }
      } catch (e) {
        console.warn("Info: Endpoint filiales introuvable, utilisation du fallback.");
      }

      return {
        content: pageData,
        filiales: filialesData
      };
    },
    retry: false // Évite de re-tester inutilement si une route 404 est appelée
  });

  const { settings } = useSettings();

  const c = data?.content || {};
  const filialeList = data?.filiales?.length ? data.filiales : FALLBACK_FILIALES;

  const adresse = c.adresse || settings.contact_address || FALLBACK.adresse;
  const telephone = c.telephone || settings.contact_phone || FALLBACK.telephone;
  const email = c.email || settings.contact_email || FALLBACK.email;
  const emails = email.split(/[;,\n]+/).map((item: string) => item.trim()).filter(Boolean);
  const horaires = c.horaires || FALLBACK.horaires;

  return (
    <AnimatedPage className="bg-background min-h-screen">
      
      {/* Hero Contact */}
      <section className="relative pt-32 pb-24 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-[0.08] mix-blend-screen mask-image-gradient-l" />
        
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-primary/30 bg-primary/10 mb-8">
              <Globe2 className="text-primary" size={16} />
              <span className="text-primary text-xs uppercase tracking-widest font-semibold">Présence Internationale</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-8 leading-[1.1]">
              {c.title ? (
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.title) }} />
              ) : (
                <>Contactez <br/><span className="italic text-primary font-normal">MACOF Holding</span></>
              )}
            </h1>
            <p className="text-xl text-white/70 font-sans font-light leading-relaxed">
              {c.subtitle || FALLBACK.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Split-Screen Contact */}
      <section className="py-24 bg-background border-t border-white/5">
        <div className="max-w-[100rem] mx-auto px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24 items-start">
            
            {/* Colonne de Gauche : Coordonnées */}
            <div className="space-y-12">
              
              {/* Carte Siège Social */}
              <div className="relative h-72 w-full overflow-hidden bg-card border border-white/10 group">
                <img 
                  src="https://media.istockphoto.com/id/2151279547/photo/business-thinking-or-black-woman-in-office-with-laptop-insight-or-decision-planning-or.webp?a=1&b=1&s=612x612&w=0&k=20&c=ezzg81O81KydwktxCV6XlaZDLs7CAbf7fNjKc_48RbM=" 
                  alt="Siège Social" 
                  className="w-full h-full object-cover opacity-60 filter grayscale-[50%] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="text-primary" size={24} />
                    <h3 className="text-xl font-serif text-white">{c.siege_name || FALLBACK.siege_name}</h3>
                  </div>
                  <p className="text-white/80 font-sans text-sm whitespace-pre-line tracking-wide">
                    {adresse}
                  </p>
                </div>
              </div>

              {/* Coordonnées Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Phone className="text-primary" size={20} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-white font-serif text-lg mb-2">Lignes Téléphoniques</h4>
                  <p className="text-white/60 font-light text-sm">{telephone}</p>
                </div>
                
                <div className="p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Mail className="text-primary" size={20} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-white font-serif text-lg mb-2">Adresse Email</h4>
                  <div className="space-y-1">
                    {emails.map((item: string) => <p key={item} className="text-white/60 font-light text-sm">{item}</p>)}
                  </div>
                </div>

                {settings.whatsapp_number && (
                  <div className="p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <MessageCircle className="text-primary" size={20} strokeWidth={1.5} />
                    </div>
                    <h4 className="text-white font-serif text-lg mb-2">WhatsApp</h4>
                    <a
                      href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 font-light text-sm hover:text-primary transition-colors"
                    >
                      {settings.whatsapp_number}
                    </a>
                  </div>
                )}
              </div>

              {/* Horaires & Lignes Filiales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Clock className="text-primary" size={20} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-white font-serif text-lg mb-2">Horaires d'Ouverture</h4>
                  <p className="text-white/60 font-light text-sm whitespace-pre-line">{horaires}</p>
                </div>

                <div className="p-6 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Globe2 className="text-primary" size={20} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-white font-serif text-lg mb-2">Départements</h4>
                  <ul className="text-white/60 font-light text-sm space-y-1">
                    {filialeList.slice(0, 4).map((f: any, i: number) => (
                      <li key={f.id || f.slug || i}>— {f.nom}</li>
                    ))}
                    {filialeList.length > 4 && <li>— Et autres filiales...</li>}
                  </ul>
                </div>
              </div>

            </div>

            {/* Colonne de Droite : Formulaire */}
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/5 blur-3xl rounded-full z-0 pointer-events-none"></div>
              <div className="relative z-10 bg-white p-8 md:p-14 shadow-2xl">
                <h2 className="text-4xl font-serif text-black mb-4">Envoyer un Message</h2>
                <p className="text-gray-500 font-light text-base mb-10 leading-relaxed">
                  Sélectionnez le département concerné via le formulaire ci-dessous pour un traitement rapide et ciblé de votre requête.
                </p>
                <div className="contact-form-wrapper">
                  <ContactForm 
                    filiales={filialeList} 
                    filiale="MACOF Holding" 
                    typeDemande="information" 
                    titre="" 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Carte Google Maps */}
          <div className="mt-24 border border-white/10 bg-white/5 relative h-[400px]">
            <iframe
              src={c.map_embed || FALLBACK.map_embed}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%) grayscale(50%)' }}
              allowFullScreen={false}
              loading="lazy"
              title="Carte Siège MACOF"
            ></iframe>
            <div className="absolute top-6 left-6 bg-background/95 backdrop-blur-md px-6 py-3 border border-white/10 shadow-xl">
              <span className="text-xs uppercase tracking-widest text-primary font-sans font-semibold flex items-center gap-2">
                <MapPin size={14} /> {c.map_label || FALLBACK.map_label}
              </span>
            </div>
          </div>

        </div>
      </section>

    </AnimatedPage>
  );
}