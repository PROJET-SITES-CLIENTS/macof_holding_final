import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Building2, RefreshCw, Inbox, MousePointerClick } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface Demande {
  id: number;
  reference: string;
  nom_complet: string;
  email: string;
  telephone: string;
  filiale: string;
  type_demande: string;
  statut: string;
  created_at: string;
}

interface Filiale {
  id: number;
  nom: string;
  statut: string;
}

function StatutBadge({ statut, onClick }: { statut: string; onClick?: () => void }) {
  const styles: Record<string, string> = {
    nouveau: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    en_cours: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    traite: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    archive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  const dots: Record<string, string> = {
    nouveau: 'bg-blue-400',
    en_cours: 'bg-amber-400',
    traite: 'bg-emerald-400',
    archive: 'bg-slate-400',
  };

  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    traite: 'Traité',
    archive: 'Archivé',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Cliquer pour changer le statut"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-300 hover:brightness-125 ${
        styles[statut] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[statut] || 'bg-slate-400'}`} />
      {labels[statut] || statut}
    </button>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [demandesRes, filialesRes, statsRes] = await Promise.all([
        api.get('/api/v1/admin/demandes?limit=100'),
        api.get('/api/v1/admin/filiales'),
        api.get('/api/v1/admin/dashboard/stats'),
      ]);
      return { demandesRes, filialesRes, statsRes };
    },

  });

  const demandes = data?.demandesRes?.data?.success
    ? (Array.isArray(data.demandesRes.data.data) ? data.demandesRes.data.data : (data.demandesRes.data.data.items || []))
    : [];
  const filiales = data?.filialesRes?.data?.success ? data.filialesRes.data.data || [] : [];
  const stats = data?.statsRes?.data?.success ? data.statsRes.data.data : null;

  const kpi = {
    total: stats?.total_demandes ?? demandes.length,
    traite: demandes.filter((d: Demande) => d.statut === 'traite').length,
    nouveau: stats?.nouvelles_demandes ?? demandes.filter((d: Demande) => d.statut === 'nouveau').length,
    filialesActives: filiales.filter((f: Filiale) => f.statut === 'actif').length,
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.put(`/api/v1/admin/demandes/${id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const cycleStatus = (demande: Demande) => {
    const order = ['nouveau', 'en_cours', 'traite', 'archive'];
    const idx = order.indexOf(demande.statut);
    const next = order[(idx + 1) % order.length];
    handleStatusUpdate(demande.id, next);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const recentDemandes = [...demandes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);


  const kpiCards = [
    {
      label: 'Total demandes',
      value: kpi.total,
      icon: Mail,
      color: 'text-blue-400',
      tile: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 ring-1 ring-blue-500/20',
      glow: 'from-blue-500/[0.07]',
    },
    {
      label: 'Traitées',
      value: kpi.traite,
      icon: CheckCircle,
      color: 'text-emerald-400',
      tile: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20',
      glow: 'from-emerald-500/[0.07]',
    },
    {
      label: 'Nouvelles demandes',
      value: kpi.nouveau,
      icon: AlertCircle,
      color: 'text-amber-400',
      tile: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20',
      glow: 'from-amber-500/[0.07]',
    },
    {
      label: 'Filiales actives',
      value: kpi.filialesActives,
      icon: Building2,
      color: 'text-[#e0b83d]',
      tile: 'bg-gradient-to-br from-[#cda434]/25 to-[#cda434]/5 ring-1 ring-[#cda434]/25',
      glow: 'from-[#cda434]/[0.08]',
    },
  ];

  return (
    <AdminPage loading={loading} className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
            MACOF Holding
          </p>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-100">Vue d'ensemble</h2>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l'activité des demandes et de vos filiales en un coup d'œil.
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboardData'] })}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cda434]/30 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${card.glow} to-transparent blur-2xl`}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.tile}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="relative mt-5 text-3xl font-bold tracking-tight text-slate-100">
                {card.value}
              </p>
              <p className="relative mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Demandes récentes */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Demandes récentes</h3>
            <p className="mt-0.5 hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <MousePointerClick className="h-3.5 w-3.5" />
              Cliquez sur un statut pour le faire évoluer
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-400">
            {recentDemandes.length} sur {demandes.length} demandes
          </span>
        </div>

        <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5 font-medium">Réf.</th>
                <th className="px-6 py-3.5 font-medium">Nom</th>
                <th className="px-6 py-3.5 font-medium">Filiale</th>
                <th className="px-6 py-3.5 font-medium">Statut</th>
                <th className="px-6 py-3.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentDemandes.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-white/[0.04] transition-colors duration-300 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-[#e0b83d]">
                    {d.reference || `#${d.id}`}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-200">
                    {d.nom_complet}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">{d.filiale}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {updatingId === d.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <StatutBadge statut={d.statut} onClick={() => cycleStatus(d)} />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                    {formatDate(d.created_at)}
                  </td>
                </tr>
              ))}
              {recentDemandes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="mx-auto flex max-w-xs flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
                        <Inbox className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-300">
                        Aucune demande reçue
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Les nouvelles demandes de contact apparaîtront ici en temps réel.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}
