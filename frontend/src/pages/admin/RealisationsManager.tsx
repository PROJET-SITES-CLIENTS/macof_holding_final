import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Edit2,
  Image as ImageIcon,
  Award,
  Building2,
} from 'lucide-react';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface Filiale {
  id: number;
  nom: string;
  slug: string;
}

interface Realisation {
  id: number;
  title: string;
  desc: string;
  image: string;
}

export default function RealisationsManager() {
  const [filiales, setFiliales] = useState<Filiale[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');

  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch filiales on mount
  useEffect(() => {
    const fetchFiliales = async () => {
      try {
        const res = await api.get('/api/v1/admin/filiales');
        if (res.data.success) {
          setFiliales(res.data.data || []);
          if (res.data.data?.length > 0) {
            setSelectedSlug(res.data.data[0].slug);
          }
        }
      } catch (err) {
        console.error('Erreur fetch filiales:', err);
      }
    };
    fetchFiliales();
  }, []);

  // The gallery table is the single source of truth for public realizations.
  useEffect(() => {
    if (!selectedSlug) return;
    const fetchRealisations = async () => {
      setLoading(true);
      try {
        const filiale = filiales.find((item) => item.slug === selectedSlug);
        const res = await api.get('/api/v1/admin/galerie');
        const items = res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
        setRealisations(
          items
            .filter((item: any) => item.filiale === filiale?.id)
            .map((item: any) => ({
              id: item.id,
              title: item.titre,
              desc: item.description_courte || '',
              image: item.image_path,
            }))
        );
      } catch (err) {
        console.error('Erreur fetch realisations:', err);
        setRealisations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRealisations();
  }, [selectedSlug, filiales]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormImageUrl(''); // Reset URL if a file is chosen
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setFormTitle('');
    setFormDesc('');
    setFormImageUrl('');
    setFormFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEditModal = (r: Realisation) => {
    setEditId(r.id);
    setFormTitle(r.title);
    setFormDesc(r.desc);
    setFormImageUrl(r.image);
    setFormFile(null);
    setPreviewUrl(r.image);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveItem = async () => {
    if (!formTitle) return;
    setUploading(true);
    try {
      let finalImageUrl = formImageUrl;

      // Upload file if selected
      if (formFile) {
        const formData = new FormData();
        formData.append('file', formFile);
        formData.append('folder', 'realisations');
        const uploadRes = await api.post('/api/v1/admin/upload', formData);
        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.data.url;
        } else {
          throw new Error("Erreur lors de l'upload");
        }
      }

      if (!finalImageUrl) {
        alert('Veuillez fournir une image (fichier ou URL).');
        setUploading(false);
        return;
      }

      const filiale = filiales.find((item) => item.slug === selectedSlug);
      if (!filiale) throw new Error('Filiale introuvable');

      const payload = {
        titre: formTitle,
        filiale: filiale.id,
        description_courte: formDesc,
        type_projet: 'autre',
        image_path: finalImageUrl,
      };
      const response = editId
        ? await api.put(`/api/v1/admin/galerie/${editId}`, payload)
        : await api.post('/api/v1/admin/galerie', payload);
      if (!response.data.success) throw new Error('Erreur de sauvegarde');

      const item = response.data.data;
      const savedItem = {
        id: item.id,
        title: item.titre,
        desc: item.description_courte || '',
        image: item.image_path,
      };
      setRealisations((current) => editId
        ? current.map((entry) => entry.id === editId ? savedItem : entry)
        : [...current, savedItem]);
      closeModal();
    } catch (err) {
      console.error('Erreur save item:', err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/admin/galerie/${itemToDelete}`);
      setRealisations((current) => current.filter((item) => item.id !== itemToDelete));
      setItemToDelete(null);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert("Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage loading={loading} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Pages des filiales</p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
              <Award className="h-5 w-5" />
            </span>
            Réalisations par filiale
          </h2>
          <p className="mt-1 text-sm text-slate-500">Gérez les projets spécifiques affichés sur les pages des filiales.</p>
          <p className="text-xs text-slate-500 mt-2">
            Pour les images de la galerie publique, utilisez{' '}
            <Link to="/admin/galerie" className="text-[#e0b83d] hover:text-[#e0b83d]/80 underline underline-offset-2 decoration-[#cda434]/40 transition-colors">
              la gestion de la Galerie
            </Link>.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedSlug}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm shadow-[0_8px_24px_-8px_rgba(205,164,52,0.5)] transition-all duration-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
        >
          <Plus className="h-4 w-4" />
          Ajouter une réalisation
        </button>
      </div>

      {/* Filter / Filiale Selection */}
      <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur p-6">
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Sélectionner une filiale</label>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="w-full sm:w-72 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors cursor-pointer"
        >
          {filiales.map((f) => (
            <option key={f.id} value={f.slug}>
              {f.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {realisations.map((r) => (
          <div
            key={r.id}
            className="group bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur hover:-translate-y-1 hover:border-[#cda434]/30 transition-all duration-300 flex flex-col"
          >
            <div className="relative aspect-video bg-slate-900/60 overflow-hidden">
              <img
                src={getImageUrl(r.image)}
                alt={r.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(r)}
                  title="Modifier"
                  className="bg-slate-900/80 hover:bg-slate-900 text-[#e0b83d] p-2 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  title="Supprimer"
                  className="bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg transition-colors backdrop-blur-sm"
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-100">{r.title}</h3>
              {r.desc && (
                <p className="text-xs text-slate-400 line-clamp-3 mt-1.5">{r.desc}</p>
              )}
            </div>
          </div>
        ))}
        {realisations.length === 0 && (
          <div className="col-span-full bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur px-6 py-16 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300">Aucune réalisation pour cette filiale</p>
            <p className="text-sm text-slate-500 mt-1">Ajoutez une réalisation ou sélectionnez une autre filiale.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-[#0e1626] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-[#cda434]" />
                {editId ? 'Modifier la réalisation' : 'Ajouter une réalisation'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Titre *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Description courte</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">URL de l'image (optionnel)</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    if (e.target.value) {
                      setPreviewUrl(e.target.value);
                      setFormFile(null);
                    }
                  }}
                  placeholder="https://…"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">ou</span>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Téléverser une image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] transition-colors cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                    <img
                      src={getImageUrl(previewUrl)}
                      alt="Aperçu"
                      className="w-full h-48 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={closeModal}
                className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl px-5 py-2.5 text-sm text-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!formTitle || uploading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Supprimer la réalisation"
        message="Êtes-vous sûr de vouloir supprimer cette réalisation ? Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </AdminPage>
  );
}
