import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles =
    variant === 'danger'
      ? { icon: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20', button: 'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)] hover:brightness-110 focus-visible:ring-red-400/40' }
      : { icon: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20', button: 'bg-gradient-to-r from-amber-500 to-amber-400 text-[#1a1405] shadow-[0_8px_24px_-8px_rgba(245,158,11,0.5)] hover:brightness-105 focus-visible:ring-amber-400/40' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="relative px-7 pt-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl p-3 ${variantStyles.icon}`}>
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-slate-200"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <p className="px-7 pb-7 pt-5 text-sm leading-relaxed text-slate-300">{message}</p>

        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="flex items-center justify-end gap-3 px-7 py-5">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220] ${variantStyles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
