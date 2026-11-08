import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Edit2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Image as ImageIcon,
  ListChecks,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Filiale {
  id: number;
  nom: string;
  slug: string;
  secteur: string;
  description: string;
  image_url: string;
  details_json?: { items?: string[] } | string[] | null;
  email: string;
  telephone: string;
  adresse: string;
  site_web: string;
  statut: string;
  created_at: string;
}

const emptyForm = {
  nom: '',
  slug: '',
  secteur: '',
  description: '',
  details: '',
  email: '',
  telephone: '',
  adresse: '',
  site_web: '',
  statut: 'actif',
};

type FormDataState = typeof emptyForm;

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function FilialesManager() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormDataState>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: filiales = [], isLoading: loading } = useQuery<Filiale[]>({
    queryKey: ['filiales'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/filiales');
      return res.data.success ? res.data.data : [];
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Verrouille le scroll de la page en arrière-plan pendant que le modal est ouvert ───
  // (sans ça, la molette peut faire défiler la page derrière au lieu du contenu du modal,
  // ce qui donnait l'impression qu'il fallait scroller "manuellement" avec la scrollbar)
  useEffect(() => {
    if (modalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalOpen]);

  // ─── Fermeture au clavier (Échap) ───
  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (editId) {
        return api.put(`/api/v1/admin/filiales/${editId}`, formData);
      }
      return api.post('/api/v1/admin/filiales', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiales'] });
      closeModal();
    },
    onError: (err: any) => {
      console.error('Erreur sauvegarde:', err);

      if (err?.response?.status === 404) {
        const message = 'Cette filiale n\'existe plus ou l\'ID est invalide. Rechargez la liste avant de refaire une modification.';
        alert(message);
        queryClient.invalidateQueries({ queryKey: ['filiales'] });
        return;
      }

      alert(err?.response?.data?.message || 'Erreur lors de la sauvegarde de la filiale.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/v1/admin/filiales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiales'] });
    },
    onError: (err: any) => {
      console.error('Erreur suppression:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    },
  });

  const filteredFiliales = filiales.filter((f) => {
    return (
      !search ||
      (f.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.secteur || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const updateForm = (key: keyof FormDataState, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'nom' && !editId) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (filiale: Filiale) => {
    setEditId(filiale.id);
    // Normalize details_json ({items:[...]} | string[] | null) → newline string
    let detailsStr = '';
    const dj = filiale.details_json;
    if (dj) {
      let arr: string[] = [];
      if (Array.isArray(dj)) arr = dj;
      else if (Array.isArray((dj as any).items)) arr = (dj as any).items;
      detailsStr = arr.join('\n');
    }
    setForm({
      nom: filiale.nom,
      slug: filiale.slug,
      secteur: filiale.secteur || '',
      description: filiale.description || '',
      details: detailsStr,
      email: filiale.email || '',
      telephone: filiale.telephone || '',
      adresse: filiale.adresse || '',
      site_web: filiale.site_web || '',
      statut: filiale.statut || 'actif',
    });
    setImagePreview(filiale.image_url || null);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nom) return;

    if (editId && !filiales.some((f) => f.id === editId)) {
      const message = 'Cette filiale n\'existe plus ou l\'ID est invalide. Rechargez la liste avant de sauvegarder.';
      alert(message);
      queryClient.invalidateQueries({ queryKey: ['filiales'] });
      closeModal();
      return;
    }

    const formData = new FormData();
    formData.append('nom', form.nom);
    formData.append('slug', form.slug);
    formData.append('secteur', form.secteur);
    formData.append('description', form.description);
    formData.append('details', form.details);
    formData.append('email', form.email);
    formData.append('telephone', form.telephone);
    formData.append('adresse', form.adresse);
    formData.append('site_web', form.site_web);
    formData.append('statut', form.statut);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    const filiale = filiales.find(f => f.id === id);
    if (!filiale) return;
    setDeleteTargetId(id);
    setDeleteTargetName(filiale.nom);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId !== null) {
      deleteMutation.mutate(deleteTargetId);
      setDeleteConfirmOpen(false);
    }
  };

  const statutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      actif: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      inactif: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    const labels: Record<string, string> = {
      actif: 'Actif',
      active: 'Actif',
      inactif: 'Inactif',
      inactive: 'Inactif',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          styles[statut] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}
      >
        {labels[statut] || statut}
      </span>
    );
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Structure du groupe</p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
                <Building2 className="h-5 w-5" />
              </span>
              Filiales
            </h2>
            <p className="mt-1 text-sm text-slate-500">Gérez les filiales du groupe MACOF.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm shadow-[0_8px_24px_-8px_rgba(205,164,52,0.5)] transition-all duration-300 hover:brightness-105 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Ajouter une filiale
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, slug ou secteur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Nom</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Slug</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Secteur</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiliales.map((f) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] border-b border-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-slate-100 font-medium">{f.nom}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{f.slug}</td>
                    <td className="px-5 py-4 text-slate-400">{f.secteur || '—'}</td>
                    <td className="px-5 py-4">{statutBadge(f.statut)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(f)}
                          title="Modifier"
                          className="text-slate-400 hover:text-[#e0b83d] hover:bg-white/10 rounded-lg p-2 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          title="Supprimer"
                          className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-2 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFiliales.length === 0 && (
                  <tr className="border-b border-white/[0.04]">
                    <td colSpan={5} className="px-5 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-14 w-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                          <Building2 className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Aucune filiale trouvée</p>
                        <p className="text-sm text-slate-500 mt-1">Modifiez votre recherche ou ajoutez une nouvelle filiale.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {modalOpen &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                // Ferme uniquement si on clique sur le fond, pas sur le panneau
                if (e.target === e.currentTarget) closeModal();
              }}
            >
              {/*
                Structure clé pour un scroll fluide :
                - le panneau est un flex-col avec une hauteur MAXIMALE (max-h-[90vh])
                - le header et le footer sont "shrink-0" (taille fixe, ne rétrécissent jamais)
                - seul le body a "flex-1 overflow-y-auto min-h-0" → c'est LUI qui scrolle,
                  la molette de la souris agit directement dessus dès qu'on survole le modal.
              */}
              <div
                className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-[#0e1626] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header (fixe) */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-[#cda434]" />
                    {editId ? 'Modifier la filiale' : 'Ajouter une filiale'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 space-y-6">
                  {/* Section : Informations générales */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Informations générales
                      </h4>
                      <span className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Nom *</label>
                        <input
                          type="text"
                          value={form.nom}
                          onChange={(e) => updateForm('nom', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Slug</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => updateForm('slug', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Secteur</label>
                      <input
                        type="text"
                        value={form.secteur}
                        onChange={(e) => updateForm('secteur', e.target.value)}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => updateForm('description', e.target.value)}
                        rows={3}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5 text-slate-500" />
                        Détails (un par ligne)
                      </label>
                      <textarea
                        value={form.details}
                        onChange={(e) => updateForm('details', e.target.value)}
                        rows={4}
                        placeholder="Détail 1&#10;Détail 2&#10;Détail 3"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Section : Coordonnées */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Coordonnées
                      </h4>
                      <span className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateForm('email', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={form.telephone}
                          onChange={(e) => updateForm('telephone', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={form.adresse}
                          onChange={(e) => updateForm('adresse', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-500" />
                          Site web
                        </label>
                        <input
                          type="url"
                          value={form.site_web}
                          onChange={(e) => updateForm('site_web', e.target.value)}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Statut</label>
                      <select
                        value={form.statut}
                        onChange={(e) => updateForm('statut', e.target.value)}
                        className="w-full sm:w-64 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  </div>

                  {/* Section : Image */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Image
                      </h4>
                      <span className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                        Visuel de la filiale
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] transition-colors cursor-pointer"
                      />
                      {imagePreview && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                          <img src={imagePreview} alt="Aperçu" className="w-full h-40 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer (fixe) */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
                  <button
                    onClick={closeModal}
                    className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl px-5 py-2.5 text-sm text-slate-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.nom || saveMutation.isPending}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                  >
                    {saveMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {saveMutation.isPending ? 'Sauvegarde…' : editId ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Archiver la filiale ?"
        message={`Êtes-vous sûr de vouloir archiver "${deleteTargetName}" ? Elle ne sera plus visible mais pourra être restaurée en base si besoin.`}
        confirmText="Archiver"
        cancelText="Annuler"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
    </AdminPage>
  );
}
