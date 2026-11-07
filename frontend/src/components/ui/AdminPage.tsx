import React from 'react';
import { Loader2 } from 'lucide-react';
/**
 * AdminPage — Wrapper stable avec blocage d'interactions et hauteur minimale garantie.
 */
export function AdminPage({
  loading,
  children,
  className = '',
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative min-h-[200px] ${className}`}>
      {loading && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#0b1220]/70 backdrop-blur-[2px] pointer-events-auto select-none"
          aria-busy="true"
        >
          <span className="relative flex h-12 w-12 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#cda434]/10" />
            <Loader2 className="h-8 w-8 animate-spin text-[#cda434]" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Chargement en cours…
          </p>
        </div>
      )}

      {/* Empêche les clics et le focus clavier sous l'overlay pendant le chargement */}
      <div
        className={loading ? 'pointer-events-none select-none' : undefined}
        aria-hidden={loading || undefined}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * SaveButton — Bouton à structure DOM 100% fixe (icône + libellé).
 */
export function SaveButton({
  saving,
  onClick,
  label = 'Enregistrer',
  savingLabel = 'Enregistrement…',
  disabled,
  className = '',
  Icon,
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
  savingLabel?: string;
  disabled?: boolean;
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled ?? saving}
      className={`inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-5 py-2.5 text-sm font-semibold text-[#1a1405] shadow-[0_8px_24px_-8px_rgba(205,164,52,0.55)] transition-all duration-300 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${className}`}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        {Icon && (
          <Icon
            className={`h-4 w-4 absolute transition-opacity duration-150 ${
              saving ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
        <Loader2
          className={`h-4 w-4 absolute animate-spin transition-opacity duration-150 ${
            saving ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </span>
      <span>{saving ? savingLabel : label}</span>
    </button>
  );
}
