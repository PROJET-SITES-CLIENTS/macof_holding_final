import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock,
  Eye,
  ImageOff,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

type OrderItem = {
  nom: string;
  image_url?: string;
  quantite: number;
};

type Order = {
  id: number;
  reference: string;
  nom_client: string;
  telephone: string;
  quartier: string;
  ville: string;
  adresse_livraison?: string;
  total_gnf: number;
  acompte_gnf: number;
  reste_gnf: number;
  statut: string;
  statut_paiement: string;
  created_at: string;
  mode_paiement?: string;
  items?: OrderItem[];
};

type PillConf = { label: string; pill: string; dot: string };

const ORDER_STATUSES: Record<string, PillConf> = {
  en_attente: {
    label: 'En attente',
    pill: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    dot: 'bg-amber-400',
  },
  confirmee: {
    label: 'Confirmée',
    pill: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
    dot: 'bg-blue-400',
  },
  en_preparation: {
    label: 'En préparation',
    pill: 'border-orange-500/25 bg-orange-500/10 text-orange-400',
    dot: 'bg-orange-400',
  },
  en_livraison: {
    label: 'En livraison',
    pill: 'border-sky-500/25 bg-sky-500/10 text-sky-400',
    dot: 'bg-sky-400',
  },
  livree: {
    label: 'Livrée',
    pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  annulee: {
    label: 'Annulée',
    pill: 'border-slate-500/25 bg-slate-500/10 text-slate-400',
    dot: 'bg-slate-400',
  },
};

const PAYMENT_STATUSES: Record<string, PillConf> = {
  a_payer: {
    label: 'À payer',
    pill: 'border-slate-500/25 bg-slate-500/10 text-slate-400',
    dot: 'bg-slate-400',
  },
  en_attente: {
    label: 'En cours',
    pill: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    dot: 'bg-amber-400',
  },
  partiel: {
    label: 'Partiel',
    pill: 'border-purple-500/25 bg-purple-500/10 text-purple-400',
    dot: 'bg-purple-400',
  },
  paye: {
    label: 'Payé',
    pill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    dot: 'bg-emerald-400',
  },
  echec: {
    label: 'Échec',
    pill: 'border-red-500/25 bg-red-500/10 text-red-400',
    dot: 'bg-red-400',
  },
};

const pillConf = (map: Record<string, PillConf>, value: string): PillConf =>
  map[value] || { label: value, pill: 'border-slate-500/25 bg-slate-500/10 text-slate-400', dot: 'bg-slate-400' };

const formatMoney = (value: number) => `${(value ?? 0).toLocaleString('fr-FR')} GNF`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const day = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} à ${time}`;
};

const waLink = (telephone: string) => `https://wa.me/${(telephone || '').replace(/[\s+]/g, '')}`;

function Thumb({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!src || broken) {
    return (
      <div
        style={style}
        className="flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-600"
      >
        <ImageOff size={size * 0.45} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setBroken(true)}
      className="rounded-lg object-cover"
    />
  );
}

