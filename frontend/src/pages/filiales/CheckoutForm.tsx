// src/components/restauration/CheckoutForm.tsx
import { useState } from "react";
import { 
  Truck, 
  CreditCard, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Check, 
  MessageSquare 
} from "lucide-react";

export type Customer = {
  nom_client: string;
  telephone: string;
  email: string;
  adresse_livraison: string;
  quartier: string;
  ville: string;
  mode_paiement: "livraison" | "djomy";
  notes: string;
};

interface CheckoutFormProps {
  onSubmit: (customer: Customer) => Promise<void>;
  submitting: boolean;
  message: string;
}

export function CheckoutForm({ onSubmit, submitting, message }: CheckoutFormProps) {
  const [customer, setCustomer] = useState<Customer>({
    nom_client: "",
    telephone: "",
    email: "",
    adresse_livraison: "",
    quartier: "",
    ville: "",
    mode_paiement: "livraison",
    notes: "",
  });

  const update = (key: keyof Customer, value: string) => {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(customer);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-[#121212] border border-white/10 p-6 md:p-8 rounded-xl shadow-2xl text-white space-y-6"
    >
      <div>
        <h2 className="text-2xl font-serif text-white tracking-wide">
          Informations de livraison
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Remplissez vos coordonnées pour acheminer votre commande.
        </p>
      </div>

      {/* Champs d'informations personnelles */}
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3.5 top-3.5 text-white/40" size={18} />
          <input
            required
            type="text"
            placeholder="Nom et prénom *"
            value={customer.nom_client}
            onChange={(e) => update("nom_client", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 text-white/40" size={18} />
            <input
              required
              type="tel"
              placeholder="Numéro de Téléphone *"
              value={customer.telephone}
              onChange={(e) => update("telephone", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 text-white/40" size={18} />
            <input
              type="email"
              placeholder="Email (facultatif)"
              value={customer.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
            />
          </div>
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 text-white/40" size={18} />
          <input
            required
            type="text"
            placeholder="Adresse exacte de livraison *"
            value={customer.adresse_livraison}
            onChange={(e) => update("adresse_livraison", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3.5 text-white/40" size={18} />
            <input
              required
              type="text"
              placeholder="Quartier *"
              value={customer.quartier}
              onChange={(e) => update("quartier", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
            />
          </div>

          <input
            required
            type="text"
            placeholder="Ville *"
            value={customer.ville}
            onChange={(e) => update("ville", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition"
          />
        </div>
      </div>

      {/* Mode de paiement personnalisé avec Radios */}
      <div className="pt-2">
        <label className="block text-xs uppercase tracking-wider text-white/60 mb-3 font-medium">
          Mode de règlement
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Livraison */}
          <label
            className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
              customer.mode_paiement === "livraison"
                ? "border-red-500 bg-red-500/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="mode_paiement"
              value="livraison"
              checked={customer.mode_paiement === "livraison"}
              onChange={(e) => update("mode_paiement", e.target.value as Customer["mode_paiement"])}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`p-2 rounded-lg ${customer.mode_paiement === "livraison" ? "bg-red-500 text-white" : "bg-white/10 text-white/60"}`}>
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Paiement à la livraison</p>
                <p className="text-xs text-white/40 mt-0.5">Espèces ou Orange Money à la réception</p>
              </div>
              {customer.mode_paiement === "livraison" && (
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          </label>

          {/* Option 2: Paiement en ligne */}
          <label
            className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
              customer.mode_paiement === "djomy"
                ? "border-red-500 bg-red-500/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="mode_paiement"
              value="djomy"
              checked={customer.mode_paiement === "djomy"}
              onChange={(e) => update("mode_paiement", e.target.value as Customer["mode_paiement"])}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`p-2 rounded-lg ${customer.mode_paiement === "djomy" ? "bg-red-500 text-white" : "bg-white/10 text-white/60"}`}>
                <CreditCard size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Paiement en ligne</p>
                <p className="text-xs text-white/40 mt-0.5">Via Orange Money, Mobile Money, bank transfer, etc.</p>
              </div>
              {customer.mode_paiement === "djomy" && (
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Note complémentaire */}
      <div className="relative">
        <MessageSquare className="absolute left-3.5 top-3.5 text-white/40" size={18} />
        <textarea
          rows={3}
          placeholder="Notes de livraison (ex: préciser un point de repère, allergie...)"
          value={customer.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-400/60 focus:ring-1 focus:ring-red-400/60 transition resize-none"
        />
      </div>

      {/* Bouton dynamique */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-4 px-6 rounded-lg uppercase tracking-widest text-xs transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Traitement en cours...
          </>
        ) : customer.mode_paiement === "livraison" ? (
          "Soumettre votre commande"
        ) : (
          "Procéder au paiement"
        )}
      </button>

      {message && (
        <div className="p-3 rounded bg-white/5 border border-white/10 text-center text-xs text-white/80">
          {message}
        </div>
      )}
    </form>
  );
}
