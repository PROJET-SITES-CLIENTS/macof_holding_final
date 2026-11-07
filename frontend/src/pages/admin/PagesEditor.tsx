import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Save,
  ImageIcon,
  FileText,
  FileCode,
  CheckCircle,
  AlertCircle,
  Home,
  Info,
  Building2,
  UtensilsCrossed,
  Truck,
  Mountain,
  Fish,
  Printer,
  Phone,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface PageSection {
  key: string;
  type: 'text' | 'html' | 'image' | 'json';
  value: string;
  image_url?: string;
}

interface PageData {
  slug: string;
  titre: string;
  sections: PageSection[];
}

const pages: Array<{ label: string; slug: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'Accueil', slug: 'home', icon: Home },
  { label: 'À propos', slug: 'about', icon: Info },
  { label: 'Immobilier', slug: 'immobilier', icon: Building2 },
  { label: 'Restauration', slug: 'restauration', icon: UtensilsCrossed },
  { label: 'Transit', slug: 'transit', icon: Truck },
  { label: 'Mining', slug: 'mining', icon: Mountain },
  { label: 'Fishing', slug: 'fishing', icon: Fish },
  { label: 'Print', slug: 'print', icon: Printer },
  { label: 'Contact', slug: 'contact', icon: Phone },
];

function toReadableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Regroupe les sections par nature plutôt que de les empiler à plat —
// on retrouve plus vite "toutes les images" ou "tout le texte" d'une page.
const sectionGroups: Array<{
  key: string;
  label: string;
  hint: string;
  types: PageSection['type'][];
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'texte', label: 'Contenu textuel', hint: 'Titres, paragraphes, blocs HTML', types: ['text', 'html'], icon: FileText },
  { key: 'media', label: 'Visuels', hint: 'Images affichées sur la page', types: ['image'], icon: ImageIcon },
  { key: 'donnees', label: 'Données structurées', hint: 'Listes ou objets au format JSON', types: ['json'], icon: FileCode },
];

const typeLabels: Record<string, string> = {
  text: 'Texte',
  html: 'HTML',
  image: 'Image',
  json: 'JSON',
};

