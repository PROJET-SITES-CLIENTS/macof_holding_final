// src/components/restauration/OrderSuccessModal.tsx
import { PackageCheck, Truck, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
}

export function OrderSuccessModal({ isOpen, onClose, reference }: OrderSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl p-6 md:p-8 text-white shadow-2xl text-center">
        {/* Bouton fermeture */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white transition p-1"
        >
          <X size={20} />
        </button>

        {/* Animation Icône */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative bg-gradient-to-tr from-red-600 to-red-500 rounded-full w-full h-full flex items-center justify-center text-white shadow-lg">
            <Truck size={36} className="animate-bounce" />
          </div>
        </div>

        {/* Contenu */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-3">
          <PackageCheck size={14} />
          <span>Commande validée</span>
        </div>

        <h3 className="text-2xl font-serif text-white mb-2">
          Livraison en cours !
        </h3>

        <p className="text-sm text-white/70 mb-4">
          Votre commande{" "}
          <span className="font-mono text-red-400 font-bold">
            #{reference || "enregistrée"}
          </span>{" "}
          a été transmise à notre équipe. Notre livreur est en route.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left mb-6 space-y-2 text-xs text-white/60">
          <div className="flex justify-between">
            <span>Mode de règlement :</span>
            <span className="text-white font-medium">Paiement à la livraison</span>
          </div>
          <div className="flex justify-between">
            <span>Statut :</span>
            <span className="text-yellow-400 font-medium">En cours de préparation</span>
          </div>
        </div>

        {/* Actions */}
        <Link
          to="/restauration#menu-commande"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3.5 px-6 rounded-lg uppercase tracking-widest text-xs transition flex items-center justify-center gap-2 shadow-lg"
        >
          <span>Retour au menu</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
