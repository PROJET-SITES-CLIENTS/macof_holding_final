import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 30_000;

/**
 * Synchronise le cache React Query avec le serveur via un polling régulier.
 * (Remplace l'ancien système SSE, incompatible avec l'hébergement serverless :
 * events stockés en mémoire par instance + fonctions tuées après ~60s.)
 *
 * - Invalide le cache toutes les 30 secondes UNIQUEMENT quand l'onglet est
 *   visible (pas de trafic réseau ni de batterie gaspillés en arrière-plan).
 * - Invalide immédiatement dès que la page redevient visible.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries();
      }
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);
}
