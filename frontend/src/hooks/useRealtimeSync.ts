import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const POLL_INTERVAL_MS = 30_000;

/**
 * Synchronise le cache React Query avec le serveur via un polling régulier.
 * (Remplace l'ancien système SSE, incompatible avec l'hébergement serverless :
 * events stockés en mémoire par instance + fonctions tuées après ~60s.)
 *
 * - Invalide tout le cache toutes les 30 secondes (simple et robuste).
 * - Invalide immédiatement dès que la page redevient visible.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('[Realtime Sync] Polling active');

    const interval = setInterval(() => {
      queryClient.invalidateQueries();
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
      console.log('[Realtime Sync] Polling stopped');
    };
  }, [queryClient]);
}