export default function PagesEditor() {
  const [selectedPage, setSelectedPage] = useState(pages[0].slug);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sectionSearch, setSectionSearch] = useState('');

  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewUrlsRef = useRef<string[]>([]);
  // Copie des valeurs telles que chargées depuis l'API, pour savoir quelles
  // sections ont réellement été modifiées depuis (et activer "Sauvegarder"
  // seulement quand c'est pertinent, plutôt que systématiquement).
  const originalValuesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchPage = useCallback(async (slug: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/api/v1/admin/pages/${slug}`);
      if (res.data?.success) {
        const data: PageData | null = res.data.data || null;
        setPageData(data);
        originalValuesRef.current = {};
        data?.sections?.forEach((s) => {
          originalValuesRef.current[s.key] = s.value || '';
        });
      } else {
        setPageData(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setPageData(null);
      } else {
        console.error('Erreur fetch page:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    setSectionSearch('');
    const load = async () => {
      if (!canceled) await fetchPage(selectedPage);
    };
    load();
    return () => {
      canceled = true;
    };
  }, [selectedPage, fetchPage]);

  const updateSectionValue = (key: string, value: string) => {
    if (!pageData) return;
    setPageData({
      ...pageData,
      sections: pageData.sections?.map((s) => (s.key === key ? { ...s, value } : s)),
    });
  };

  const saveSection = async (key: string, imageFile?: File) => {
    if (!pageData) return;
    setSavingKey(key);

    try {
      const section = pageData.sections?.find((s) => s.key === key);
      if (!section) return;

      if (section.type === 'json' && section.value) {
        try {
          JSON.parse(section.value);
        } catch {
          setNotification({ type: 'error', message: `Format JSON invalide dans "${toReadableLabel(key)}".` });
          setSavingKey(null);
          return;
        }
      }

      let value = section.value || '';
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        uploadData.append('folder', 'pages');
        const uploadRes = await api.post('/api/v1/admin/upload', uploadData);
        value = uploadRes.data?.data?.url || value;
      }

      const res = await api.post('/api/v1/admin/pages/bulk', {
        page_slug: selectedPage,
        contents: [{
          section_key: key,
          content_value: value,
          content_type: imageFile ? 'image' : section.type,
        }],
      });

      if (res.data?.success) {
        setPageData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.key === key
                ? { ...s, value, image_url: imageFile ? value : s.image_url }
                : s
            ),
          };
        });
        originalValuesRef.current[key] = value;
      }

      setNotification({ type: 'success', message: `Section "${toReadableLabel(key)}" sauvegardée.` });
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      const msg = err.response?.data?.message || `Erreur lors de la sauvegarde.`;
      setNotification({ type: 'error', message: msg });
    } finally {
      setSavingKey(null);
    }
  };

  const handleImageUpload = (key: string, file: File) => {
    if (!pageData) return;
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.push(url);
    setPageData({
      ...pageData,
      sections: pageData.sections?.map((s) => (s.key === key ? { ...s, image_url: url } : s)),
    });
    saveSection(key, file);
  };

  const isJsonValid = (str: string) => {
    if (!str) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const isDirty = (section: PageSection) => (originalValuesRef.current[section.key] ?? '') !== (section.value || '');

  const currentPageMeta = pages.find((p) => p.slug === selectedPage);

  const filteredSections = useMemo(() => {
    if (!pageData?.sections) return [];
    const term = sectionSearch.trim().toLowerCase();
    if (!term) return pageData.sections;
    return pageData.sections.filter(
      (s) => toReadableLabel(s.key).toLowerCase().includes(term) || s.key.toLowerCase().includes(term)
    );
  }, [pageData, sectionSearch]);

  const groupedSections = useMemo(
    () =>
      sectionGroups
        .map((group) => ({
          ...group,
          sections: filteredSections.filter((s) => group.types.includes(s.type)),
        }))
        .filter((group) => group.sections.length > 0),
    [filteredSections]
  );

  const dirtyCount = pageData?.sections?.filter(isDirty).length || 0;

  const renderSectionInput = (section: PageSection) => {
    switch (section.type) {
      case 'text':
        return (
          <input
            type="text"
            value={section.value || ''}
            onChange={(e) => updateSectionValue(section.key, e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
          />
        );
      case 'html':
        return (
          <div>
            <p className="text-xs text-slate-500 mb-1">Supporte les balises HTML</p>
            <textarea
              value={section.value || ''}
              onChange={(e) => updateSectionValue(section.key, e.target.value)}
              rows={6}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all font-mono resize-y"
            />
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 aspect-video flex items-center justify-center">
              {section.image_url ? (
                <img src={section.image_url} alt={section.key} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-600 flex flex-col items-center gap-2 text-xs">
                  <ImageIcon className="h-8 w-8" />
                  Aucune image
                </div>
              )}
            </div>
            <input
              ref={(el) => {
                imageInputRefs.current[section.key] = el;
              }}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(section.key, file);
                  e.target.value = '';
                }
              }}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] file:cursor-pointer transition-all cursor-pointer"
            />
          </div>
        );
      case 'json': {
        const valid = isJsonValid(section.value);
        return (
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-slate-500">Format JSON valide (tableau ou objet)</p>
              {!valid && <span className="text-xs text-red-400 font-medium">JSON invalide</span>}
            </div>
            <textarea
              value={section.value || ''}
              onChange={(e) => updateSectionValue(section.key, e.target.value)}
              rows={6}
              className={`w-full bg-slate-800 border ${
                valid ? 'border-slate-600 focus:border-amber-500' : 'border-red-500 focus:border-red-400'
              } rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none transition-colors font-mono resize-y`}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* Onglets de pages — navigation par secteur avec icône reconnaissable
            pour chaque activité du groupe. Repli automatique sur plusieurs
            lignes : jamais de barre de défilement horizontal. */}
        <div className="flex flex-wrap items-center gap-2">
          {pages.map((p) => {
            const Icon = p.icon;
            const isActive = selectedPage === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => setSelectedPage(p.slug)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold border-transparent shadow-lg shadow-[#cda434]/10'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* En-tête de la page sélectionnée */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434] flex-shrink-0">
              {currentPageMeta && <currentPageMeta.icon className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{currentPageMeta?.label || selectedPage}</h2>
              <p className="text-slate-500 text-xs mt-1">
                {pageData?.sections?.length || 0} section{(pageData?.sections?.length || 0) > 1 ? 's' : ''}
                {dirtyCount > 0 && (
                  <span className="text-[#e0b83d] ml-2 inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {dirtyCount} modification{dirtyCount > 1 ? 's' : ''} non enregistrée{dirtyCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pageData?.sections && pageData.sections.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="Rechercher une section…"
                  className="bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all w-56"
                />
                {sectionSearch && (
                  <button
                    onClick={() => setSectionSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                fetchPage(selectedPage);
              }}
              className="text-slate-400 hover:text-[#e0b83d] hover:bg-[#cda434]/10 transition-all p-2 rounded-lg flex-shrink-0"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading && !pageData ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-[#cda434] animate-spin" />
          </div>
        ) : !pageData?.sections || pageData.sections.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-900/60 border border-white/[0.06] rounded-2xl">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-white/[0.04] mb-4">
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium">Aucune section disponible pour cette page.</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-900/60 border border-white/[0.06] rounded-2xl">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-white/[0.04] mb-4">
              <Search className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium">Aucune section ne correspond à « {sectionSearch} ».</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedSections.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2.5 mb-4">
                  <group.icon className="h-4 w-4 text-[#cda434]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</h3>
                  <span className="text-xs text-slate-600">— {group.hint}</span>
                </div>

                <div className={group.key === 'media' ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : 'space-y-5'}>
                  {group.sections.map((section) => {
                    const dirty = isDirty(section);
                    return (
                      <div
                        key={section.key}
                        className={`bg-slate-900/60 border rounded-2xl overflow-hidden backdrop-blur transition-all ${
                          dirty ? 'border-[#cda434]/50 shadow-lg shadow-[#cda434]/5' : 'border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border-b border-white/[0.06]">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="text-sm font-medium text-slate-200 truncate">{toReadableLabel(section.key)}</h4>
                            <span className="text-xs bg-[#cda434]/10 text-[#e0b83d] border border-[#cda434]/20 rounded-full px-2 py-0.5 flex-shrink-0">
                              {typeLabels[section.type] || section.type}
                            </span>
                            {dirty && (
                              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 flex-shrink-0">
                                Non enregistré
                              </span>
                            )}
                          </div>
                          {section.type !== 'image' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                saveSection(section.key);
                              }}
                              disabled={savingKey === section.key || !dirty}
                              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                            >
                              {savingKey === section.key ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {savingKey === section.key ? 'Sauvegarde…' : 'Sauvegarder'}
                            </button>
                          )}
                          {section.type === 'image' && savingKey === section.key && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#e0b83d] flex-shrink-0">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Transfert…
                            </span>
                          )}
                        </div>
                        <div className="p-5">{renderSectionInput(section)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification flottante — ne pousse plus le contenu de la page */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm shadow-2xl backdrop-blur-xl ${
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
    </AdminPage>
  );
}