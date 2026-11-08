import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Download,
  FileText,
  Pencil,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface Catalogue {
  id: number;
  titre: string;
  filiale: number | null;
  filiale_nom?: string | null;
  type_document: string;
  format: string;
  taille_ko: number | null;
  file_path: string;
  created_at: string;
}

interface FilialeOption {
  id: number;
  nom: string;
}

const documentTypes = [
  { value: 'catalogue', label: 'Catalogue' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'plaquette', label: 'Plaquette' },
  { value: 'fiche_technique', label: 'Fiche technique' },
  { value: 'autre', label: 'Autre' },
];

const documentTypeLabels: Record<string, string> = {
  catalogue: 'Catalogue',
  brochure: 'Brochure',
  plaquette: 'Plaquette',
  fiche_technique: 'Fiche technique',
  autre: 'Autre',
};

export default function CataloguesManager() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [filiales, setFiliales] = useState<FilialeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [formTitre, setFormTitre] = useState('');
  const [formFilialeId, setFormFilialeId] = useState<string>('');
  const [formType, setFormType] = useState('catalogue');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, filialesRes] = await Promise.all([
        api.get('/api/v1/admin/catalogues'),
        api.get('/api/v1/admin/filiales'),
      ]);

      if (catRes.data.success) {
        const cData = catRes.data.data;
        setCatalogues(Array.isArray(cData) ? cData : cData.items || []);
      }

      if (filialesRes.data.success) {
        const fData = filialesRes.data.data;
        const list = Array.isArray(fData) ? fData : fData.items || [];
        setFiliales(list);
      }
    } catch (err) {
      console.error('Erreur fetch catalogues:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCatalogues = catalogues.filter((cat) => {
    const query = search.toLowerCase();
    const filialeLabel = cat.filiale_nom || cat.filiale || '';
    return (
      !search ||
      (cat.titre || '').toLowerCase().includes(query) ||
      String(filialeLabel).toLowerCase().includes(query) ||
      (cat.type_document || '').toLowerCase().includes(query)
    );
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormFile(file);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitre('');
    setFormFilialeId(filiales[0]?.id ? String(filiales[0].id) : '');
    setFormType('catalogue');
    setFormFile(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Catalogue) => {
    setEditingId(cat.id);
    setFormTitre(cat.titre);
    setFormFilialeId(cat.filiale ? String(cat.filiale) : '');
    setFormType(cat.type_document);
    setFormFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formTitre) return;
    if (!editingId && !formFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('titre', formTitre);
      if (formFilialeId) formData.append('filiale', formFilialeId);
      formData.append('type_document', formType);
      if (formFile) formData.append('file', formFile);

      if (editingId) {
        await api.put(`/api/v1/admin/catalogues/${editingId}`, formData);
      } else {
        await api.post('/api/v1/admin/catalogues', formData);
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      console.error('Erreur enregistrement catalogue:', err);
      alert(err?.response?.data?.message || "Erreur lors de l'enregistrement du document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    try {
      await api.delete(`/api/v1/admin/catalogues/${itemToDelete}`);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const formatFileSize = (sizeKo: number | null | undefined) => {
    if (sizeKo === null || sizeKo === undefined) return '—';
    if (sizeKo < 1024) return `${sizeKo} Ko`;
    return `${(sizeKo / 1024).toFixed(1)} Mo`;
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Documents</p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
                <FileText className="h-5 w-5" />
              </span>
              Catalogues
            </h2>
            <p className="mt-1 text-sm text-slate-500">Gérez les documents et catalogues du groupe.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm shadow-[0_8px_24px_-8px_rgba(205,164,52,0.5)] transition-all duration-300 hover:brightness-105 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Ajouter un catalogue
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par titre, filiale, type…"
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
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Titre</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Filiale</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Format</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Taille</th>
                  <th className="px-5 py-4 text-[11px] font-medium uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalogues.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] border-b border-white/[0.04] transition-colors">
                    <td className="px-5 py-4 text-slate-100 font-medium">{cat.titre}</td>
                    <td className="px-5 py-4 text-slate-400">{cat.filiale_nom || cat.filiale || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#cda434]/10 text-[#e0b83d] border border-[#cda434]/20">
                        {documentTypeLabels[cat.type_document] || cat.type_document}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 uppercase text-xs">{cat.format || '—'}</td>
                    <td className="px-5 py-4 text-slate-400">{formatFileSize(cat.taille_ko)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {cat.file_path && (
                          <a
                            href={cat.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Télécharger le document"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-[#e0b83d] hover:bg-white/10 rounded-lg p-2 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">Télécharger</span>
                          </a>
                        )}
                        <button
                          onClick={() => openEditModal(cat)}
                          className="text-slate-400 hover:text-[#e0b83d] hover:bg-white/10 rounded-lg p-2 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-2 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCatalogues.length === 0 && (
                  <tr className="border-b border-white/[0.04]">
                    <td colSpan={6} className="px-5 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-14 w-14 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                          <FileText className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">Aucun catalogue trouvé</p>
                        <p className="text-sm text-slate-500 mt-1">Modifiez votre recherche ou ajoutez un nouveau document.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Ajout/Modification */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div
              className="bg-[#0e1626] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-[#cda434]" />
                  {editingId ? 'Modifier le catalogue' : 'Ajouter un catalogue'}
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
                    value={formFilialeId}
                    onChange={(e) => setFormFilialeId(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors cursor-pointer"
                  >
                    <option value="">— Aucune filiale —</option>
                    {filiales.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Type de document</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-colors cursor-pointer"
                  >
                    {documentTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                    Fichier (PDF, DOC, DOCX) {editingId ? '(facultatif pour modification)' : '*'}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] transition-colors cursor-pointer"
                  />
                  {formFile && (
                    <p className="mt-2 text-xs text-slate-400">Fichier sélectionné : {formFile.name}</p>
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
                  onClick={handleSubmit}
                  disabled={!formTitre || (!editingId && !formFile) || uploading}
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

        {/* Confirmation de suppression */}
        <ConfirmModal
          isOpen={itemToDelete !== null}
          title="Supprimer le document"
          message="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
          confirmText="Supprimer"
          onConfirm={confirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      </div>
    </AdminPage>
  );
}
