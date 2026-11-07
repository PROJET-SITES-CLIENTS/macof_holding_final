import { useEffect, useRef, useState } from 'react';
import { ImageOff, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { useInfiniteReveal } from '../../hooks/useInfiniteReveal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

type Product = {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  prix_gnf: number;
  image_url?: string;
  video_url?: string;
  disponible: boolean;
};

const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} GNF`;

const categorieBadge: Record<string, string> = {
  plats: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  boulangerie: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  boissons: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
};

const categorieLabel: Record<string, string> = {
  plats: 'Plats',
  boulangerie: 'Boulangerie',
  boissons: 'Boissons',
};

function Thumb({ src, alt, size = 48 }: { src?: string; alt: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (!src || broken) {
    return (
      <div
        style={style}
        className="flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-600 flex-shrink-0"
      >
        <ImageOff size={size * 0.4} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setBroken(true)}
      className="rounded-xl object-cover border border-white/[0.08] flex-shrink-0"
    />
  );
}

export default function MenuProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    categorie: 'plats',
    prix_gnf: '',
    image: null as File | null,
    image_url: '',
    video_url: '',
    disponible: true,
  });

  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (form.image) {
      const objectUrl = URL.createObjectURL(form.image);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(form.image_url || editing?.image_url);
  }, [form.image, form.image_url, editing]);

  const scrollRef = useRef<HTMLElement>(null);
  const { visibleItems, hasMore, sentinelRef } = useInfiniteReveal(
    products,
    20,
    scrollRef
  );

  const load = async () => {
    const response = await api.get('/api/v1/admin/restauration/menu');
    setProducts(response.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const open = (product?: Product) => {
    setEditing(product || null);
    setForm({
      nom: product?.nom || '',
      description: product?.description || '',
      categorie: product?.categorie || 'plats',
      prix_gnf: product ? String(product.prix_gnf) : '',
      image: null,
      image_url: product?.image_url || '',
      video_url: product?.video_url || '',
      disponible: product?.disponible ?? true,
    });
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData();
    data.append('nom', form.nom);
    data.append('description', form.description);
    data.append('categorie', form.categorie);
    data.append('prix_gnf', form.prix_gnf);
    data.append('disponible', String(form.disponible));
    if (form.image) data.append('image', form.image);
    if (form.image_url) data.append('image_url', form.image_url);
    if (form.video_url) data.append('video_url', form.video_url);

    if (editing) {
      await api.put(`/api/v1/admin/restauration/menu/${editing.id}`, data);
    } else {
      await api.post('/api/v1/admin/restauration/menu', data);
    }
    setEditing(null);
    setModalOpen(false);
    await load();
  };

  const confirmRemove = async () => {
    if (!itemToDelete) return;
    await api.delete(`/api/v1/admin/restauration/menu/${itemToDelete}`);
    setItemToDelete(null);
    await load();
  };

  return (
    <AdminPage loading={loading} className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#cda434]/20 to-transparent border border-[#cda434]/20 flex items-center justify-center text-[#cda434]">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            Menu &amp; Produits (SEBA)
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Gérez la carte et les produits disponibles à la commande.
          </p>
        </div>
        <button
          onClick={() => open()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#cda434]/10"
        >
          <Plus className="h-4 w-4" />
          Nouveau produit
        </button>
      </div>

      <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl backdrop-blur overflow-hidden flex flex-col">
        <section
          ref={scrollRef}
          className="flex-1 overflow-auto h-[65vh] relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="min-w-[760px]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider font-medium">Image</th>
                  <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider font-medium">Nom</th>
                  <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider font-medium">Catégorie</th>
                  <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider font-medium">Prix</th>
                  <th className="px-5 py-4 text-left text-[11px] uppercase tracking-wider font-medium">Disponibilité</th>
                  <th className="px-5 py-4 text-right text-[11px] uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((product) => (
                  <tr key={product.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <Thumb src={product.image_url} alt={product.nom} />
                    </td>
                    <td className="px-5 py-4 text-slate-200 font-medium">{product.nom}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categorieBadge[product.categorie] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                        {categorieLabel[product.categorie] || product.categorie}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300 tabular-nums">{money(product.prix_gnf)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.disponible
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${product.disponible ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {product.disponible ? 'Disponible' : 'Rupture'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        title="Modifier"
                        onClick={() => open(product)}
                        className="text-slate-400 hover:text-[#e0b83d] hover:bg-[#cda434]/10 p-2 rounded-lg transition-all mr-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => setItemToDelete(product.id)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-white/[0.04] mb-4">
                        <UtensilsCrossed className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="text-slate-300 font-medium mb-1">Aucun produit pour le moment</p>
                      <p className="text-slate-500 text-sm">Cliquez sur « Nouveau produit » pour commencer.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Sentinel row observed by IntersectionObserver to reveal the next batch */}
            {hasMore && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-500">
                Chargement…
              </div>
            )}
          </div>
        </section>

        {modalOpen ? (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <form
              onSubmit={save}
              className="bg-[#0e1626] border border-white/[0.08] p-6 lg:p-8 rounded-2xl w-full max-w-lg space-y-6 my-8 shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-slate-100">
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h3>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Nom *</label>
                <input
                  required
                  placeholder="Ex : Chawarma poulet"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Description</label>
                <textarea
                  placeholder="Description du produit"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Catégorie</label>
                  <select
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  >
                    <option value="boulangerie">Boulangerie</option>
                    <option value="plats">Plats</option>
                    <option value="boissons">Boissons</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">Prix (GNF) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="30000"
                    value={form.prix_gnf}
                    onChange={(e) => setForm({ ...form, prix_gnf: e.target.value })}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Image (fichier local ou URL)</p>
                <div className="flex items-start gap-4">
                  <Thumb src={previewUrl} alt={form.nom || 'Aperçu'} size={64} />
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                      className="text-sm w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#cda434] file:text-slate-900 hover:file:bg-[#e0b83d] file:cursor-pointer"
                    />
                    <input
                      type="url"
                      placeholder="Ou coller une URL d'image (ex : Unsplash)"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Vidéo de cuisine au survol (optionnel)
                </p>
                <input
                  type="url"
                  placeholder="URL vidéo MP4 (ex : Pexels)"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#cda434]/50 focus:ring-2 focus:ring-[#cda434]/20 transition-all"
                />
              </div>

              <label className="flex gap-3 items-center pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                  className="h-4 w-4 accent-[#cda434] cursor-pointer"
                />
                <span className="text-sm text-slate-300">Disponible à la commande</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(false);
                  }}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#cda434] to-[#e0b83d] hover:opacity-90 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={confirmRemove}
        onCancel={() => setItemToDelete(null)}
      />
    </AdminPage>
  );
}
