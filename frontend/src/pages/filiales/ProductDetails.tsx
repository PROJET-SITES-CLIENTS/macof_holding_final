import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { DEFAULT_FALLBACK_IMAGE, getImageUrl } from '../../lib/utils';
import { useCart } from '../../components/restauration/CartContext';
import type { Product } from '../../components/restauration/CartContext';

const money = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} GNF`;

export default function ProductDetails() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get(`/restauration/menu/${id}`).then((response) => setProduct(response.data?.data || null)).catch(() => setProduct(null)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <main className="min-h-screen bg-[#0b0b0b] pt-40 text-center text-white/60">Chargement du produit...</main>;
  if (!product) return <main className="min-h-screen bg-[#0b0b0b] pt-40 text-center text-white"><p>Produit introuvable.</p><Link to="/restauration" className="inline-flex mt-6 text-red-200">Retour au menu</Link></main>;
  return <main className="min-h-screen bg-[#0b0b0b] pt-32 pb-24 text-white"><div className="max-w-6xl mx-auto px-6 lg:px-12"><Link to="/restauration#menu-commande" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-12"><ArrowLeft size={16} /> Retour au menu</Link><div className="grid lg:grid-cols-2 gap-12 items-center"><div className="aspect-[4/3] overflow-hidden bg-white/5"><img src={getImageUrl(product.image_url || undefined)} alt={product.nom} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }} /></div><div><p className="text-xs tracking-[0.3em] uppercase text-red-200 mb-4">{product.categorie}</p><h1 className="text-5xl md:text-7xl font-serif mb-6">{product.nom}</h1><p className="text-lg leading-relaxed text-white/65 mb-8">{product.description || 'Une création préparée avec soin par SEBA International.'}</p><div className="flex items-center justify-between border-y border-white/10 py-6"><strong className="text-2xl">{money(product.prix_gnf)}</strong><button onClick={() => add(product)} className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 uppercase tracking-widest text-xs hover:bg-red-200"><Plus size={16} /> Ajouter au panier</button></div><Link to="/checkout" className="mt-6 inline-flex items-center gap-2 text-red-200"><ShoppingBag size={17} /> Voir le checkout</Link></div></div></div></main>;
}
