import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat {
  value: string;
  label: string;
}

interface FilialeApiData {
  id: number;
  nom: string;
  slug?: string;
}

interface PageContentRow {
  page_slug: string;
  section_key: string;
  content_value?: string | null;
}

interface FilialeStats {
  id: number;
  nom: string;
  slug: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
}

// ─── Champs de saisie premium ─────────────────────────────────────────────────

const inputClass =
  'w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all';

const labelClass = 'text-xs font-medium uppercase tracking-wider text-slate-500 mb-2 block';

// ─── Slug helper (identique à FilialesManager) ────────────────────────────────

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Indexe les page_contents par slug puis par section : statsMap[slug][section_key]
function buildStatsMap(rows: PageContentRow[]): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  rows.forEach((row) => {
    const bucket = map.get(row.page_slug) || {};
    bucket[row.section_key] = row.content_value ?? '';
    map.set(row.page_slug, bucket);
  });
  return map;
}

// ─── StatRow component ────────────────────────────────────────────────────────

function StatRow({ stat, index, onChange, onDelete }: {
  stat: Stat;
  index: number;
  onChange: (index: number, field: 'value' | 'label', val: string) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/[0.06] rounded-xl group hover:border-white/10 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434] text-sm font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Valeur</label>
          <input
            type="text"
            value={stat.value}
            onChange={(e) => onChange(index, 'value', e.target.value)}
            placeholder="Ex : 350+"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Libellé</label>
          <input
            type="text"
            value={stat.label}
            onChange={(e) => onChange(index, 'label', e.target.value)}
            placeholder="Ex : Collaborateurs"
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        title="Supprimer la statistique"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StatsManager() {
  const [activeTab, setActiveTab] = useState<'global' | 'filiales'>('global');
  const [stats, setStats] = useState<Stat[]>([]);
  const [filiales, setFiliales] = useState<FilialeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedFiliale, setExpandedFiliale] = useState<number | null>(null);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch home stats
      const homeRes = await api.get('/api/v1/pages/home');
      if (homeRes.data?.success && homeRes.data.data?.stats) {
        try {
          const parsed = typeof homeRes.data.data.stats === 'string'
            ? JSON.parse(homeRes.data.data.stats)
            : homeRes.data.data.stats;
          setStats(Array.isArray(parsed) ? parsed : []);
        } catch {
          setStats([
            { value: '2018', label: 'Année de création' },
            { value: '6', label: 'Filiales' },
            { value: '50+', label: 'Projets réalisés' },
            { value: '350+', label: 'Collaborateurs' },
          ]);
        }
      } else {
        setStats([
          { value: '2018', label: 'Année de création' },
          { value: '6', label: 'Filiales' },
          { value: '50+', label: 'Projets réalisés' },
          { value: '350+', label: 'Collaborateurs' },
        ]);
      }

      // Fetch filiales + toutes les page_contents (source de vérité des stats filiales)
      const [filialesRes, pagesRes] = await Promise.all([
        api.get('/api/v1/admin/filiales'),
        api.get('/api/v1/admin/pages').catch(() => null),
      ]);

      const rows: PageContentRow[] = pagesRes?.data?.success && Array.isArray(pagesRes.data.data)
        ? pagesRes.data.data
        : [];
      const statsMap = buildStatsMap(rows);

      if (filialesRes.data?.success) {
        const raw: FilialeApiData[] = Array.isArray(filialesRes.data.data)
          ? filialesRes.data.data
          : filialesRes.data.data?.items || [];

        setFiliales(
          raw.map((f) => {
            // Les stats sont stockées dans page_contents (page_slug = slug de la filiale),
            // pas sur la table filiales : on pré-remplit depuis cette source de vérité.
            const slug = f.slug || generateSlug(f.nom);
            const saved = statsMap.get(slug);
            return {
              id: f.id,
              nom: f.nom,
              slug,
              stat_1_value: saved?.stat_1_value || '',
              stat_1_label: saved?.stat_1_label || '',
              stat_2_value: saved?.stat_2_value || '',
              stat_2_label: saved?.stat_2_label || '',
            };
          })
        );
      }
    } catch (err) {
      console.error('Erreur fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Global Stats Handlers ──────────────────────────────────────────────────

  const handleStatChange = (index: number, field: 'value' | 'label', val: string) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  };

  const handleAddStat = () => {
    setStats((prev) => [...prev, { value: '', label: '' }]);
  };

  const handleDeleteStat = (index: number) => {
    setStats((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveGlobalStats = async () => {
    setSavingId('global');
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: 'home',
        contents: [{ section_key: 'stats', content_value: JSON.stringify(stats), content_type: 'json' }],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur save stats:', err);
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSavingId(null);
    }
  };

  // ─── Filiale Stats Handlers ─────────────────────────────────────────────────

  const handleFilialeStatChange = (id: number, field: keyof FilialeStats, val: string) => {
    setFiliales((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  const handleSaveFilialeStats = async (filiale: FilialeStats) => {
    setSavingId(filiale.id);
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: filiale.slug || generateSlug(filiale.nom),
        contents: [
          { section_key: 'stat_1_value', content_value: filiale.stat_1_value, content_type: 'text' },
          { section_key: 'stat_1_label', content_value: filiale.stat_1_label, content_type: 'text' },
          { section_key: 'stat_2_value', content_value: filiale.stat_2_value, content_type: 'text' },
          { section_key: 'stat_2_label', content_value: filiale.stat_2_label, content_type: 'text' },
        ],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur save filiale stats:', err);
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSavingId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* En-tête de page */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">Chiffres clés</p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100 flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
                <BarChart3 className="h-5 w-5" />
              </span>
              Chiffres &amp; Statistiques
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Modifiez tous les chiffres clés et statistiques affichés sur le site public.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
              <CheckCircle className="h-4 w-4" />
              Sauvegardé avec succès
            </div>
          )}
        </div>

        {/* Onglets pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'global', label: "Page d'accueil" },
            { key: 'filiales', label: 'Par filiale' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'global' | 'filiales')}
              className={`rounded-full px-5 py-2.5 text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-slate-900 font-semibold shadow-lg shadow-[#cda434]/10'
                  : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Onglet : stats globales (accueil) */}
        {activeTab === 'global' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-slate-100 font-semibold">Chiffres clés — Page d'accueil</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Ces statistiques s'affichent dans la section « Chiffres Clés » de la page d'accueil.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {stats.map((stat, i) => (
                  <StatRow
                    key={`stat-${i}`}
                    stat={stat}
                    index={i}
                    onChange={handleStatChange}
                    onDelete={handleDeleteStat}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un chiffre
                </button>
                <button
                  type="button"
                  onClick={handleSaveGlobalStats}
                  disabled={savingId === 'global'}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#cda434]/10 w-full sm:w-auto justify-center"
                >
                  <span className="relative flex items-center justify-center h-4 w-4">
                    <Save className={`h-4 w-4 absolute transition-opacity ${savingId === 'global' ? 'opacity-0' : 'opacity-100'}`} />
                    <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${savingId === 'global' ? 'opacity-100' : 'opacity-0'}`} />
                  </span>
                  {savingId === 'global' ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Aperçu */}
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur p-6 lg:p-8">
              <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-6">
                Aperçu (rendu sur le site)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center bg-white rounded-2xl p-8">
                {stats.map((s, i) => (
                  <div key={`preview-${i}`}>
                    <div className="text-4xl font-serif text-[#0A4287] mb-2">{s.value || '—'}</div>
                    <div className="text-xs font-sans tracking-widest text-[#b8142b] uppercase">{s.label || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet : stats par filiale */}
        {activeTab === 'filiales' && (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">
              Modifiez les deux statistiques affichées sur chaque page de filiale.
            </p>
            {filiales.map((f) => (
              <div key={f.id} className="bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFiliale(expandedFiliale === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434] text-sm font-bold">
                      {f.nom.charAt(0)}
                    </div>
                    <div>
                      <span className="text-slate-100 font-medium">{f.nom}</span>
                      {(f.stat_1_value || f.stat_2_value) && (
                        <span className="ml-3 text-xs text-slate-500">
                          {f.stat_1_value && `${f.stat_1_value} · ${f.stat_1_label}`}
                          {f.stat_1_value && f.stat_2_value && ' — '}
                          {f.stat_2_value && `${f.stat_2_value} · ${f.stat_2_label}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedFiliale === f.id ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {expandedFiliale === f.id && (
                  <div className="px-6 pb-6 border-t border-white/[0.06] pt-6 space-y-6">
                    <p className="text-slate-500 text-sm">
                      Ces chiffres s'affichent en bas de la section « Vision » de la page{' '}
                      <strong className="text-slate-300">{f.nom}</strong>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stat 1 */}
                      <div className="space-y-4">
                        <h4 className="text-slate-300 text-sm font-medium flex items-center gap-2">
                          <Edit2 className="h-3.5 w-3.5 text-[#cda434]" /> Statistique 1
                        </h4>
                        <div>
                          <label className={labelClass}>Valeur</label>
                          <input
                            type="text"
                            value={f.stat_1_value}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_1_value', e.target.value)}
                            placeholder="Ex : 3"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Libellé</label>
                          <input
                            type="text"
                            value={f.stat_1_label}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_1_label', e.target.value)}
                            placeholder="Ex : Segments Stratégiques"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Stat 2 */}
                      <div className="space-y-4">
                        <h4 className="text-slate-300 text-sm font-medium flex items-center gap-2">
                          <Edit2 className="h-3.5 w-3.5 text-[#cda434]" /> Statistique 2
                        </h4>
                        <div>
                          <label className={labelClass}>Valeur</label>
                          <input
                            type="text"
                            value={f.stat_2_value}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_2_value', e.target.value)}
                            placeholder="Ex : SEBA"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Libellé</label>
                          <input
                            type="text"
                            value={f.stat_2_label}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_2_label', e.target.value)}
                            placeholder="Ex : Marque Phare"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Aperçu */}
                    <div className="bg-black/20 rounded-xl p-6 border border-white/[0.04]">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-5">Aperçu</p>
                      <div className="grid grid-cols-2 gap-8 text-center">
                        <div>
                          <div className="text-4xl font-serif text-white mb-1">{f.stat_1_value || '—'}</div>
                          <div className="text-xs text-blue-300 uppercase tracking-widest">{f.stat_1_label || '—'}</div>
                        </div>
                        <div>
                          <div className="text-4xl font-serif text-white mb-1">{f.stat_2_value || '—'}</div>
                          <div className="text-xs text-blue-300 uppercase tracking-widest">{f.stat_2_label || '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveFilialeStats(f)}
                        disabled={savingId === f.id}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 disabled:opacity-50 text-slate-900 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#cda434]/10"
                      >
                        <span className="relative flex items-center justify-center h-4 w-4">
                          <Save className={`h-4 w-4 absolute transition-opacity ${savingId === f.id ? 'opacity-0' : 'opacity-100'}`} />
                          <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${savingId === f.id ? 'opacity-100' : 'opacity-0'}`} />
                        </span>
                        {savingId === f.id ? 'Sauvegarde…' : `Sauvegarder ${f.nom}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}
