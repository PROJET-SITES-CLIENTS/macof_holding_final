import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  Users,
  X,
  Link as LinkIcon,
  RefreshCw,
  Info,
} from 'lucide-react';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface Partenaire {
  nom: string;
  logo_url: string;
}

export default function PartenairesManager() {
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/pages/home');
      if (res.data?.success && res.data?.data?.partenaires) {
        try {
          const parsed = typeof res.data.data.partenaires === 'string'
            ? JSON.parse(res.data.data.partenaires)
            : res.data.data.partenaires;
          setPartenaires(Array.isArray(parsed) ? parsed : []);
        } catch {
          setPartenaires([]);
        }
      } else {
        setPartenaires([]);
      }
    } catch (err) {
      console.error('Erreur fetch partenaires:', err);
      setPartenaires([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Nettoyage de l'objet URL pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSave = async (list: Partenaire[]) => {
    setSaving(true);
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: 'home',
        contents: [
          {
            section_key: 'partenaires',
            content_value: JSON.stringify(list),
            content_type: 'json',
          },
        ],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (err) {
      console.error('Erreur save partenaires:', err);
      alert('Erreur lors de la sauvegarde.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (index: number) => {
    setItemToDelete(index);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    const updated = partenaires.filter((_, i) => i !== itemToDelete);
    const success = await handleSave(updated);
    if (success) {
      setPartenaires(updated);
    }
    setItemToDelete(null);
  };

  const openModal = () => {
    setFormNom('');
    setFormLogoUrl('');
    setFormFile(null);
    setPreviewUrl(null);
    setUseUrlInput(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setFormFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!formNom.trim()) return;
    setUploading(true);
    try {
      let logoUrl = formLogoUrl.trim();

      if (formFile && !useUrlInput) {
        const formData = new FormData();
        formData.append('file', formFile);
        formData.append('folder', 'partenaires');
        const uploadRes = await api.post('/api/v1/admin/upload', formData);
        if (uploadRes.data?.success) {
          logoUrl = uploadRes.data.data?.url || '';
        }
      }

      if (!logoUrl) {
        alert('Veuillez uploader un logo ou fournir une URL.');
        setUploading(false);
        return;
      }

      const updated = [...partenaires, { nom: formNom.trim(), logo_url: logoUrl }];
      const success = await handleSave(updated);
      if (success) {
        setPartenaires(updated);
        closeModal();
      }
    } catch (err) {
      console.error('Erreur ajout partenaire:', err);
      alert("Erreur lors de l'ajout.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* En-tête de page */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Page d'accueil</p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
                <Users className="h-5 w-5" />
              </span>
              Partenaires
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Gérez les logos des partenaires affichés en bande défilante sur la page d'accueil.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
                <CheckCircle className="h-4 w-4" />
                Sauvegardé
              </div>
            )}
            <button
              onClick={openModal}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#cda434]/10"
            >
              <Plus className="h-4 w-4" />
              Ajouter un partenaire
            </button>
          </div>
        </div>

        {/* Bandeau d'information */}
        <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-2xl p-5 text-sm text-sky-300/90 flex gap-4">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-sky-400" />
          <p>
            Les logos ajoutés ici apparaissent automatiquement dans la section{' '}
            <strong className="text-sky-200">« Nos Partenaires »</strong> de la page d'accueil du
            site public, sous forme de bande défilante animée.
          </p>
        </div>

        {/* Grille des partenaires */}
        {partenaires.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-16 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/[0.04] mb-5">
              <Users className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium mb-1">Aucun partenaire ajouté</p>
            <p className="text-slate-500 text-sm">
              Cliquez sur « Ajouter un partenaire » pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {partenaires.map((p, i) => (
              <div
                key={`${p.nom}-${i}`}
                className="group bg-slate-900/60 border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center gap-4 hover:border-[#cda434]/30 hover:-translate-y-1 transition-all duration-300 relative"
              >
                <button
                  onClick={() => handleDelete(i)}
                  disabled={saving}
                  title="Supprimer ce partenaire"
                  className="absolute top-3 right-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="h-16 w-full flex items-center justify-center overflow-hidden rounded-xl bg-white/[0.03] py-3">
                  <img
                    src={getImageUrl(p.logo_url)}
                    alt={p.nom}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Logo</text></svg>';
                    }}
                  />
                </div>
                <p className="text-slate-300 text-xs text-center font-medium truncate w-full">
                  {p.nom}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Aperçu en direct */}
        {partenaires.length > 0 && (
          <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-6">
            <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-5">
              Aperçu — Bande défilante (site public)
            </h4>
            <div className="overflow-hidden relative bg-white/[0.03] rounded-xl py-5 border border-white/[0.04]">
              <div className="flex gap-12 items-center px-8">
                {[...partenaires, ...partenaires].map((p, i) => (
                  <div key={`prev-${p.nom}-${i}`} className="shrink-0 flex items-center gap-3 opacity-70">
                    <img
                      src={getImageUrl(p.logo_url)}
                      alt={p.nom}
                      className="h-8 object-contain grayscale"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-slate-400 text-sm whitespace-nowrap">{p.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modale d'ajout */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0e1626] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-lg font-semibold text-slate-100">Ajouter un partenaire</h3>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    Nom du partenaire *
                  </label>
                  <input
                    type="text"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    placeholder="Ex : Rio Tinto"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                </div>

                <div>
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(false)}
                      className={`flex-1 py-2.5 text-sm rounded-xl border transition-all ${
                        !useUrlInput
                          ? 'border-[#cda434]/50 bg-[#cda434]/10 text-[#e0b83d] font-medium'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      <Upload className="h-4 w-4 inline mr-1.5" />
                      Uploader le logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(true)}
                      className={`flex-1 py-2.5 text-sm rounded-xl border transition-all ${
                        useUrlInput
                          ? 'border-[#cda434]/50 bg-[#cda434]/10 text-[#e0b83d] font-medium'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-1.5" />
                      URL externe
                    </button>
                  </div>

                  {useUrlInput ? (
                    <input
                      type="url"
                      value={formLogoUrl}
                      onChange={(e) => setFormLogoUrl(e.target.value)}
                      placeholder="https://exemple.com/logo.png"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                    />
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] file:cursor-pointer transition-all"
                      />
                      {previewUrl && (
                        <div className="mt-4 flex items-center justify-center h-24 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                          <img src={previewUrl} alt="Aperçu" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/[0.06]">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formNom.trim() || (!formFile && !formLogoUrl.trim()) || uploading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? 'Ajout en cours…' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation de suppression */}
        <ConfirmModal
          isOpen={itemToDelete !== null}
          title="Supprimer le partenaire"
          message="Êtes-vous sûr de vouloir supprimer ce partenaire ? Son logo sera retiré de la bande des partenaires sur la page d'accueil."
          confirmText="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      </div>
    </AdminPage>
  );
}
