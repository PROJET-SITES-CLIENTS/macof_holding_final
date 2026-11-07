import dotenv from 'dotenv/config';

import type { Context, Next } from "hono";
import { cors } from "hono/cors";

const ALLOWED_ORIGINS: string[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://macof-holding.com",
  "https://www.macof-holding.com",
  "https://macof-holding-frontend.vercel.app",
  "https://macof-holding-frontend-git-main-travaileinsof-1730s-projects.vercel.app",
];

// Toute URL de prévisualisation/production Vercel du frontend, quel que soit
// le compte ou le suffixe (macof-holding-frontend, -abc123, -git-main-…)
const FRONTEND_VERCEL_PATTERN = /^https:\/\/macof-holding-frontend(-[\w-]+)?\.vercel\.app$/;

export const corsMiddleware = () => {
  return cors({
    origin: (origin: string | undefined, c: Context) => {
      if (!origin) return "*";

      if (process.env.NODE_ENV === "development") {
        return origin;
      }

      if (ALLOWED_ORIGINS.includes(origin) || FRONTEND_VERCEL_PATTERN.test(origin)) {
        return origin;
      }

      return ALLOWED_ORIGINS[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400,
    credentials: true,
  });
};
