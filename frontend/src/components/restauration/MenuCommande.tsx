import { useEffect, useRef, useState } from 'react';
import { ImageOff, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { useInfiniteReveal } from '../../hooks/useInfiniteReveal';
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
  total_gnf: number;
  acompte_gnf: number;
  reste_gnf: number;
  statut: string;
  statut_paiement: string;
  // Optionnel : nécessite que GET /commandes renvoie les articles de chaque
  // commande avec leur image_url (jointe depuis le produit). Si absent,
  // la colonne "Articles" affiche simplement un tiret.
  items?: OrderItem[];
};

const orderStatuses = ['en_attente', 'confirmee', 'en_preparation', 'en_livraison', 'livree', 'annulee'];
const paymentStatuses = ['a_payer', 'en_attente', 'partiel', 'paye', 'echec'];
const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} GNF`;

function Thumb({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!src || broken) {
    return (
      <div
        style={style}
        className="flex items-center justify-center rounded-md bg-slate-800 border border-slate-700 text-slate-600 flex-shrink-0"
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
      className="rounded-md object-cover border border-slate-700 flex-shrink-0"
    />
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
      <div className="flex items-center -space-x-2 flex-shrink-0">
        {shown.map((item, i) => (
          <div key={i} title={`${item.nom} × ${item.quantite}`} className="ring-2 ring-[#1e293b] rounded-md">
            <Thumb src={item.image_url} alt={item.nom} />
          </div>
        ))}
        {extra > 0 && (
          <div className="ring-2 ring-[#1e293b] rounded-md h-10 w-10 flex items-center justify-center bg-slate-800 border border-slate-700 text-xs text-slate-400">
            +{extra}
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        {shown.map((item, i) => (
          <div key={`${item.nom}-${i}`} className="truncate text-slate-200" title={`${item.nom} × ${item.quantite}`}>
            {item.nom} <span className="text-slate-500">× {item.quantite}</span>
          </div>
        ))}
        {extra > 0 && <div className="text-xs text-slate-500">+ {extra} autre(s)</div>}
      </div>
    </div>
  );
}

export default function MenuCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { visibleItems, visibleCount, total, hasMore, sentinelRef } = useInfiniteReveal(
    orders,
    20,
    scrollRef
  );

  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  const confirmRemoveOrder = async () => {
    if (!orderToDelete) return;
    await api.delete(`/api/v1/admin/restauration/commandes/${orderToDelete}`);
    setOrderToDelete(null);
    await load();
  };

  const load = async () => {
    const response = await api.get('/api/v1/admin/restauration/commandes');
    setOrders(response.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const updateOrder = async (id: number, field: 'statut' | 'statut_paiement', value: string) => {
    await api.put(
      `/api/v1/admin/restauration/commandes/${id}/${field === 'statut' ? 'statut' : 'paiement'}`,
      { [field]: value }
    );
    await load();
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-6 text-slate-200">
        <div>
          <h2 className="text-2xl font-bold">Commandes</h2>
          <p className="text-slate-400 text-sm mt-1">Livraison, paiement et suivi opérationnel.</p>
        </div>

        <section className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold">Commandes reçues</h3>
            <span className="text-xs text-slate-500">
              {visibleCount} sur {total}
            </span>
          </div>

          <div ref={scrollRef} className="overflow-y-auto overflow-x-auto max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-4 text-left">Articles</th>
                  <th className="p-4 text-left">Commande / client</th>
                  <th className="p-4 text-left">Livraison</th>
                  <th className="p-4 text-left">Total</th>
                  <th className="p-4 text-left">Commande</th>
                  <th className="p-4 text-left">Paiement</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {visibleItems.map((order) => (
                  <tr key={order.id}>
                    <td className="p-4">
                      <OrderItemsPreview items={order.items} />
                    </td>
                    <td className="p-4">
                      <strong>{order.reference}</strong>
                      <br />
                      {order.nom_client}
                      <br />
                      <span className="text-slate-400">{order.telephone}</span>
                    </td>
                    <td className="p-4">
                      {order.quartier}, {order.ville}
                    </td>
                    <td className="p-4">
                      {money(order.total_gnf)}
                      <br />
                      <span className="text-xs text-slate-400">
                        Acompte {money(order.acompte_gnf)} / reste {money(order.reste_gnf)}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.statut}
                        onChange={(e) => updateOrder(order.id, 'statut', e.target.value)}
                        className="bg-slate-800 border border-slate-600 p-2 rounded"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.statut_paiement}
                        onChange={(e) => updateOrder(order.id, 'statut_paiement', e.target.value)}
                        className="bg-slate-800 border border-slate-600 p-2 rounded"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      {order.statut === 'livree' && order.statut_paiement === 'paye' && (
                        <button title="Supprimer" onClick={() => setOrderToDelete(order.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Aucune commande pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {hasMore && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-500">
                Chargement...
              </div>
            )}
          </div>
        </section>
      </div>
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




