import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface Lead {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  filiale: string;
  type_demande: string;
  objet: string;
  message: string;
  reference: string;
  statut: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'traite', label: 'Traité' },
  { value: 'archive', label: 'Archivé' },
];

export default function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [filialeFilter, setFilialeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<Lead | null>(null);

  const { data: leads = [], isLoading: loading, error, refetch: fetchLeads } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: async (): Promise<Lead[]> => {
      const response = await api.get('/api/v1/admin/demandes?limit=100');
      if (response.data.success) {
        const data = response.data.data;
        return Array.isArray(data) ? data : (data.items || []);
      }
      return [];
    },

  });

  // Extract unique filiales from data
  const filiales = Array.from(new Set(leads.map((l) => l.filiale))).filter(Boolean).sort();

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();
    const matchSearch =
      !search ||
      (lead.nom_complet || '').toLowerCase().includes(query) ||
      (lead.email || '').toLowerCase().includes(query) ||
      (lead.reference && lead.reference.toLowerCase().includes(query));
    const matchStatut = !statutFilter || lead.statut === statutFilter;
    const matchFiliale = !filialeFilter || lead.filiale === filialeFilter;
    return matchSearch && matchStatut && matchFiliale;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statutFilter, filialeFilter]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/v1/admin/demandes/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statutBadge = (statut: string) => {
    const map: Record<string, string> = {
      nouveau: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      en_cours: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      traite: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      archive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return map[statut] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const statutDot = (statut: string) => {
    const map: Record<string, string> = {
      nouveau: 'bg-blue-400',
      en_cours: 'bg-amber-400',
      traite: 'bg-emerald-400',
      archive: 'bg-slate-400',
    };
    return map[statut] || 'bg-slate-400';
  };

  const statutLabel = (statut: string) => {
    const map: Record<string, string> = {
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      traite: 'Traité',
      archive: 'Archivé',
    };
    return map[statut] || statut;
  };


  return (
    <AdminPage loading={loading} className="space-y-8">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-300">Erreur de chargement des demandes</p>
            <p className="mt-0.5 text-xs text-red-400/70">
              Vérifiez votre connexion puis réessayez d'actualiser la page.
            </p>
          </div>
        </div>
      )}

      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
            Relation clients
          </p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-100">Demandes reçues</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredLeads.length} demande{filteredLeads.length > 1 ? 's' : ''} trouvée
            {filteredLeads.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => fetchLeads()}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, e-mail ou référence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-500 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30"
            />
          </div>
          <div className="relative">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-4 pr-10 text-sm text-slate-200 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30 lg:w-48"
            >
              {statutOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
          <div className="relative">
            <select
              value={filialeFilter}
              onChange={(e) => setFilialeFilter(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-4 pr-10 text-sm text-slate-200 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/30 lg:w-52"
            >
              <option value="">Toutes les filiales</option>
              {filiales.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
        <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5 font-medium">Référence</th>
                <th className="px-6 py-3.5 font-medium">Filiale</th>
                <th className="px-6 py-3.5 font-medium">Client</th>
                <th className="px-6 py-3.5 font-medium">Type</th>
                <th className="px-6 py-3.5 font-medium">Statut</th>
                <th className="px-6 py-3.5 font-medium">Date</th>
                <th className="px-6 py-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.04] transition-colors duration-300 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-[#e0b83d]">
                    {lead.reference || `#${lead.id}`}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">{lead.filiale}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{lead.nom_complet}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{lead.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 capitalize text-slate-400">
                    {lead.type_demande}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {updatingId === lead.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <span
                        className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-2 text-xs font-medium transition-all duration-300 hover:brightness-125 ${statutBadge(
                          lead.statut
                        )}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statutDot(lead.statut)}`} />
                        <select
                          value={lead.statut}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-medium focus:outline-none"
                          title="Changer le statut"
                        >
                          <option value="nouveau">Nouveau</option>
                          <option value="en_cours">En cours</option>
                          <option value="traite">Traité</option>
                          <option value="archive">Archivé</option>
                        </select>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => setShowDetails(lead)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-[#e0b83d] transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16">
                    <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
                        <Inbox className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-300">
                        Aucune demande trouvée
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-white/[0.06] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page <span className="font-medium text-slate-300">{currentPage}</span> sur{' '}
              {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale de détails */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-r from-[#cda434]/[0.07] via-transparent to-transparent px-7 py-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#cda434]">
                  Détails de la demande
                </p>
                <h3 className="mt-1 font-mono text-lg font-semibold text-slate-100">
                  {showDetails.reference || `#${showDetails.id}`}
                </h3>
              </div>
              <button
                onClick={() => setShowDetails(null)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-7 py-6">
              <div className="grid grid-cols-1 gap-x-4 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Statut
                  </span>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statutBadge(
                        showDetails.statut
                      )}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statutDot(showDetails.statut)}`} />
                      {statutLabel(showDetails.statut)}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Date de réception
                  </span>
                  <p className="mt-1 text-slate-200">{formatDate(showDetails.created_at)}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Nom complet
                  </span>
                  <p className="mt-1 text-slate-200">{showDetails.nom_complet}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    E-mail
                  </span>
                  <p className="mt-1 break-all text-slate-200">{showDetails.email}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Téléphone
                  </span>
                  <p className="mt-1 text-slate-200">{showDetails.telephone || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Filiale
                  </span>
                  <p className="mt-1 text-slate-200">{showDetails.filiale}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Type
                  </span>
                  <p className="mt-1 capitalize text-slate-200">{showDetails.type_demande}</p>
                </div>
              </div>

              {showDetails.objet && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Objet
                  </span>
                  <p className="mt-1.5 text-sm text-slate-200">{showDetails.objet}</p>
                </div>
              )}
              {showDetails.message && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Message
                  </span>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {showDetails.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-white/[0.06] px-7 py-5">
              <button
                onClick={() => setShowDetails(null)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
