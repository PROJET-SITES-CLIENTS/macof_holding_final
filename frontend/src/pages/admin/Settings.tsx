import { useState, useEffect, useRef } from 'react';
import {
  Save,
  RefreshCw,
  Mail,
  Phone,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Settings as SettingsIcon,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { AdminPage } from '@/components/ui/AdminPage';
import { useSettings } from '@/hooks/useSettings';
import { api } from '@/lib/api';

interface SettingsData {
  smtp_host: string;
  smtp_port: number;
  smtp_email: string;
  smtp_password: string;
  smtp_secure: boolean;
  notification_email: string;
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  social_twitter: string;
  restauration_frais_livraison_gnf: number;
  restauration_acompte_pourcent: number;
}

const maskedPassword = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

export default function Settings() {
  const { settings, loading, saving, testingSmtp, saveSettings, testSmtp } = useSettings();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwdFields, setShowPwdFields] = useState(false);

  const handlePasswordChange = async () => {
    if (pwd.next.length < 8) {
      setNotification({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setNotification({ type: 'error', message: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    setPwdSaving(true);
    try {
      const res = await api.put('/api/v1/admin/profile/password', {
        current_password: pwd.current,
        new_password: pwd.next,
      });
      if (res.data?.success) {
        setNotification({ type: 'success', message: 'Mot de passe mis à jour avec succès.' });
        setPwd({ current: '', next: '', confirm: '' });
        setShowPwdFields(false);
      } else {
        setNotification({ type: 'error', message: res.data?.message || 'Échec de la mise à jour.' });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Échec de la mise à jour du mot de passe.',
      });
    } finally {
      setPwdSaving(false);
    }
  };
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [form, setForm] = useState<SettingsData>({
    smtp_host: '',
    smtp_port: 587,
    smtp_email: '',
    smtp_password: '',
    smtp_secure: false,
    notification_email: '',
    whatsapp_number: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_facebook: '',
    social_linkedin: '',
    social_instagram: '',
    social_twitter: '',
    restauration_frais_livraison_gnf: 0,
    restauration_acompte_pourcent: 30,
  });

  const originalPasswordRef = useRef('');

  // Réglages privés (route admin) : le hook useSettings interroge la route publique,
  // qui ne renvoie jamais les clés smtp_* / notification_email.
  const adminSettingsRef = useRef<Map<string, string> | null>(null);

  const applyAdminSettings = (map: Map<string, string>) => {
    setForm((prev) => ({
      ...prev,
      smtp_host: map.get('smtp_host') || prev.smtp_host,
      smtp_port: parseInt(map.get('smtp_port') || '', 10) || prev.smtp_port,
      smtp_email: map.get('smtp_email') || prev.smtp_email,
      smtp_secure: map.get('smtp_secure') === 'true',
      notification_email: map.get('notification_email') || prev.notification_email,
      // smtp_password volontairement non chargé : champ « laisser vide pour conserver »
    }));
  };

  // Charger les réglages complets via la route admin (map clé → valeur)
  useEffect(() => {
    let cancelled = false;

    api.get('/api/v1/admin/settings')
      .then((res) => {
        const data = res.data?.data;
        if (cancelled || !data || typeof data !== 'object' || Array.isArray(data)) return;
        const map = new Map<string, string>(
          Object.entries(data as Record<string, unknown>)
            .filter(([, value]) => typeof value === 'string')
            .map(([key, value]): [string, string] => [key, String(value)])
        );
        adminSettingsRef.current = map;
        applyAdminSettings(map);
      })
      .catch(() => {
        // Échec silencieux : on garde les valeurs du hook public
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-fermeture des notifications après 4 sec
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Synchroniser le formulaire quand les réglages sont récupérés depuis le hook
  useEffect(() => {
    if (settings) {
      const originalPwd = settings.smtp_password || '';
      originalPasswordRef.current = originalPwd;
      setForm({
        smtp_host: settings.smtp_host || '',
        smtp_port: parseInt(settings.smtp_port || '587', 10) || 587,
        smtp_email: settings.smtp_email || '',
        smtp_password: originalPwd ? maskedPassword : '',
        smtp_secure: settings.smtp_secure === 'true',
        notification_email: settings.notification_email || '',
        whatsapp_number: settings.whatsapp_number || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        contact_address: settings.contact_address || '',
        social_facebook: settings.social_facebook || '',
        social_linkedin: settings.social_linkedin || '',
        social_instagram: settings.social_instagram || '',
        social_twitter: settings.social_twitter || '',
        restauration_frais_livraison_gnf: parseInt(settings.restauration_frais_livraison_gnf || '0', 10) || 0,
        restauration_acompte_pourcent: parseInt(settings.restauration_acompte_pourcent || '30', 10) || 30,
      });
      setPasswordChanged(false);
      // Les clés privées arrivent d'une route séparée : les ré-appliquer si déjà reçues
      if (adminSettingsRef.current) {
        applyAdminSettings(adminSettingsRef.current);
      }
    }
  }, [settings]);

  const updateForm = (key: keyof SettingsData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'smtp_password') {
      setPasswordChanged(true);
    }
  };

  const getPasswordValue = (): string => {
    if (!passwordChanged) return '';
    if (form.smtp_password === maskedPassword) return '';
    return form.smtp_password;
  };

  const handleSave = async () => {
    const payload: Record<string, string> = {
      smtp_host: form.smtp_host,
      smtp_port: String(form.smtp_port),
      smtp_email: form.smtp_email,
      smtp_secure: String(form.smtp_secure),
      notification_email: form.notification_email,
      whatsapp_number: form.whatsapp_number,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      contact_address: form.contact_address,
      social_facebook: form.social_facebook,
      social_linkedin: form.social_linkedin,
      social_instagram: form.social_instagram,
      social_twitter: form.social_twitter,
      restauration_frais_livraison_gnf: String(form.restauration_frais_livraison_gnf),
      restauration_acompte_pourcent: String(form.restauration_acompte_pourcent),
    };

    const pwd = getPasswordValue();
    if (pwd) {
      payload.smtp_password = pwd;
    }

    const res = await saveSettings(payload);
    if (res.success) {
      setNotification({ type: 'success', message: res.message });
      setPasswordChanged(false);
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleTestEmail = async () => {
    if (!form.contact_email) {
      setNotification({ type: 'error', message: 'Veuillez renseigner un e-mail public pour recevoir le test.' });
      return;
    }
    const res = await testSmtp(form.contact_email);
    if (res.success) {
      setNotification({ type: 'success', message: res.message });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleTestWhatsApp = () => {
    const number = (form.whatsapp_number || '').replace(/\s/g, '');
    const message = encodeURIComponent("Test depuis le panel d'administration MACOF.");
    const url = `https://wa.me/${number}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <AdminPage loading={loading} className="space-y-8">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Configuration</p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
              <SettingsIcon className="h-5 w-5" />
            </span>
            Paramètres généraux
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configuration des contacts, SMTP et réseaux sociaux.
          </p>
        </div>

        {/* Bouton de sauvegarde */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleSave();
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#cda434]/10"
        >
          <span className="relative flex items-center justify-center h-4 w-4">
            <Save className={`h-4 w-4 absolute transition-opacity ${saving ? 'opacity-0' : 'opacity-100'}`} />
            <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${saving ? 'opacity-100' : 'opacity-0'}`} />
          </span>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Colonne 1: Infos publiques */}
        <div className="space-y-6">
          {/* Contacts Publics */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#cda434]" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide">Contacts Publics</h3>
              </div>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Email public</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateForm('contact_email', e.target.value)}
                  placeholder="info@macof-holding.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Téléphone public</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => updateForm('contact_phone', e.target.value)}
                  placeholder="+224 620 00 00 00"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Adresse complète</label>
                <textarea
                  rows={2}
                  value={form.contact_address}
                  onChange={(e) => updateForm('contact_address', e.target.value)}
                  placeholder="Kipé, Commune de Ratoma, Conakry, Guinée"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Numéro WhatsApp (Bouton flottant)</label>
                <input
                  type="text"
                  value={form.whatsapp_number}
                  onChange={(e) => updateForm('whatsapp_number', e.target.value)}
                  placeholder="+224XXXXXXXX"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Réseaux Sociaux */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#cda434]" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide">Réseaux Sociaux</h3>
              </div>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  <Globe className="h-4 w-4" /> LinkedIn
                </label>
                <input
                  type="url"
                  value={form.social_linkedin}
                  onChange={(e) => updateForm('social_linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/macof"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  <Globe className="h-4 w-4" /> Facebook
                </label>
                <input
                  type="url"
                  value={form.social_facebook}
                  onChange={(e) => updateForm('social_facebook', e.target.value)}
                  placeholder="https://facebook.com/macof"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  <Globe className="h-4 w-4" /> Instagram
                </label>
                <input
                  type="url"
                  value={form.social_instagram}
                  onChange={(e) => updateForm('social_instagram', e.target.value)}
                  placeholder="https://instagram.com/macof"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  <Globe className="h-4 w-4" /> Twitter (X)
                </label>
                <input
                  type="url"
                  value={form.social_twitter}
                  onChange={(e) => updateForm('social_twitter', e.target.value)}
                  placeholder="https://twitter.com/macof"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 2: Infos techniques */}
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#cda434]" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide">Configuration SMTP (Envoi d'emails)</h3>
              </div>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Hôte SMTP</label>
                <input
                  type="text"
                  value={form.smtp_host}
                  onChange={(e) => updateForm('smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Port SMTP</label>
                <input
                  type="number"
                  value={form.smtp_port}
                  onChange={(e) => updateForm('smtp_port', parseInt(e.target.value, 10) || 587)}
                  min={1}
                  max={65535}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Email expéditeur (Identifiant)</label>
                <input
                  type="email"
                  value={form.smtp_email}
                  onChange={(e) => updateForm('smtp_email', e.target.value)}
                  placeholder="no-reply@macof-holding.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                      <input
                        type="checkbox"
                        checked={form.smtp_secure}
                        onChange={(e) => updateForm('smtp_secure', e.target.checked)}
                        className="h-4 w-4 rounded accent-[#cda434] cursor-pointer"
                      />
                  Connexion sécurisée implicite TLS/SSL (port 465)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Email de notification (nouvelles demandes)</label>
                <input
                  type="email"
                  value={form.notification_email}
                  onChange={(e) => updateForm('notification_email', e.target.value)}
                  placeholder="notifications@macof-holding.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Mot de passe SMTP</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.smtp_password}
                    onChange={(e) => updateForm('smtp_password', e.target.value)}
                    placeholder="Laisser vide pour ne pas modifier"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!passwordChanged && form.smtp_password && (
                  <p className="text-xs text-slate-500 mt-1">
                    Mot de passe masqué. Modifiez le champ pour le mettre à jour.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]"><h3 className="text-sm font-semibold text-slate-100 tracking-wide">Commandes SEBA</h3></div>
            <div className="px-6 py-6 space-y-5">
              <div><label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Frais de livraison (GNF)</label><input type="number" min="0" value={form.restauration_frais_livraison_gnf} onChange={(e) => updateForm('restauration_frais_livraison_gnf', parseInt(e.target.value, 10) || 0)} className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all" /></div>
              <div><label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Acompte en ligne (%)</label><input type="number" min="1" max="100" value={form.restauration_acompte_pourcent} onChange={(e) => updateForm('restauration_acompte_pourcent', parseInt(e.target.value, 10) || 30)} className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all" /></div>
            </div>
          </div>

          {/* Test Section */}
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#cda434]" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wide">Tests système</h3>
              </div>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTestEmail();
                  }}
                  disabled={testingSmtp}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10"
                >
                  {testingSmtp ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {testingSmtp ? 'Envoi…' : 'Tester SMTP'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTestWhatsApp();
                  }}
                  disabled={!form.whatsapp_number}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <Phone className="h-4 w-4" />
                  Tester WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sécurité du compte — changement de mot de passe */}
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#cda434]" />
              <h3 className="text-sm font-semibold text-slate-100 tracking-wide">Sécurité du compte</h3>
            </div>
            {!showPwdFields && (
              <button
                type="button"
                onClick={() => setShowPwdFields(true)}
                className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                <KeyRound className="h-4 w-4" />
                Changer mon mot de passe
              </button>
            )}
          </div>
          {showPwdFields && (
            <div className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Mot de passe actuel *</label>
                  <input
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Nouveau mot de passe *</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="Min. 8 caractères"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Confirmer *</label>
                  <input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPwdFields(false);
                    setPwd({ current: '', next: '', confirm: '' });
                  }}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={pwdSaving || !pwd.current || pwd.next.length < 8 || !pwd.confirm}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {pwdSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Mettre à jour
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}