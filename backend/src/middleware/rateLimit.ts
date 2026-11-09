import type { Context, Next } from 'hono';
import { error } from '../utils/response';

/**
 * Rate limiter simple en mémoire (par IP + clé de contexte).
 * Suffisant pour bloquer le spam de masse sur les endpoints publics ;
 * sur serverless chaque instance a son compteur (best-effort).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Nettoyage périodique pour éviter la croissance infinie de la Map
const MAX_BUCKETS = 50_000;

function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return c.req.header('x-real-ip') || 'unknown';
}

export function rateLimit(options: { key: string; limit: number; windowMs: number }) {
  const { key, limit, windowMs } = options;

  return async (c: Context, next: Next) => {
    const bucketKey = `${key}:${clientIp(c)}`;
    const now = Date.now();

    let bucket = buckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      if (buckets.size > MAX_BUCKETS) buckets.clear();
      buckets.set(bucketKey, bucket);
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfterSec));
      return error(c, 'Trop de requetes, reessayez plus tard', 429);
    }

    await next();
  };
}
