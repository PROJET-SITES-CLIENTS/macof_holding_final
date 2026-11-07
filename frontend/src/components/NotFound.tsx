import React from "react";
import { 
  ArrowLeft, 
  Home, 
  Search, 
  Building2, 
  BookOpen, 
  Mail, 
  Compass, 
  ShieldAlert 
} from "lucide-react";

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col justify-between overflow-hidden selection:bg-[hsl(var(--secondary))] selection:text-white font-sans">
      
      {/* ─── FOND ARCHITECTURAL ET GRILLE SYSTEM ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        {/* Grille de lignes fines façon plan d'architecte */}
        <div 
          className="h-full w-full" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      {/* Halo Lumineux Rouge Corporate (Accent 30%) */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[hsl(var(--secondary))] opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-[hsl(var(--primary))] opacity-25 blur-[140px] pointer-events-none" />

      {/* ─── HEADER / BRANDING BANNER ──────────────────────────────────────── */}
      <header className="relative z-10 w-full border-b border-[hsl(var(--muted))] px-6 lg:px-12 py-5 flex items-center justify-between bg-[hsl(var(--background))/80] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[hsl(var(--secondary))]" /> {/* Carré architectural rouge */}
          <span className="font-extrabold tracking-widest text-sm uppercase text-white">
            MACOF <span className="text-[hsl(var(--muted-foreground))] font-light">| PLATAFORME CORPORATE</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] tracking-wider uppercase font-mono">
          <ShieldAlert className="w-4 h-4 text-[hsl(var(--secondary))]" />
          <span>Erreur d'aiguillage : 404</span>
        </div>
      </header>

      {/* ─── CORPS PRINCIPAL DE LA PAGE ───────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-6xl mx-auto w-full">
        
        {/* Section 404 Massif & Dynamic */}
        <div className="relative mb-6 text-center">
          {/* Tag de statut haut de gamme */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[hsl(var(--secondary))/20] border border-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] text-xs uppercase tracking-widest font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--secondary))] animate-pulse" />
            Ressource Hors Périmètre
          </div>

          <h1 className="text-8xl sm:text-[13rem] font-black tracking-tighter leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600">
            404
          </h1>

          {/* Surlignage architectural rouge central */}
          <div className="w-24 h-1.5 bg-[hsl(var(--secondary))] mx-auto mt-2 mb-6" />
        </div>

        {/* Message d'erreur et explications */}
        <div className="text-center max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            La page recherchée est introuvable ou a été déplacée.
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm sm:text-base leading-relaxed">
            L'URL que vous tentez d'atteindre n'existe pas ou vous ne disposez pas des privilèges d'accès requis au sein du portail d'administration.
          </p>
        </div>

        {/* Boutons d'action principaux (Angles droits 0rem) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 border border-[hsl(var(--border))/30] bg-[hsl(var(--card))] text-white font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-[hsl(var(--muted))] hover:border-white focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            Retour
          </button>

          <a
            href="/"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 bg-[hsl(var(--secondary))] text-white font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-red-700 shadow-lg shadow-[hsl(var(--secondary))/20] focus:outline-none"
          >
            <Home className="w-4 h-4" />
            Accueil Général
          </a>
        </div>

        {/* ─── ACCÈS RAPIDES DE SECOURS (Cards Corporate) ──────────────────── */}
        <div className="mt-16 w-full pt-12 border-t border-[hsl(var(--muted))]">
          <p className="text-xs font-mono uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center mb-6">
            Raccourcis de navigation recommandés
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/filiales"
              className="group p-5 bg-[hsl(var(--card))] border border-transparent hover:border-[hsl(var(--primary))] transition-all duration-300 flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                <Building2 className="w-5 h-5" />
                <span className="text-[10px] font-mono">01</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform duration-200">
                  Filiales & Pôles
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Gestion des entités du groupe</p>
              </div>
            </a>

            <a
              href="/admin/catalogues"
              className="group p-5 bg-[hsl(var(--card))] border border-transparent hover:border-[hsl(var(--primary))] transition-all duration-300 flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-mono">02</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform duration-200">
                  Catalogues
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Documentation technique</p>
              </div>
            </a>

            <a
              href="/admin/demandes"
              className="group p-5 bg-[hsl(var(--card))] border border-transparent hover:border-[hsl(var(--primary))] transition-all duration-300 flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                <Mail className="w-5 h-5" />
                <span className="text-[10px] font-mono">03</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform duration-200">
                  Demandes Contact
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Traiter les formulaires reçus</p>
              </div>
            </a>

            <a
              href="/admin/dashboard"
              className="group p-5 bg-[hsl(var(--card))] border border-transparent hover:border-[hsl(var(--secondary))] transition-all duration-300 flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--secondary))] transition-colors">
                <Compass className="w-5 h-5" />
                <span className="text-[10px] font-mono">04</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform duration-200">
                  Tableau de bord
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Vue d'ensemble système</p>
              </div>
            </a>
          </div>
        </div>

      </main>

      {/* ─── FOOTER DISCRET ────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-[hsl(var(--muted))] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[hsl(var(--muted-foreground))] gap-2">
        <p>© {new Date().getFullYear()} MACOF Group. Tous droits réservés.</p>
        <div className="flex items-center gap-4 font-mono">
          <span>SYS_STATUS: ACTIVE</span>
          <span>•</span>
          <span>HTTP_404_NOT_FOUND</span>
        </div>
      </footer>

    </div>
  );
}