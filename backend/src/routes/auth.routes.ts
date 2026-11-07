import { Hono, type Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { administrateurs } from "../db/schema";
import { compare } from "bcryptjs";
import { generateToken, verifyToken } from "../services/jwt";
import { success, error } from "../utils/response";
import { loginSchema } from "../utils/validation";

const DUMMY_HASH = "$2a$10$C6UzMDM.H6dfI/f/IKcEeO7ZBpUvHzGE9zSnzWn0eUu1ABsQlCJ7O";
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0] ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (entry.resetAt <= now) loginAttempts.delete(key);
  }
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_RATE_LIMIT_MAX;
}

const authRoutes = new Hono();

// Helper de validation sécurisé
function getValidationError(err: unknown): string {
  if (err && typeof err === "object" && "issues" in err) {
    const issues = (err as { issues: Array<{ message: string }> }).issues;
    return issues[0]?.message || "Données invalides";
  }
  if (err instanceof Error) return err.message;
  return "Données invalides";
}

// POST /api/auth/login
authRoutes.post("/login", async (c) => {
  const ip = getClientIp(c);
  if (isLoginRateLimited(ip)) {
    return error(c, "Trop de tentatives, reessayez plus tard", 429);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return error(c, "Corps de la requête invalide ou JSON corrompu", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return error(c, getValidationError(parsed.error), 422);
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [admin] = await db
    .select()
    .from(administrateurs)
    .where(eq(administrateurs.email, normalizedEmail))
    .limit(1);

  if (!admin) {
    await compare(password, DUMMY_HASH);
    return error(c, "Email ou mot de passe incorrect", 401);
  }

  if (admin.archived) {
    await compare(password, DUMMY_HASH);
    return error(c, "Email ou mot de passe incorrect", 401);
  }

  const isValid = await compare(password, admin.password_hash);
  if (!isValid) {
    return error(c, "Email ou mot de passe incorrect", 401);
  }

  const token = await generateToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    nom: admin.nom,
    filialeAttribuee: admin.filiale_attribuee,
  });

  return success(
    c,
    {
      token,
      user: {
        id: admin.id,
        nom: admin.nom,
        email: admin.email,
        avatar_url: admin.avatar_url,
        role: admin.role,
        filiale_attribuee: admin.filiale_attribuee,
      },
    },
    "Connexion réussie",
  );
});

// GET /api/auth/me
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(c, "Token manquant", 401);
  }

  const token = authHeader.substring(7);

  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Token invalide ou expiré";
    return error(c, message, 401);
  }

  // Sélection explicite des champs (exclut le password_hash)
  const [admin] = await db
    .select({
      id: administrateurs.id,
      nom: administrateurs.nom,
      email: administrateurs.email,
      role: administrateurs.role,
      avatar_url: administrateurs.avatar_url,
      filiale_attribuee: administrateurs.filiale_attribuee,
      archived: administrateurs.archived,
    })
    .from(administrateurs)
    .where(eq(administrateurs.id, payload.sub))
    .limit(1);

  if (!admin) {
    return error(c, "Utilisateur non trouvé", 404);
  }

  // Vérification de sécurité : bloquer immédiatement les comptes archivés
  if (admin.archived) {
    return error(c, "Compte désactivé. Contactez l'administrateur.", 403);
  }

  const { archived, ...userData } = admin;

  return success(c, userData);
});

export default authRoutes;
