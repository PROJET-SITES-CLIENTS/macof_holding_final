import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Megaphone,
  RefreshCw,
  Users,
  Send,
  Trash2,
  ImageIcon,
  Film,
  X,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AdminPage, SaveButton } from '@/components/ui/AdminPage';
import { api } from '@/lib/api';

interface Campaign {
  id: number;
  titre: string;
  message: string;
  media_url: string | null;
  media_type: string | null;
  cta_label: string | null;
  cta_url: string | null;
  statut: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

interface Stats {
  abonnes: number;
  campagnes: number;
  push_configure: boolean;
  derniere: { id: number; titre: string; sent_at: string; sent_count: number } | null;
}

const CTA_PRESETS = [
  { label: 'Commander un plat', value: '/restauration' },
  { label: 'Demander un devis', value: '/contact' },
  { label: 'Voir le menu', value: '/restauration#menu' },
  { label: 'Voir la galerie', value: '/galerie' },
  { label: 'Nos catalogues', value: '/catalogues' },
  { label: 'Accueil', value: '/' },
];

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * NotificationsManager — Création et diffusion de campagnes publicitaires
 * par notification push à tous les abonnés de l'application mobile.
 */
export default function NotificationsManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    message: '',
    cta_label: '',
    cta_url: '',
  });

  const statsQuery = useQuery<Stats>({
    queryKey: ['pushStats'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/notifications/stats');
      return res.data.data;
    },
  });

  const campaignsQuery = useQuery<Campaign[]>({
    queryKey: ['pushCampaigns'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/notifications');
      return res.data.data;
    },
  });

  const loading = statsQuery.isLoading || campaignsQuery.isLoading;
  const stats = statsQuery.data;
  const campaigns = campaignsQuery.data ?? [];
  const [sending, setSending] = useState(false);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const isImage = selected.type.startsWith('image/');
    const isVideo = selected.type === 'video/mp4' || selected.type === 'video/webm';
    if (!isImage && !isVideo) {
      toast.error('Format non supporté. Utilisez une image, un GIF ou une vidéo MP4/WebM.');
      return;
    }
    if (isVideo && selected.size > 25 * 1024 * 1024) {
      toast.error('Vidéo trop volumineuse (25 Mo maximum).');
      return;
    }
    if (isImage && selected.size > 8 * 1024 * 1024) {
      toast.error('Image trop volumineuse (8 Mo maximum).');
      return;
    }
    setFile(selected);
    setFilePreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const send = async () => {
    if (form.titre.trim().length < 3 || form.message.trim().length < 3) {
      toast.error('Le titre et le message sont requis (3 caractères minimum).');
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('titre', form.titre.trim());
      formData.append('message', form.message.trim());
      if (form.cta_label.trim()) formData.append('cta_label', form.cta_label.trim());
      if (form.cta_url.trim()) formData.append('cta_url', form.cta_url.trim());
      if (file) formData.append('media', file);

      const res = await api.post('/api/v1/admin/notifications', formData);
      const rapport = res.data?.data?.rapport;
      toast.success(
        rapport
          ? `Notification envoyée à ${rapport.sent} abonné(s)${rapport.failed ? ` (${rapport.failed} échec(s))` : ''}`
          : 'Notification envoyée'
      );
      setForm({ titre: '', message: '', cta_label: '', cta_url: '' });
      clearFile();
      setConfirmSend(false);
      queryClient.invalidateQueries({ queryKey: ['pushCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['pushStats'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Échec de l’envoi de la campagne');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/admin/notifications/${deleteTarget.id}`);
      toast.success('Campagne supprimée');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['pushCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['pushStats'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Échec de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const abonnes = stats?.abonnes ?? 0;

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
              Communication
            </p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100">Notifications & Publicités</h2>
            <p className="mt-1 text-sm text-slate-500">
              Envoyez des annonces push à tous les utilisateurs de l'application mobile.
            </p>
          </div>
          <button
            onClick={() => {
              statsQuery.refetch();
              campaignsQuery.refetch();
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d]"
          >
            <RefreshCw className={`h-4 w-4 ${statsQuery.isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {stats && !stats.push_configure && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">Notifications push non configurées</p>
              <p className="mt-0.5 text-xs text-amber-400/70">
                Les clés VAPID manquent côté serveur — les envois échoueront. Contactez l'administrateur technique.
              </p>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#cda434]/[0.08] to-transparent blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#cda434]/25 to-[#cda434]/5 ring-1 ring-[#cda434]/25">
                <Users className="h-5 w-5 text-[#e0b83d]" />
              </div>
            </div>
            <p className="relative mt-5 text-3xl font-bold tracking-tight text-slate-100">{abonnes}</p>
            <p className="relative mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              Abonnés notifiables
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/[0.07] to-transparent blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 ring-1 ring-blue-500/20">
                <Megaphone className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <p className="relative mt-5 text-3xl font-bold tracking-tight text-slate-100">
              {stats?.campagnes ?? 0}
            </p>
            <p className="relative mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              Campagnes diffusées
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/[0.07] to-transparent blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20">
                <History className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <p className="relative mt-4 text-sm font-semibold leading-snug text-slate-200">
              {stats?.derniere ? stats.derniere.titre : 'Aucune diffusion'}
            </p>
            <p className="relative mt-1.5 text-xs text-slate-500">
              {stats?.derniere
                ? `${formatDateTime(stats.derniere.sent_at)} · ${stats.derniere.sent_count} envoi(s)`
                : 'Créez votre première campagne'}
            </p>
          </div>
        </div>

        {/* Composeur */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-6 py-4">
            <Megaphone className="h-4 w-4 text-[#cda434]" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">
              Nouvelle campagne publicitaire
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-5">
            {/* Formulaire */}
            <div className="space-y-5 lg:col-span-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Titre de la notification *
                </label>
                <input
                  type="text"
                  value={form.titre}
                  maxLength={200}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex : -20% sur tous nos plats ce week-end !"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Ex : Profitez de notre offre spéciale jusqu'à dimanche soir. Commandez directement depuis l'application !"
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30"
                />
                <p className="mt-1 text-right text-[11px] text-slate-600">{form.message.length}/500</p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Action au clic (bouton de la publicité)
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={form.cta_label}
                    maxLength={100}
                    onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
                    placeholder="Texte du bouton (ex : Commander)"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30"
                  />
                  <input
                    type="text"
                    value={form.cta_url}
                    onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))}
                    placeholder="Lien (ex : /restauration)"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CTA_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, cta_label: f.cta_label || preset.label, cta_url: preset.value }))
                      }
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-400 transition-all hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Média + envoi */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Affiche / GIF / Vidéo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  onChange={onFileChange}
                  className="hidden"
                />
                {filePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                    {file?.type.startsWith('video/') ? (
                      <video src={filePreview} className="h-44 w-full bg-black object-contain" muted loop autoPlay playsInline />
                    ) : (
                      <img src={filePreview} alt="Aperçu du média" className="h-44 w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-slate-300 transition-colors hover:bg-red-500/70 hover:text-white"
                      aria-label="Retirer le média"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-2 text-[11px] text-slate-400">
                      {file?.type.startsWith('video/') ? (
                        <Film className="h-3.5 w-3.5 text-[#e0b83d]" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-[#e0b83d]" />
                      )}
                      {file?.name} · {((file?.size ?? 0) / 1024 / 1024).toFixed(1)} Mo
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-slate-500 transition-all hover:border-[#cda434]/40 hover:bg-[#cda434]/5 hover:text-[#e0b83d]"
                  >
                    <ImageIcon className="h-7 w-7" />
                    <span className="text-xs font-medium">Cliquez pour choisir un média</span>
                    <span className="text-[10px] text-slate-600">Image, GIF (8 Mo) ou vidéo MP4 (25 Mo)</span>
                  </button>
                )}
              </div>

              {confirmSend ? (
                <div className="rounded-xl border border-[#cda434]/25 bg-[#cda434]/[0.07] p-4">
                  <p className="text-sm font-medium text-slate-100">Confirmer la diffusion</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    La notification sera envoyée immédiatement aux <strong className="text-[#e0b83d]">{abonnes}</strong>{' '}
                    abonné(s). Elle apparaîtra sur leurs téléphones même application fermée.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || abonnes === 0}
                      className="flex-1 rounded-lg bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-3 py-2 text-xs font-semibold text-[#1a1405] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? 'Envoi en cours…' : abonnes === 0 ? 'Aucun abonné' : 'Oui, envoyer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmSend(false)}
                      disabled={sending}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <SaveButton
                  saving={sending}
                  onClick={() => setConfirmSend(true)}
                  label={`Envoyer à ${abonnes} abonné(s)`}
                  savingLabel="Envoi en cours…"
                  Icon={Send}
                  className="w-full justify-center"
                />
              )}
            </div>
          </div>
        </div>

        {/* Historique */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-6 py-4">
            <History className="h-4 w-4 text-[#cda434]" />
            <h3 className="text-sm font-semibold tracking-wide text-slate-100">Historique des campagnes</h3>
            <span className="ml-auto rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-400">
              {campaigns.length}
            </span>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Date</th>
                  <th className="px-6 py-3.5 font-medium">Titre</th>
                  <th className="px-6 py-3.5 font-medium">Média</th>
                  <th className="px-6 py-3.5 font-medium">Envois</th>
                  <th className="px-6 py-3.5 font-medium">Statut</th>
                  <th className="px-6 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.04] transition-colors duration-300 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-slate-500">{formatDateTime(c.sent_at || c.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{c.titre}</div>
                      <div className="mt-0.5 max-w-md truncate text-xs text-slate-500">{c.message}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {c.media_url ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          {c.media_type === 'video' ? (
                            <Film className="h-3.5 w-3.5 text-[#e0b83d]" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-[#e0b83d]" />
                          )}
                          {c.media_type === 'video' ? 'Vidéo' : 'Image'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {c.sent_count}
                      </span>
                      {c.failed_count > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500">
                          {c.failed_count} échec(s)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                          c.statut === 'envoyee'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : c.statut === 'erreur'
                              ? 'border-red-500/20 bg-red-500/10 text-red-400'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            c.statut === 'envoyee' ? 'bg-emerald-400' : c.statut === 'erreur' ? 'bg-red-400' : 'bg-amber-400'
                          }`}
                        />
                        {c.statut === 'envoyee' ? 'Envoyée' : c.statut === 'erreur' ? 'Erreur' : c.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
                          <Megaphone className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-slate-300">Aucune campagne pour le moment</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Composez votre première publicité : elle sera envoyée à tous les abonnés de l'application.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation suppression */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#101a2e] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Supprimer cette campagne ?</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    « {deleteTarget.titre} » sera retirée de l'historique. Les notifications déjà reçues ne sont pas
                    concernées.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Suppression…' : 'Supprimer'}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
