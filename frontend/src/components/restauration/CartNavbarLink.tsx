import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from './CartContext';

export function CartNavbarLink() {
  const { count } = useCart();
  if (!count) return null;
  return <Link to="/checkout" className="relative inline-flex items-center gap-2 text-white hover:text-red-200 transition-colors" aria-label="Voir le panier"><ShoppingBag size={18} /><span className="text-[10px] uppercase tracking-widest">Panier</span><span className="absolute -top-3 -right-3 min-w-5 h-5 px-1 rounded-full bg-red-400 text-black text-[10px] font-bold flex items-center justify-center">{count}</span></Link>;
}
