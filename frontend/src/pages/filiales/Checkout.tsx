// src/pages/restauration/Checkout.tsx
import { useEffect, useState } from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useCart } from "../../components/restauration/CartContext";
import { CheckoutForm, type Customer } from "./CheckoutForm";
import { OrderSuccessModal } from "./OrderSuccessModal";

const money = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} GNF`;

type PaymentReturnState =
  | { status: "checking"; reference: string }
  | { status: "success"; reference: string }
  | { status: "failed"; reference: string; reason?: string }
  | { status: "cancelled"; reference: string }
  | null;

export default function Checkout() {
  const { items, subtotal, add, remove, clear } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentReturn, setPaymentReturn] = useState<PaymentReturnState>(null);

  // Modal pour la livraison
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [lastOrderRef, setLastOrderRef] = useState("");

  // ─── Gestion du retour Djomy ───────────────────────────────────────────
  useEffect(() => {
    const reference = searchParams.get("commande");
    if (!reference) return;

    const cancelled = searchParams.get("paiement") === "annule";

    if (cancelled) {
      setPaymentReturn({ status: "cancelled", reference });
      clear();
      setSearchParams({}, { replace: true });
      return;
    }

    setPaymentReturn({ status: "checking", reference });

    api
      .get(`/restauration/commandes/${encodeURIComponent(reference)}/statut`)
      .then((response) => {
        const statutPaiement = response.data?.data?.statut_paiement;
        if (statutPaiement === "paye") {
          setPaymentReturn({ status: "success", reference });
          clear();
        } else if (statutPaiement === "echec") {
          setPaymentReturn({ status: "failed", reference });
        } else {
          setPaymentReturn({
            status: "failed",
            reference,
            reason: "en_attente",
          });
        }
      })
      .catch(() => {
        setPaymentReturn({ status: "failed", reference });
      })
      .finally(() => {
        setSearchParams({}, { replace: true });
      });
  }, []);

  const handleFormSubmit = async (customer: Customer) => {
    setMessage("");
    setSubmitting(true);
    try {
      const response = await api.post("/restauration/commandes", {
        ...customer,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      if (response.data?.data?.paymentUrl) {
        // Redirection vers le paiement en ligne (Djomy)
        window.location.assign(response.data.data.paymentUrl);
      } else {
        // Paiement à la livraison : afficher le Modal
        const ref = response.data?.data?.reference || "";
        setLastOrderRef(ref);
        setShowDeliveryModal(true);
        clear();
      }
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Impossible d’enregistrer la commande.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Écran dédié pour le retour Djomy
  if (paymentReturn) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] pt-32 pb-24 text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-white/10 bg-white/[0.03] p-10 text-center rounded-2xl backdrop-blur-sm">
          {paymentReturn.status === "checking" && (
            <>
              <Loader2 className="mx-auto mb-5 animate-spin text-red-400" size={40} />
              <h1 className="text-2xl font-serif mb-2">Vérification du paiement…</h1>
              <p className="text-white/60 text-sm">Commande {paymentReturn.reference}</p>
            </>
          )}
          {paymentReturn.status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-5 text-green-400" size={48} />
              <h1 className="text-2xl font-serif mb-2">Paiement confirmé</h1>
              <p className="text-white/60 text-sm mb-6">
                Votre commande <strong className="text-white">{paymentReturn.reference}</strong> a bien été enregistrée et payée.
              </p>
              <Link
                to="/restauration#menu-commande"
                className="inline-block bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 text-xs uppercase tracking-widest rounded-lg transition"
              >
                Retour au menu
              </Link>
            </>
          )}
          {paymentReturn.status === "cancelled" && (
            <>
              <XCircle className="mx-auto mb-5 text-yellow-400" size={48} />
              <h1 className="text-2xl font-serif mb-2">Paiement annulé</h1>
              <p className="text-white/60 text-sm mb-6">
                Vous avez quitté la page de paiement avant de finaliser la commande {paymentReturn.reference}.
              </p>
              <Link
                to="/restauration#menu-commande"
                className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 text-xs uppercase tracking-widest rounded-lg transition"
              >
                Retour au menu
              </Link>
            </>
          )}
          {paymentReturn.status === "failed" && (
            <>
              <XCircle className="mx-auto mb-5 text-red-500" size={48} />
              <h1 className="text-2xl font-serif mb-2">
                {paymentReturn.reason === "en_attente" ? "Paiement en attente" : "Paiement non confirmé"}
              </h1>
              <p className="text-white/60 text-sm mb-6">
                {paymentReturn.reason === "en_attente"
                  ? `Le traitement de votre paiement pour la commande ${paymentReturn.reference} est toujours en cours.`
                  : `Le paiement de la commande ${paymentReturn.reference} n'a pas pu être confirmé.`}
              </p>
              <Link
                to="/restauration#menu-commande"
                className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 text-xs uppercase tracking-widest rounded-lg transition"
              >
                Retour au menu
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] pt-32 pb-24 text-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-red-400 mb-2 font-medium">
            Finaliser la commande
          </p>
          <h1 className="text-4xl md:text-6xl font-serif">Votre Panier</h1>
        </div>

        {!items.length && !showDeliveryModal ? (
          <div className="border border-white/10 rounded-2xl bg-white/[0.02] p-16 text-center">
            <ShoppingBag className="mx-auto mb-5 text-white/30" size={48} />
            <p className="text-white/60 text-lg">Votre panier est actuellement vide.</p>
            <Link
              to="/restauration#menu-commande"
              className="inline-block mt-6 bg-red-600 hover:bg-red-500 text-white px-8 py-3.5 rounded-lg text-xs uppercase tracking-widest font-medium transition"
            >
              Découvrir le menu
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            {/* Panier */}
            <section className="border border-white/10 bg-[#121212] p-6 md:p-8 rounded-xl shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-serif">Récapitulatif</h2>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-white/40 hover:text-red-400 transition"
                >
                  Vider le panier
                </button>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 border-b border-white/5 pb-4 items-center"
                  >
                    <img
                      src={item.product.image_url || "/placeholder.jpg"}
                      alt={item.product.nom}
                      className="w-16 h-16 object-cover rounded-lg bg-white/10"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/restauration/produit/${item.product.id}`}
                        className="font-serif text-base hover:text-red-400 transition"
                      >
                        {item.product.nom}
                      </Link>
                      <p className="text-xs text-white/50">
                        {money(item.product.prix_gnf)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => remove(item.product.id)}
                          className="p-1 rounded border border-white/10 hover:bg-white/10 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs px-2">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => add(item.product)}
                          className="p-1 rounded border border-white/10 hover:bg-white/10 transition"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            for (let i = 0; i < item.quantity; i++) remove(item.product.id);
                          }}
                          className="ml-auto text-white/30 hover:text-red-400 transition p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <strong className="text-sm font-medium">
                      {money(item.product.prix_gnf * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-white/10 pt-5 mt-4 text-base">
                <span className="text-white/70">Sous-total</span>
                <strong className="text-lg text-red-400">{money(subtotal)}</strong>
              </div>
            </section>

            {/* Formulaire */}
            <CheckoutForm
              onSubmit={handleFormSubmit}
              submitting={submitting}
              message={message}
            />
          </div>
        )}
      </div>

      {/* Modal affiché lors de la soumission d'une commande à la livraison */}
      <OrderSuccessModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        reference={lastOrderRef}
      />
    </main>
  );
}
