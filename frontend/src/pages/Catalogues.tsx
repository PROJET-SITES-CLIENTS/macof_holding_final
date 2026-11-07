import { useState, useRef, useEffect } from 'react';
import { AnimatedPage } from '../components/layout/AnimatedPage';
import { Download, X, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import gsap from 'gsap';
import { api } from '@/lib/api';

const fallbackCatalogues = [
  { id: 1, titre: 'Catalogue Général MACOF Holding', description: 'Découvrez l\'ensemble de nos services', filiale: 'MACOF Holding', file_path: '#' },
  { id: 2, titre: 'Catalogue Immobilier', description: 'Nos projets immobiliers', filiale: 'MACOF Immobilier', file_path: '#' },
  { id: 3, titre: 'Catalogue Restauration', description: 'Nos offres de restauration', filiale: 'SEBA International', file_path: '#' },
];

const plaquettePublicUrl = '/plaquette-macof-holding.pdf';

export default function Catalogues() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [leadForm, setLeadForm] = useState({ nom: '', email: '', telephone: '' });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/catalogues')
      .then(res => {
        if (res.data.success) {
          const data = res.data.data;
          setDocuments(Array.isArray(data) ? data : (data.items || []));
        }
      })
      .catch(err => {
        console.error("Erreur de chargement des catalogues", err);
        setDocuments(fallbackCatalogues);
        setError('Erreur de chargement des catalogues');
      });
  }, []);

  useEffect(() => {
    if (documents.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from(".doc-item", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [documents]);

  const handleDownloadRequest = (doc: any) => {
    setSelectedDoc(doc);
    setDownloadStatus('idle');
    setWhatsappUrl('');
    setLeadForm({ nom: '', email: '', telephone: '' });
  };

  const handleDownload = async () => {
    setDownloadStatus('loading');
    try {
      // Send lead data to API first
      const response = await api.post('/demandes', {
        nom_complet: leadForm.nom,
        email: leadForm.email,
        telephone: leadForm.telephone,
        objet: `Demande de catalogue: ${selectedDoc.titre}`,
        message: `Téléchargement du catalogue ${selectedDoc.titre}`,
        type_demande: 'information',
        filiale: selectedDoc.filiale || 'MACOF Holding'
      });
      setWhatsappUrl(response.data.data?.whatsapp_url || '');
      setDownloadStatus('success');
      window.open(selectedDoc.file_path || selectedDoc.fichier_url, '_blank');
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      setDownloadStatus('error');
    }
  };

  return (
    <AnimatedPage className="bg-background pt-32 pb-24 min-h-screen">
      <div ref={containerRef} className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="mb-20 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-serif text-white font-light mb-6">
            Plaquette & <br/><span className="italic text-gradient-corporate">Catalogues</span>
          </h1>
          <p className="text-white font-sans font-light max-w-2xl leading-relaxed">
            Consultez nos brochures détaillées, notre rapport RSE et les présentations de nos filiales. Pour accéder au téléchargement, merci de renseigner vos coordonnées professionnelles.
          </p>
        </div>

        {error && <p className="text-red-500 text-center mb-8">Erreur de chargement des catalogues</p>}

        <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200 mb-2">Document officiel</p>
              <h2 className="text-2xl md:text-3xl font-serif text-white">Plaquette MACOF Holding</h2>
            </div>
            <a
              href={plaquettePublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/60 bg-primary/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary hover:text-black"
            >
              <Download className="w-4 h-4" />
              Télécharger le PDF
            </a>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleDownloadRequest(doc)}
              className="doc-item group flex flex-col md:flex-row md:items-center justify-between p-6 border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-6 mb-4 md:mb-0">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-white/5 text-primary text-xs font-sans tracking-widest border border-white/10 group-hover:border-primary/50 transition-colors uppercase">
                  {doc.format}
                </div>
                <div>
                  <h3 className="text-xl font-serif text-white group-hover:text-primary transition-colors">{doc.titre}</h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-sans text-blue-200 uppercase tracking-wider">{doc.type_document}</span>
                    <span className="text-xs font-sans text-white/50 uppercase tracking-wider">{doc.taille_ko} KB</span>
                  </div>
                </div>
              </div>
              <div className="md:ml-4 self-end md:self-auto">
                <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-primary group-hover:text-primary transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Téléchargement */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-lg border border-white/10 p-8 relative shadow-2xl">
            <button
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedDoc(null)}
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-serif text-white mb-2">Téléchargement</h3>
              <p className="text-blue-200 font-light text-sm">{selectedDoc.titre}</p>
            </div>

            {downloadStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download size={24} />
                </div>
                <h4 className="text-xl font-serif text-white mb-2">Téléchargement démarré</h4>
                <p className="text-white/60 font-light text-sm mb-4">Merci de votre intérêt. Si le téléchargement ne démarre pas, cliquez ci-dessous.</p>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    <MessageCircle size={18} />
                    Envoyer via WhatsApp
                  </a>
                )}
                <div className="mt-2">
                  <Button variant="outline" onClick={() => { setSelectedDoc(null); setWhatsappUrl(''); }} className="w-full text-white border-white hover:bg-white hover:text-black">
                    Fermer
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleDownload(); }}>
                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50">Nom / Société *</label>
                    <Input required placeholder="Votre nom" value={leadForm.nom} onChange={(e) => setLeadForm({ ...leadForm, nom: e.target.value })} className="bg-background border-white/10 text-white placeholder:text-white/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50">Email Professionnel *</label>
                    <Input required type="email" placeholder="email@domaine.com" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} className="bg-background border-white/10 text-white placeholder:text-white/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-white/50">Téléphone (Optionnel)</label>
                    <Input placeholder="+224 ..." value={leadForm.telephone} onChange={(e) => setLeadForm({ ...leadForm, telephone: e.target.value })} className="bg-background border-white/10 text-white placeholder:text-white/30" />
                  </div>
                </div>

                <p className="text-[10px] text-white/40 leading-relaxed mb-6 font-light">
                  En téléchargeant ce document, vous acceptez d'être recontacté par nos équipes commerciales. Vos données restent strictement confidentielles.
                </p>

                <Button variant="luxury" className="w-full" disabled={downloadStatus === 'loading'}>
                  {downloadStatus === 'loading' ? 'Validation...' : 'Accéder au document'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

    </AnimatedPage>
  );
}