function StatusPill({ conf }: { conf: PillConf }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${conf.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
}

/**
 * Pill cliquable : rendu visuel premium + `<select>` natif invisible superposé
 * (robuste et accessible). Le changement appelle `onChange` (updateOrder).
 */
function PillSelect({
  value,
  options,
  onChange,
  title,
}: {
  value: string;
  options: Record<string, PillConf>;
  onChange: (value: string) => void;
  title: string;
}) {
  const conf = pillConf(options, value);
  return (
    <span className="relative inline-flex" title={title}>
      <span
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-300 hover:brightness-125 ${conf.pill}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
        {conf.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </span>
      <select
        aria-label={title}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full border-0 bg-transparent text-transparent opacity-0 focus:outline-none"
      >
        {Object.entries(options).map(([key, option]) => (
          <option key={key} value={key} className="bg-[#0e1626] text-slate-200">
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function OrderItemsPreview({ items }: { items?: OrderItem[] }) {
  if (!items || items.length === 0) {
    return <span className="text-slate-600">—</span>;
  }
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  return (
    <div className="flex items-center gap-3 min-w-56">
      <div className="flex items-center -space-x-2 shrink-0">
        {shown.map((item, i) => (
          <div key={i} className="rounded-lg ring-2 ring-[#0b1220]" title={`${item.nom} × ${item.quantite}`}>
            <Thumb src={item.image_url} alt={item.nom} />
          </div>
        ))}
        {extra > 0 && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs text-slate-400 ring-2 ring-[#0b1220]">
            +{extra}
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        {shown.map((item, i) => (
          <div
            key={`${item.nom}-${i}`}
            className="truncate text-slate-200"
            title={`${item.nom} × ${item.quantite}`}
          >
            {item.nom} <span className="text-slate-500">× {item.quantite}</span>
          </div>
        ))}
        {extra > 0 && <div className="text-xs text-slate-500">+ {extra} autre(s)</div>}
      </div>
    </div>
  );
}

export default function CommandesManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const load = async (): Promise<Order[]> => {
    const response = await api.get('/api/v1/admin/restauration/commandes');
    const data = response.data.data || [];
    setOrders(data);
    return data;
  };

  useEffect(() => {
    load().catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    load().catch(() => setOrders([])).finally(() => setLoading(false));
  };

  const updateOrder = async (id: number, field: 'statut' | 'statut_paiement', value: string) => {
    try {
      await api.put(`/api/v1/admin/restauration/commandes/${id}/${field === 'statut' ? 'statut' : 'paiement'}`, {
        [field]: value,
      });
    } finally {
      // Recharge même en cas d'échec pour resynchroniser les selects contrôlés
      await load().catch(() => undefined);
    }
  };

  const confirmRemoveOrder = async () => {
    if (!orderToDelete) return;
    try {
      await api.delete(`/api/v1/admin/restauration/commandes/${orderToDelete}`);
      setOrderToDelete(null);
      await load();
    } catch {
      // Toast déjà affiché par l'intercepteur — on laisse la modale ouverte
    }
  };

  // Fermeture de la modale détail avec Échap
  useEffect(() => {
    if (selectedId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const selectedOrder = selectedId === null ? null : orders.find((o) => o.id === selectedId) ?? null;

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.statut !== statusFilter) return false;
      if (paymentFilter !== 'all' && order.statut_paiement !== paymentFilter) return false;
      if (!q) return true;
      return (
        order.reference?.toLowerCase().includes(q) ||
        order.nom_client?.toLowerCase().includes(q) ||
        order.telephone?.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
  };

  const todayOrders = useMemo(() => orders.filter((o) => isToday(o.created_at)), [orders]);

  const stats = [
    {
      label: "Aujourd'hui",
      value: String(todayOrders.length),
      icon: CalendarDays,
      color: 'text-blue-400',
      tile: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 ring-1 ring-blue-500/20',
      glow: 'from-blue-500/[0.07]',
    },
    {
      label: 'En attente',
      value: String(orders.filter((o) => o.statut === 'en_attente').length),
      icon: Clock,
      color: 'text-amber-400',
      tile: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20',
      glow: 'from-amber-500/[0.07]',
    },
    {
      label: 'En livraison',
      value: String(orders.filter((o) => o.statut === 'en_livraison').length),
      icon: Truck,
      color: 'text-sky-400',
      tile: 'bg-gradient-to-br from-sky-500/20 to-sky-500/5 ring-1 ring-sky-500/20',
      glow: 'from-sky-500/[0.07]',
    },
    {
      label: 'CA du jour',
      value: formatMoney(todayOrders.filter((o) => o.statut !== 'annulee').reduce((sum, o) => sum + (o.total_gnf || 0), 0)),
      icon: Banknote,
      color: 'text-emerald-400',
      tile: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/20',
      glow: 'from-emerald-500/[0.07]',
    },
  ];

  const selectClasses =
    'appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-9 text-sm text-slate-200 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/20';

  return (
    <AdminPage loading={loading}>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
              Restauration SEBA
            </p>
            <h2 className="mt-1.5 text-2xl font-bold text-slate-100">Commandes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Livraison, paiement et suivi opérationnel des commandes du menu.
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        {/* Cartes de synthèse */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((card) => {
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
                <p
                  className={`relative mt-5 font-bold tracking-tight text-slate-100 ${
                    card.value.length > 12 ? 'text-2xl' : 'text-3xl'
                  }`}
                >
                  {card.value}
                </p>
                <p className="relative mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filtres */}
        <section className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (référence, nom, téléphone)…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/20"
              />
            </div>
            <div className="relative">
              <ClipboardList className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrer par statut"
                className={selectClasses}
              >
                <option value="all" className="bg-[#0e1626] text-slate-200">Tous les statuts</option>
                {Object.entries(ORDER_STATUSES).map(([key, conf]) => (
                  <option key={key} value={key} className="bg-[#0e1626] text-slate-200">
                    {conf.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
            <div className="relative">
              <Banknote className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                aria-label="Filtrer par paiement"
                className={selectClasses}
              >
                <option value="all" className="bg-[#0e1626] text-slate-200">Tous les paiements</option>
                {Object.entries(PAYMENT_STATUSES).map(([key, conf]) => (
                  <option key={key} value={key} className="bg-[#0e1626] text-slate-200">
                    {conf.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </section>

        {/* Table des commandes */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Commandes reçues</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Cliquez sur un statut ou un paiement pour le faire évoluer.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-400">
              {filteredOrders.length} sur {orders.length} commande{orders.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Date</th>
                  <th className="px-6 py-3.5 font-medium">Client</th>
                  <th className="px-6 py-3.5 font-medium">Articles</th>
                  <th className="px-6 py-3.5 font-medium">Livraison</th>
                  <th className="px-6 py-3.5 font-medium">Montant</th>
                  <th className="px-6 py-3.5 font-medium">Statut</th>
                  <th className="px-6 py-3.5 font-medium">Paiement</th>
                  <th className="px-6 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const deletable = order.statut === 'livree' && order.statut_paiement === 'paye';
                  return (
                    <tr key={order.id} className="border-b border-white/[0.04] transition-colors duration-300 hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="whitespace-nowrap text-slate-400">{formatDate(order.created_at)}</div>
                        <div className="mt-0.5 font-mono text-xs text-[#e0b83d]">{order.reference}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{order.nom_client}</div>
                        <a
                          href={`tel:${order.telephone}`}
                          className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors duration-300 hover:text-[#e0b83d]"
                        >
                          <Phone className="h-3 w-3" />
                          {order.telephone}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <OrderItemsPreview items={order.items} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300">{order.quartier}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{order.ville}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="whitespace-nowrap font-semibold text-slate-100">
                          {formatMoney(order.total_gnf)}
                        </div>
                        <div className="mt-0.5 whitespace-nowrap text-xs text-slate-500">
                          Acompte {formatMoney(order.acompte_gnf)} · Reste {formatMoney(order.reste_gnf)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PillSelect
                          value={order.statut}
                          options={ORDER_STATUSES}
                          onChange={(value) => updateOrder(order.id, 'statut', value)}
                          title="Changer le statut de la commande"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <PillSelect
                          value={order.statut_paiement}
                          options={PAYMENT_STATUSES}
                          onChange={(value) => updateOrder(order.id, 'statut_paiement', value)}
                          title="Changer le statut du paiement"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedId(order.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-300 hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Détails
                          </button>
                          {deletable ? (
                            <button
                              type="button"
                              onClick={() => setOrderToDelete(order.id)}
                              title="Supprimer la commande"
                              className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="Suppression possible uniquement lorsque la commande est livrée et payée"
                              className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-slate-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16">
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06]">
                          <ClipboardList className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-300">
                          {orders.length === 0 ? 'Aucune commande' : 'Aucun résultat'}
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                          {orders.length === 0
                            ? 'Les commandes passées sur le menu SEBA apparaîtront ici dès leur réception.'
                            : 'Aucune commande ne correspond à votre recherche ou à vos filtres.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modale détail commande */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e1626] shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
                  Détail de la commande
                </p>
                <h3 className="mt-1 font-mono text-lg font-bold text-[#e0b83d]">{selectedOrder.reference}</h3>
                <p className="mt-1 text-xs capitalize text-slate-500">{formatFullDate(selectedOrder.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill conf={pillConf(ORDER_STATUSES, selectedOrder.statut)} />
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-slate-200"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    Client
                  </p>
                  <p className="mt-2.5 text-sm font-medium text-slate-200">{selectedOrder.nom_client}</p>
                  <a
                    href={`tel:${selectedOrder.telephone}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors duration-300 hover:text-[#e0b83d]"
                  >
                    <Phone className="h-3 w-3" />
                    {selectedOrder.telephone}
                  </a>
                  <a
                    href={waLink(selectedOrder.telephone)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] transition-all duration-300 hover:bg-emerald-500"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Livraison
                  </p>
                  {selectedOrder.adresse_livraison ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-200">
                      {selectedOrder.adresse_livraison}
                    </p>
                  ) : (
                    <p className="mt-2.5 text-sm text-slate-600">Adresse non renseignée</p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-400">{selectedOrder.quartier}</p>
                  <p className="text-xs text-slate-400">{selectedOrder.ville}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Articles</p>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <ul className="mt-1 divide-y divide-white/[0.04]">
                    {selectedOrder.items.map((item, i) => (
                      <li key={`${item.nom}-${i}`} className="flex items-center gap-3 py-2.5">
                        <Thumb src={item.image_url} alt={item.nom} size={36} />
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{item.nom}</span>
                        <span className="text-xs font-medium text-slate-500">× {item.quantite}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Aucun article renseigné.</p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Montants</p>
                <dl className="mt-2 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Total</dt>
                    <dd className="font-medium text-slate-200">{formatMoney(selectedOrder.total_gnf)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Acompte</dt>
                    <dd className="font-medium text-slate-200">{formatMoney(selectedOrder.acompte_gnf)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-2.5">
                    <dt className="text-slate-400">Reste à payer</dt>
                    <dd
                      className={`font-semibold ${
                        selectedOrder.reste_gnf > 0 ? 'text-[#e0b83d]' : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(selectedOrder.reste_gnf)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="order-status-select"
                  className="text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Changer le statut
                </label>
                <div className="relative">
                  <select
                    id="order-status-select"
                    value={selectedOrder.statut}
                    onChange={(e) => updateOrder(selectedOrder.id, 'statut', e.target.value)}
                    className="appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-4 pr-9 text-sm font-medium text-slate-200 transition-all duration-300 focus:border-[#cda434]/50 focus:outline-none focus:ring-2 focus:ring-[#cda434]/20"
                  >
                    {Object.entries(ORDER_STATUSES).map(([key, conf]) => (
                      <option key={key} value={key} className="bg-[#0e1626] text-slate-200">
                        {conf.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={orderToDelete !== null}
        title="Supprimer la commande"
        message="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={confirmRemoveOrder}
        onCancel={() => setOrderToDelete(null)}
      />
    </AdminPage>
  );
}
