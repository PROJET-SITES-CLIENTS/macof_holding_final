import type { Context, Next } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { eq } from 'drizzle-orm';
import { verifyToken, type TokenPayload } from '../services/jwt';
import { db } from '../db/client';
import { administrateurs } from '../db/schema';
import { error } from '../utils/response';

export interface AuthUser extends TokenPayload {}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(c, 'Token d\'authentification manquant', 401);
  }

  const token = authHeader.substring(7);

  // Only wrap token verification: downstream handler errors must NOT
  // be swallowed and reported as 401.
  try {
    const payload = await verifyToken(token);

    // Re-vérification en base : un compte archivé ou supprimé perd
    // immédiatement l'accès, et le rôle réel (mis à jour par un admin)
    // prime sur celui embarqué dans le JWT encore valide.
    const [account] = await db
      .select({ id: administrateurs.id, role: administrateurs.role, archived: administrateurs.archived })
      .from(administrateurs)
      .where(eq(administrateurs.id, payload.sub))
      .limit(1);

    if (!account) {
      return error(c, 'Compte introuvable', 401);
    }
    if (account.archived) {
      return error(c, 'Compte archive', 401);
    }

    c.set('user', { ...payload, role: account.role } as AuthUser);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token invalide ou expire';
    return error(c, message, 401);
  }

  await next();
};

export const requireRole = (...roles: string[]): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined;

    if (!user?.role || !roles.includes(user.role)) {
      return error(c, 'Acces refuse', 403);
    }

    await next();
  };
};
