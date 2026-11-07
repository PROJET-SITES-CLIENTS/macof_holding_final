import type { Context, Next } from 'hono';
import { error } from '../utils/response';

const MAX_BODY_SIZE_BYTES = 12 * 1024 * 1024; // 12 Mo

export const bodyLimitMiddleware = async (c: Context, next: Next) => {
  const contentLength = c.req.header('content-length');

  if (contentLength) {
    const size = Number(contentLength);

    if (!Number.isNaN(size) && size > MAX_BODY_SIZE_BYTES) {
      return error(c, 'Corps de requete trop volumineux', 413);
    }
  }

  await next();
};
