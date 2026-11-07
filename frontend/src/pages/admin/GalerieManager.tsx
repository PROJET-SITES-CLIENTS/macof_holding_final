import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { getImageUrl } from '../../lib/utils';

interface GalerieItem {
  id: number;
  titre: string;
  filiale: number | null;
  filiale_nom?: string | null;
  description_courte?: string;
  description?: string;
  image_path: string;
  image_url?: string;
  created_at: string;
}

interface FilialeOption {
  id: number;
  nom: string;
}

export default function GalerieManager() {
  const [images, setImages] = useState<GalerieItem[]>([]);
  const [filiales, setFiliales] = useState<FilialeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filialeFilter, setFilialeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formTitre, setFormTitre] = useState('');
  const [formFiliale, setFormFiliale] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTypeProjet, setFormTypeProjet] = useState('autre');
  const [formLieu, setFormLieu] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [galerieRes, filialesRes] = await Promise.all([
        api.get('/api/v1/admin/galerie'),
        api.get('/api/v1/admin/filiales'),
      ]);
      if (galerieRes.data.success) {
        const gData = galerieRes.data.data;
        setImages(Array.isArray(gData) ? gData : (gData.items || []));
      }
      if (filialesRes.data.success) {
        const fData = filialesRes.data.data;
        setFiliales(Array.isArray(fData) ? fData : (fData.items || []));
      }
    } catch (err) {
      console.error('Erreur fetch galerie:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredImages = images.filter((img) => {
    const filialeLabel = img.filiale_nom || img.filiale || '';
    const matchSearch =
      !search ||
      (img.titre || '').toLowerCase().includes(search.toLowerCase()) ||
      String(filialeLabel).toLowerCase().includes(search.toLowerCase());
    const matchFiliale = !filialeFilter || String(filialeLabel) === filialeFilter;
    return matchSearch && matchFiliale;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const openModal = () => {
    setFormTitre('');
    setFormFiliale(filiales[0]?.id ? String(filiales[0].id) : '')
    setFormDescription('');
    setFormTypeProjet('autre');
    setFormLieu('');
    setFormFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!formTitre || !formFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('titre', formTitre);
      formData.append('filiale', formFiliale);
      formData.append('description_courte', formDescription);
      formData.append('type_projet', formTypeProjet);
      formData.append('lieu', formLieu);
      formData.append('image', formFile);

      await api.post('/api/v1/admin/galerie', formData);
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('Erreur lors de l\'upload de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/v1/admin/galerie/${itemToDelete}`);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
    }
  };


  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Galerie</h2>
            <p className="text-sm text-slate-500 mt-1">Gérez les images de la galerie.</p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm shadow-[0_8px_24px_-8px_rgba(205,164,52,0.5)] transition-all duration-300 hover:brightness-105 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Ajouter une image
          </button>
        </div>

        {/* Données partagées avec « Réalisations » */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] px-5 py-4 text-sm text-amber-300/90">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Cette page et « Réalisations » partagent les mêmes données. Toute modification ici apparaît dans l'autre page.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par titre ou filiale…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
            />
          </div>
          <select
            value={filialeFilter}
            onChange={(e) => setFilialeFilter(e.target.value)}
            className="bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors sm:w-64 cursor-pointer"
          >
            <option value="">Toutes les filiales</option>
            {filiales.map((f) => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}

          </select>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="group bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur hover:-translate-y-1 hover:border-[#cda434]/30 transition-all duration-300"
            >
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                <img
                  src={getImageUrl(img.image_path || img.image_url)}
                  alt={img.titre}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <button
                  onClick={() => setItemToDelete(img.id)}
                  title="Supprimer l'image"
                  className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-100 truncate">{img.titre}</h3>
                {img.description_courte && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{img.description_courte}</p>
                )}
                <span className="inline-flex items-center mt-3 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#cda434]/10 text-[#e0b83d] border border-[#cda434]/20">
                  {img.filiale_nom || img.filiale || '—'}
                </span>
              </div>
            </div>
          ))}
          {filteredImages.length === 0 && (
            <div className="col-span-full bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur px-6 py-16 flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                <ImageIcon className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-300">Aucune image trouvée</p>
              <p className="text-sm text-slate-500 mt-1">Modifiez vos filtres ou ajoutez une nouvelle image à la galerie.</p>
            </div>
          )}
        </div>

        {/* Add Image Modal */}
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
                  <ImageIcon className="h-5 w-5 text-[#cda434]" />
                  Ajouter une image
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
                    value={formTitre}
                    onChange={(e) => setFormTitre(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Filiale</label>
                  <select
                    value={formFiliale}
                    onChange={(e) => setFormFiliale(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors cursor-pointer"
                  >
                    {filiales.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Catégorie de projet</label>
                  <select
                    value={formTypeProjet}
                    onChange={(e) => setFormTypeProjet(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors cursor-pointer"
                  >
                    <option value="residentiel">Résidentiel</option>
                    <option value="commercial">Commercial</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="evenement">Événement</option>
                    <option value="production">Production</option>
                    <option value="logistique">Logistique</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Lieu</label>
                  <input
                    type="text"
                    value={formLieu}
                    onChange={(e) => setFormLieu(e.target.value)}
                    placeholder="Ex : Conakry, Guinée"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Description courte</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Image *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] transition-colors cursor-pointer"
                  />
                  {previewUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                      <img src={previewUrl} alt="Aperçu" className="w-full h-48 object-cover" />
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
                  onClick={handleUpload}
                  disabled={!formTitre || !formFile || uploading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? 'Envoi…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
        <ConfirmModal isOpen={itemToDelete !== null} title="Supprimer l'image" message="Êtes-vous sûr de vouloir supprimer cette image de la galerie ? Cette action est irréversible." confirmText="Supprimer" onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} />
      </div>
    </AdminPage>
  );
}
