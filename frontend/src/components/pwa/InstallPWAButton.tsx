import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share, Smartphone, BellRing, BellOff, CheckCircle2 } from 'lucide-react';
import { RAW_BASE_URL } from '@/lib/api';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'macof-pwa-dismissed';
const PUSH_DISMISS_KEY = 'macof-push-dismissed';

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

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * InstallPWAButton — Invitations flottantes :
 *  1. Installer le site comme application mobile (beforeinstallprompt / iOS)
 *  2. Activer les notifications push (publicités, offres)
 */
export function InstallPWAButton() {
  // ── Phase 1 : installation de l'application ──
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  // ── Phase 2 : notifications push ──
  const [showPush, setShowPush] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'subscribing' | 'done' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(() => {
    try {
      return localStorage.getItem(PUSH_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const notificationsSupported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const pushAlreadyGranted = typeof window !== 'undefined' && window.Notification?.permission === 'granted';

  useEffect(() => {
    if (isStandalone() || installDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.setTimeout(() => setShowInstall(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);

    let timer = 0;
    if (isIOS()) {
      timer = window.setTimeout(() => setShowInstall(true), 2500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.clearTimeout(timer);
    };
  }, [installDismissed]);

  // Quand la carte installation est fermée (dismiss, install, ou déjà standalone),
  // on propose les notifications si elles ne sont pas encore activées.
  useEffect(() => {
    if (showInstall || pushDismissed || !notificationsSupported) return;
    if (pushAlreadyGranted) return;
    // iOS : les notifications ne fonctionnent que dans l'app installée
    if (isIOS() && !isStandalone()) return;
    const timer = window.setTimeout(() => setShowPush(true), 2500);
    return () => window.clearTimeout(timer);
  }, [showInstall, pushDismissed, notificationsSupported, pushAlreadyGranted]);

  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    setInstallDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const dismissPush = useCallback(() => {
    setShowPush(false);
    setPushDismissed(true);
    try {
      localStorage.setItem(PUSH_DISMISS_KEY, '1');
    } catch {
      /* stockage indisponible */
    }
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSHint(true);
    }
  }, [deferredPrompt]);

  const closeIOSHint = () => {
    setShowIOSHint(false);
    dismissInstall();
  };

  const enablePush = useCallback(async () => {
    setPushState('subscribing');
    setPushMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState('error');
        setPushMessage('Autorisation refusée. Vous pourrez l’activer depuis les réglages du navigateur.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const keyResponse = await fetch(`${RAW_BASE_URL}/push/vapid-key`);
      const keyData = await keyResponse.json();
      const publicKey = keyData?.data?.publicKey as string | undefined;
      if (!publicKey) throw new Error('clé VAPID indisponible');

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(publicKey),
        }));

      const response = await fetch(`${RAW_BASE_URL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error('enregistrement impossible');

      setPushState('done');
      window.setTimeout(() => setShowPush(false), 1800);
    } catch (err) {
      console.error('[push] Activation échouée:', err);
      setPushState('error');
      setPushMessage('Activation impossible pour le moment. Réessayez plus tard.');
    }
  }, []);

  const bellIcon =
    pushState === 'done' ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    ) : pushState === 'error' ? (
      <BellOff className="h-5 w-5 text-red-400" />
    ) : (
      <BellRing className={`h-5 w-5 text-[#e0b83d] ${pushState === 'subscribing' ? 'animate-pulse' : ''}`} />
    );

  return (
    <>
      {showInstall && (
        <div
          role="dialog"
          aria-label="Installer l'application MACOF"
          className="fixed bottom-5 left-1/2 z-[70] w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0"
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
              onClick={dismissInstall}
              aria-label="Fermer"
              className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showPush && (
        <div
          role="dialog"
          aria-label="Activer les notifications MACOF"
          className="fixed bottom-5 left-1/2 z-[70] w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-6 sm:translate-x-0"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-[#cda434]/25 bg-[#101a2e]/95 p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#cda434]/25 to-[#cda434]/5 ring-1 ring-[#cda434]/25">
              {bellIcon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">
                {pushState === 'done' ? 'Notifications activées' : 'Recevez nos offres'}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">
                {pushState === 'done'
                  ? 'Vous serez alerté des promotions et nouveautés MACOF.'
                  : pushMessage ??
                    'Promotions exclusives, nouveaux plats et annonces : soyez averti en premier.'}
              </p>
            </div>
            {pushState !== 'done' && (
              <button
                onClick={enablePush}
                disabled={pushState === 'subscribing'}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-3.5 py-2 text-xs font-semibold text-[#1a1405] transition-all hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pushState === 'subscribing' ? '…' : 'Activer'}
              </button>
            )}
            <button
              onClick={pushState === 'done' ? () => setShowPush(false) : dismissPush}
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
            <p className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-slate-400">
              Une fois l'application installée, ouvrez-la depuis l'écran d'accueil pour pouvoir
              activer les notifications de nos offres.
            </p>
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
