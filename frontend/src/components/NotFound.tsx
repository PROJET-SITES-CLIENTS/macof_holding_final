import { Link } from "react-router-dom";
import { Home, Mail, ArrowLeft } from "lucide-react";

/**
 * NotFound — Page 404 publique, épurée.
 * Aucune référence au back-office : un visiteur égaré est
 * simplement ramené vers l'accueil ou le contact.
 */
export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden bg-[#0b1220] px-6 py-20 text-center">
      {/* Halo doré d'ambiance */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(205,164,52,0.12),transparent_65%)]" />

      <p className="font-[Cormorant_Garamond] text-[7rem] font-bold leading-none text-transparent sm:text-[9rem] bg-gradient-to-b from-[#e0b83d] to-[#cda434]/30 bg-clip-text">
        404
      </p>
      <h1 className="mt-4 font-[Cormorant_Garamond] text-3xl font-semibold text-slate-100 sm:text-4xl">
        Cette page n'existe pas
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
        Le lien que vous avez suivi est peut-être obsolète, ou la page a été déplacée.
        Explorez nos domaines d'activité ou contactez-nous directement.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-6 py-3 text-sm font-semibold text-[#1a1405] shadow-[0_10px_28px_-10px_rgba(205,164,52,0.55)] transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Retour à l'accueil
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d]"
        >
          <Mail className="h-4 w-4" />
          Nous contacter
        </Link>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Page précédente
        </button>
      </div>
    </div>
  );
}
