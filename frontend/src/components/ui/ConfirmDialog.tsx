import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* En-tête avec accent doré */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#cda434]/[0.08] via-transparent to-transparent" />
          <div className="relative flex items-start gap-4 px-7 py-6">
            <div
              className={`flex-shrink-0 rounded-2xl p-3 ${
                isDangerous
                  ? 'bg-red-500/10 ring-1 ring-red-500/20'
                  : 'bg-[#cda434]/10 ring-1 ring-[#cda434]/20'
              }`}
            >
              {icon || (
                <AlertCircle
                  className={`h-6 w-6 ${isDangerous ? 'text-red-400' : 'text-[#cda434]'}`}
                />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-300 hover:bg-white/[0.06] hover:text-slate-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Message */}
        <div className="px-7 py-6">
          <p className="text-sm leading-relaxed text-slate-300">{message}</p>
        </div>

        {/* Séparateur */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-7 py-5">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda434]/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220] disabled:cursor-not-allowed disabled:opacity-50 ${
              isDangerous
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)] hover:brightness-110 focus-visible:ring-red-400/40'
                : 'bg-gradient-to-r from-[#cda434] to-[#e0b83d] text-[#1a1405] shadow-[0_8px_24px_-8px_rgba(205,164,52,0.55)] hover:brightness-105 focus-visible:ring-[#cda434]/40'
            }`}
          >
            {isLoading ? 'Chargement…' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
