import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

export interface FilialeOption {
  id?: number;
  nom: string;
  slug?: string;
}

interface ContactFormProps {
  filiales?: FilialeOption[];
  filiale?: string;
  typeDemande?: string;
  titre?: string;
}

const DEFAULT_FILIALES: FilialeOption[] = [
  { nom: 'MACOF Holding' },
  { nom: 'MACOF Immobilier' },
  { nom: 'SEBA International' },
  { nom: 'MACOF Transit' },
  { nom: 'MACOF Mining' },
  { nom: 'MACOF Print & Com' },
  { nom: 'MACOF Fishing' },
];

export function ContactForm({
  filiales,
  filiale = 'MACOF Holding',
  typeDemande = 'information',
  titre = 'Nous Contacter',
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    nom_complet: '',
    email: '',
    telephone: '',
    objet: '',
    message: '',
    type_demande: typeDemande,
    filiale: filiale,
  });

  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reference, setReference] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Met à jour la filiale si la prop par défaut change
  useEffect(() => {
    if (filiale) {
      setFormData((prev) => ({ ...prev, filiale }));
    }
  }, [filiale]);

  const listFiliales = filiales && filiales.length > 0 ? filiales : DEFAULT_FILIALES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    setErrorMsg('');

    try {
      const response = await api.post('/demandes', {
        ...formData,
        type_demande: typeDemande,
      });

      if (response.data?.success) {
        setReference(response.data.data?.reference || '');
        setWhatsappUrl(response.data.data?.whatsapp_url || '');
        setFormStatus('success');
        setFormData({
          nom_complet: '',
          email: '',
          telephone: '',
          objet: '',
          message: '',
          type_demande: typeDemande,
          filiale: filiale,
        });
      } else {
        setErrorMsg(response.data?.message || "Une erreur est survenue lors de l'envoi.");
        setFormStatus('error');
      }
    } catch (err: any) {
      console.error('Erreur formulaire contact:', err);
      const backendMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(backendMsg || "Une erreur est survenue lors de l'envoi.");
      setFormStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (formStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center shadow-sm">
        <p className="text-green-800 font-medium text-lg mb-1">Votre demande a été envoyée !</p>
        {reference && (
          <p className="text-green-700 font-mono text-sm mb-2">Référence : {reference}</p>
        )}
        <p className="text-green-600 font-light text-sm">
          Notre équipe vous contactera dans les plus brefs délais.
        </p>

        {whatsappUrl && (
          <div className="mt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-md font-medium text-sm hover:bg-green-700 transition-colors shadow-sm"
            >
              <MessageCircle size={18} />
              Poursuivre sur WhatsApp
            </a>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="outline"
            className="text-green-700 border-green-300 hover:bg-green-100"
            onClick={() => {
              setFormStatus('idle');
              setReference('');
              setWhatsappUrl('');
            }}
          >
            Envoyer un autre message
          </Button>
        </div>
      </div>
    );
  }

  if (formStatus === 'error') {
    return (
      <div className="bg-red-50 p-8 border border-red-200 rounded-lg text-center shadow-sm">
        <h3 className="text-xl font-serif text-red-600 mb-2">Erreur lors de l'envoi</h3>
        <p className="text-gray-600 font-light text-sm mb-6">
          {errorMsg || 'Une erreur est survenue. Veuillez réessayer.'}
        </p>
        <Button
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-100"
          onClick={() => {
            setFormStatus('idle');
            setErrorMsg('');
          }}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-transparent">
      {titre && <h3 className="text-3xl font-serif text-black mb-8">{titre}</h3>}

      {/* Sélection de la filiale / département */}
      <div className="space-y-2 mb-6">
        <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
          Département / Filiale Destinataire
        </label>
        <select
          name="filiale"
          value={formData.filiale}
          onChange={handleChange}
          className="flex h-11 w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary transition-colors"
        >
          {listFiliales.map((f, idx) => (
            <option key={f.id || f.slug || idx} value={f.nom}>
              {f.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
            Nom Complet *
          </label>
          <Input
            required
            name="nom_complet"
            value={formData.nom_complet}
            onChange={handleChange}
            placeholder="Jean Dupont"
            className="border-gray-200 text-black placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
            Téléphone *
          </label>
          <Input
            required
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="+224 600 00 00 00"
            className="border-gray-200 text-black placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
          Adresse Email *
        </label>
        <Input
          required
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="jean@exemple.com"
          className="border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
          Objet de la demande *
        </label>
        <Input
          required
          name="objet"
          value={formData.objet}
          onChange={handleChange}
          placeholder="Demande de partenariat, cotation..."
          className="border-gray-200 text-black placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2 mb-8">
        <label className="text-xs font-sans uppercase tracking-widest text-gray-500 font-medium">
          Votre Message *
        </label>
        <textarea
          required
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="flex w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:border-primary transition-all placeholder:text-gray-400 resize-y"
          placeholder="Décrivez votre projet ou votre demande..."
        />
      </div>

      <Button
        type="submit"
        variant="luxury"
        size="lg"
        className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
        disabled={formStatus === 'loading'}
      >
        {formStatus === 'loading' ? 'Envoi en cours...' : 'Envoyer la demande'}
      </Button>
    </form>
  );
}