import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'macof-pwa-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * InstallPWAButton — Bouton flottant discret proposant l'installation
 * du site comme application mobile (Android/Chrome via beforeinstallprompt,
 * iOS via instructions natives "Ajouter à l'écran d'accueil").
 */
export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Petit délai pour ne pas interrompre la découverte du site
      window.setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS : pas d'événement beforeinstallprompt, on propose les instructions
    if (isIOS()) {
      const t = window.setTimeout(() => setVisible(true), 2500);
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSHint(true);
    }
  }, [deferredPrompt]);

  const closeIOSHint = () => {
    setShowIOSHint(false);
    dismiss();
  };

  if (!visible && !showIOSHint) return null;

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Installer l'application MACOF"
          className="fixed bottom-5 left-1/2 z-[70] w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[#cda434]/25 bg-[#101a2e]/95 p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#cda434]/25 to-[#cda434]/5 ring-1 ring-[#cda434]/25">
              <Smartphone className="h-5 w-5 text-[#e0b83d]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">Installer l'application</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">
                Accédez à MACOF Holding en un tap, même avec une connexion faible.
              </p>
            </div>
            <button
              onClick={install}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-3.5 py-2 text-xs font-semibold text-[#1a1405] transition-all hover:brightness-105 active:scale-[0.97]"
            >
              <Download className="h-3.5 w-3.5" />
              Installer
            </button>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showIOSHint && (
        <div
          role="dialog"
          aria-label="Installation sur iPhone"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeIOSHint}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#101a2e] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#cda434]/15 ring-1 ring-[#cda434]/30">
              <Share className="h-5 w-5 text-[#e0b83d]" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-100">
              Installer sur votre appareil
            </h3>
            <ol className="mt-4 space-y-3 text-left text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[#e0b83d]">1</span>
                Appuyez sur le bouton <strong>Partager</strong> <Share className="inline h-3.5 w-3.5 text-[#e0b83d]" /> de Safari
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[#e0b83d]">2</span>
                Faites défiler puis choisissez <strong>« Sur l'écran d'accueil »</strong>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[#e0b83d]">3</span>
                Appuyez sur <strong>« Ajouter »</strong> pour installer l'application
              </li>
            </ol>
            <button
              onClick={closeIOSHint}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-4 py-2.5 text-sm font-semibold text-[#1a1405] transition-all hover:brightness-105 active:scale-[0.98]"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
