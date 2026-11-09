import { Hono } from "hono";
import { type ZodError } from "zod";
import { eq, count, desc, sql, and, asc, getTableColumns } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { db } from "../../db/client";
import { administrateurs, catalogues, demandes_contact, filiales, galerie, page_contents, settings } from "../../db/schema";
import { deleteFile, uploadFile } from "../../services/upload";
import { authMiddleware, requireRole } from "../../middleware/auth";
import {
  adminCatalogueSchema,
  adminCreateSchema,
  adminEditSchema,
  adminFilialeSchema,
  adminGalerieSchema,
  demandeStatutSchema,
  pageContentUpdateSchema,
} from "../../utils/validation";
import { eventEmitter } from "../../services/events";


// Helpers pour les reponses standardisees
const success = (c: any, data: any, message = "Succes", status = 200) => {
  return c.json({ success: true, message, data }, status);
};

const error = (c: any, message = "Erreur", status = 400) => {
  return c.json({ success: false, message }, status);
};

const zodFirstMessage = (zodError: ZodError) => {
  const issue = zodError.issues[0];
  return issue?.code === "unrecognized_keys" ? "Champ non autorise" : issue?.message || "Donnees invalides";
};

// ─── 1. Dashboard Router ────────────────────────────────────────────────────
export const adminDashboard = new Hono();

async function safeCount(table: any, label: string) {
  try {
    const [row] = await db.select({ value: count() }).from(table);
    return Number(row?.value ?? 0);
  } catch (error) {
    console.error(`[dashboard-stats] Impossible de compter ${label}:`, error);
    return 0;
  }
}

// Compte les filiales non archivees (coherent avec la liste admin filiale)
async function safeCountFiliales() {
  try {
    const [row] = await db
      .select({ value: count() })
      .from(filiales)
      .where(and(eq(filiales.archived, false)));
    return Number(row?.value ?? 0);
  } catch (error) {
    console.error("[dashboard-stats] Impossible de compter filiales:", error);
    return 0;
  }
}

// Compte genrique avec condition
async function safeCountWhere(table: any, label: string, condition: any) {
  try {
    const [row] = await db.select({ value: count() }).from(table).where(condition);
    return Number(row?.value ?? 0);
  } catch (error) {
    console.error(`[dashboard-stats] Impossible de compter ${label}:`, error);
    return 0;
  }
}

// Commandes de restauration en attente de traitement (badge sidebar)
async function safeCountCommandesNouvelles() {
  try {
    const { commandes } = await import("../../db/schema");
    const [row] = await db
      .select({ value: count() })
      .from(commandes)
      .where(eq(commandes.statut, "en_attente"));
    return Number(row?.value ?? 0);
  } catch (error) {
    console.error("[dashboard-stats] Impossible de compter commandes nouvelles:", error);
    return 0;
  }
}

adminDashboard.get("/", async (c) => {
  const [demandes, filialesCount, galerieCount, cataloguesCount, nouvellesDemandes, nouvellesCommandes, demandesTraitees] = await Promise.all([
    safeCount(demandes_contact, "demandes_contact"),
    safeCountFiliales(),
    safeCount(galerie, "galerie"),
    safeCount(catalogues, "catalogues"),
    safeCountWhere(demandes_contact, "demandes nouvelles", eq(demandes_contact.statut, "nouveau")),
    safeCountCommandesNouvelles(),
    // KPI calculé sur l'intégralité de la table (le front est plafonné à 100 lignes)
    safeCountWhere(demandes_contact, "demandes traitees", eq(demandes_contact.statut, "traite")),
  ]);

  return success(c, {
    demandes: demandes,
    total_demandes: demandes,
    filiales: filialesCount,
    galerie: galerieCount,
    catalogues: cataloguesCount,
    nouvelles_demandes: nouvellesDemandes,
    nouvelles_commandes: nouvellesCommandes,
    total_traitees: demandesTraitees,
  });
});

// ─── 2. Demandes de Contact Router ──────────────────────────────────────────
export const adminDemandes = new Hono();

adminDemandes.get("/", async (c) => {
  const limitParam = parseInt(c.req.query("limit") || "0", 10);
  const limit = limitParam > 0 ? Math.min(limitParam, 500) : undefined;

  const baseQuery = db
    .select({
      ...getTableColumns(demandes_contact),
      filiale_nom: filiales.nom,
    })
    .from(demandes_contact)
    .leftJoin(filiales, eq(demandes_contact.filiale, filiales.id))
    .orderBy(desc(demandes_contact.created_at));

  const list = limit ? await baseQuery.limit(limit) : await baseQuery;

  return success(c, list);
});

adminDemandes.put("/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const parsed = demandeStatutSchema.safeParse(await c.req.json());

  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const updated = await db
    .update(demandes_contact)
    .set({
      statut: parsed.data.status,
      updated_at: new Date(),
    })
    .where(eq(demandes_contact.id, id))
    .returning();

  if (!updated.length) return error(c, "Demande introuvable", 404);
  return success(c, updated[0], "Statut mis a jour");
});

// ─── 3. Filiales Router ─────────────────────────────────────────────────────
export const adminFiliales = new Hono();

adminFiliales.get("/", async (c) => {
  const list = await db.select().from(filiales).where(eq(filiales.archived, false));
  return success(c, list);
});

// Convertit le champ "details" (lignes separees par \n) en details_json ({ items: [...] })
function parseFilialeDetails(body: any) {
  if (body.details === undefined) return;
  const detailsStr = typeof body.details === "string" ? body.details : "";
  const items = detailsStr
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
  body.details_json = items.length > 0 ? { items } : null;
  delete body.details;
}

adminFiliales.post("/", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let body: any;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const image = form.image instanceof File ? form.image : undefined;
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "image"));

    if (image) {
      body.image_url = await uploadFile(image, "filiales");
    }
  } else {
    body = await c.req.json();
  }

  parseFilialeDetails(body);

  const parsed = adminFilialeSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const created = await db.insert(filiales).values(parsed.data as any).returning();
  eventEmitter.emit("invalidate", { entity: "filiales" });
  return success(c, created[0], "Filiale creee", 201);
});

adminFiliales.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const contentType = c.req.header("content-type") || "";
  let body: any;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const image = form.image instanceof File ? form.image : undefined;
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "image"));

    if (image) {
      body.image_url = await uploadFile(image, "filiales");
    }
  } else {
    body = await c.req.json();
  }

  const [existing] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!existing) return error(c, "Filiale introuvable", 404);

  parseFilialeDetails(body);

  const parsed = adminFilialeSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const updatePayload: any = {
    ...parsed.data,
    updated_at: new Date(),
  };

  if (parsed.data.image_url === undefined && existing.image_url) {
    updatePayload.image_url = existing.image_url;
  }

  const updated = await db
    .update(filiales)
    .set(updatePayload)
    .where(eq(filiales.id, id))
    .returning();

  if (!updated.length) return error(c, "Filiale introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "filiales" });
  return success(c, updated[0], "Filiale mise a jour");
});

adminFiliales.delete("/:id", requireRole("admin"), async (c) => {
  const id = Number(c.req.param("id"));

  const updated = await db
    .update(filiales)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(filiales.id, id))
    .returning();

  if (!updated.length) return error(c, "Filiale introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "filiales" });
  return success(c, null, "Filiale archivee");
});

// ─── 4. Galerie Router ──────────────────────────────────────────────────────
export const adminGalerie = new Hono();

adminGalerie.get("/", async (c) => {
  const items = await db
    .select({ ...getTableColumns(galerie), filiale_nom: filiales.nom })
    .from(galerie)
    .leftJoin(filiales, eq(galerie.filiale, filiales.id));
  return success(c, items);
});

adminGalerie.post("/", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let body: any;
  let image: File | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "image"));
    image = form.image instanceof File ? form.image : undefined;
    if (image) body.image_path = await uploadFile(image, "galerie");
  } else {
    body = await c.req.json();
  }

  if (!body.image_path) return error(c, "Une image est requise", 400);
  if (body.filiale !== undefined && body.filiale !== "") body.filiale = Number(body.filiale);
  else delete body.filiale;

  const parsed = adminGalerieSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const item = await db.insert(galerie).values(parsed.data as any).returning();
  eventEmitter.emit("invalidate", { entity: "galerie" });
  return success(c, item[0], "Image ajoutee", 201);
});

adminGalerie.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return error(c, "ID invalide", 400);

  const contentType = c.req.header("content-type") || "";
  let body: any;
  let image: File | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "image"));
    image = form.image instanceof File ? form.image : undefined;
    if (image) body.image_path = await uploadFile(image, "galerie");
  } else {
    body = await c.req.json();
  }

  if (body.filiale !== undefined && body.filiale !== "") body.filiale = Number(body.filiale);
  else delete body.filiale;

  const parsed = adminGalerieSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const [updated] = await db
    .update(galerie)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(galerie.id, id))
    .returning();

  if (!updated) return error(c, "Element de galerie introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "galerie" });
  return success(c, updated, "Realisation mise a jour");
});

adminGalerie.delete("/:id", requireRole("admin"), async (c) => {
  const id = Number(c.req.param("id"));

  const [item] = await db.select().from(galerie).where(eq(galerie.id, id));

  if (item?.image_path) {
    await deleteFile(item.image_path).catch(() => {});
  }

  await db.delete(galerie).where(eq(galerie.id, id));
  eventEmitter.emit("invalidate", { entity: "galerie" });
  return success(c, null, "Element supprime de la galerie");
});

// ─── 5. Catalogues Router ───────────────────────────────────────────────────
export const adminCatalogues = new Hono();

adminCatalogues.get("/", async (c) => {
  const items = await db
    .select({ ...getTableColumns(catalogues), filiale_nom: filiales.nom })
    .from(catalogues)
    .leftJoin(filiales, eq(catalogues.filiale, filiales.id));
  return success(c, items);
});

adminCatalogues.post("/", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let body: any;
  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const file = form.file instanceof File ? form.file : undefined;
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "file"));
    if (file) {
      body.file_path = await uploadFile(file, "catalogues");
      body.format = file.name.split(".").pop()?.toLowerCase() || "pdf";
      body.taille_ko = Math.max(1, Math.ceil(file.size / 1024));
    }
  } else {
    body = await c.req.json();
  }
  if (!body.file_path) return error(c, "Un fichier est requis", 400);
  if (body.filiale !== undefined && body.filiale !== "") body.filiale = Number(body.filiale);
  else delete body.filiale;

  const parsed = adminCatalogueSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const { description: _description, ...catalogueData } = parsed.data;
  const created = await db.insert(catalogues).values(catalogueData as any).returning();
  eventEmitter.emit("invalidate", { entity: "catalogues" });
  return success(c, created[0], "Catalogue cree", 201);
});

adminCatalogues.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const contentType = c.req.header("content-type") || "";
  let body: any;
  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const file = form.file instanceof File ? form.file : undefined;
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "file"));
    if (file) {
      body.file_path = await uploadFile(file, "catalogues");
      body.format = file.name.split(".").pop()?.toLowerCase() || "pdf";
      body.taille_ko = Math.max(1, Math.ceil(file.size / 1024));
    }
  } else {
    body = await c.req.json();
  }
  if (body.filiale !== undefined && body.filiale !== "") body.filiale = Number(body.filiale);
  else delete body.filiale;

  const parsed = adminCatalogueSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const { description: _description, ...catalogueData } = parsed.data;

  const updated = await db
    .update(catalogues)
    .set({
      ...catalogueData,
      updated_at: new Date(),
    })
    .where(eq(catalogues.id, id))
    .returning();

  if (!updated.length) return error(c, "Catalogue introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "catalogues" });
  return success(c, updated[0], "Catalogue mis a jour");
});

adminCatalogues.delete("/:id", requireRole("admin"), async (c) => {
  const id = Number(c.req.param("id"));

  const [item] = await db
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, id));

  if (item?.file_path) {
    await deleteFile(item.file_path).catch(() => {});
  }

  await db.delete(catalogues).where(eq(catalogues.id, id));
  eventEmitter.emit("invalidate", { entity: "catalogues" });
  return success(c, null, "Catalogue supprime");
});

// ─── 6. CMS Page Contents Router ───────────────────────────────────────────
export const adminPages = new Hono();

adminPages.get("/", async (c) => {
  const list = await db.select().from(page_contents);
  return success(c, list);
});

adminPages.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const list = await db
    .select()
    .from(page_contents)
    .where(eq(page_contents.page_slug, slug));

  // Retourner la même structure que l'endpoint public `/api/v1/pages/:slug`
  const sections = list.map((row: any) => ({
    key: row.section_key,
    type: row.content_type || "text",
    value: row.content_value || "",
    image_url: row.content_type === "image" ? row.content_value : undefined,
  }));

  return success(c, {
    slug,
    sections,
  });
});

adminPages.post("/bulk", async (c) => {
  const body = await c.req.json();
  const pageSlug = body?.page_slug;
  const contents = Array.isArray(body?.contents) ? body.contents : [];

  if (!pageSlug || contents.length === 0) {
    return error(c, "Données de page invalides", 400);
  }

  const filteredContents = contents
    .filter((item: any) => item && item.section_key && item.content_value !== undefined)
    .map((item: any) => ({
      page_slug: String(pageSlug),
      section_key: String(item.section_key),
      content_value: String(item.content_value),
      content_type: item.content_type ? String(item.content_type) : "text",
      updated_at: new Date(),
    }));

  if (filteredContents.length === 0) {
    return error(c, "Aucun contenu de page valide fourni", 400);
  }

  try {
    await db
      .insert(page_contents)
      .values(filteredContents)
      .onConflictDoUpdate({
        target: [page_contents.page_slug, page_contents.section_key],
        set: {
          content_value: sql`EXCLUDED.content_value`,
          content_type: sql`EXCLUDED.content_type`,
          updated_at: sql`CURRENT_TIMESTAMP`,
        },
      });

    eventEmitter.emit("invalidate", { entity: "pages" });
    return success(c, { updated: filteredContents.length }, "Contenu de page mis à jour avec succès");
  } catch (err) {
    console.error("Erreur admin/pages/bulk:", err);
    return error(c, "Impossible de sauvegarder le contenu de page", 500);
  }
});

adminPages.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const parsed = pageContentUpdateSchema.safeParse(await c.req.json());

  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const updated = await db
    .update(page_contents)
    .set({
      content_value: parsed.data.content_value,
      ...(parsed.data.content_type !== undefined ? { content_type: parsed.data.content_type } : {}),
      updated_at: new Date(),
    })
    .where(eq(page_contents.id, id))
    .returning();

  if (!updated.length) return error(c, "Section introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "pages" });
  return success(c, updated[0], "Contenu de page mis a jour");
});

// ─── 7. Settings Router ─────────────────────────────────────────────────────
export const adminSettings = new Hono();
adminSettings.use("*", requireRole("admin"));

adminSettings.get("/", async (c) => {
  const list = await db.select().from(settings);

  const map: Record<string, string | boolean> = {};
  for (const row of list) {
    if (row.key.startsWith("smtp_password")) {
      map.smtp_password_set = true;
      continue;
    }
    map[row.key] = row.value ?? "";
  }

  return success(c, map);
});

adminSettings.put("/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json();

  const updated = await db
    .update(settings)
    .set({
      value,
      updated_at: new Date(),
    })
    .where(eq(settings.key, key))
    .returning();

  if (!updated.length) return error(c, "Parametre introuvable", 404);
  eventEmitter.emit("invalidate", { entity: "settings" });
  return success(c, updated[0], "Parametre mis a jour");
});

// ─── 8. Profile Administrateur Router ───────────────────────────────────────
export const adminProfile = new Hono();

// Colonnes publiques d'un administrateur (jamais password_hash)
const adminPublicColumns = {
  id: administrateurs.id,
  nom: administrateurs.nom,
  email: administrateurs.email,
  avatar_url: administrateurs.avatar_url,
  role: administrateurs.role,
  filiale_attribuee: administrateurs.filiale_attribuee,
  archived: administrateurs.archived,
  created_at: administrateurs.created_at,
};

function getAuthenticatedAdminId(c: any): number | null {
  const user = c.get("user") || c.get("jwtPayload");
  const rawId = user?.sub ?? user?.id;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

adminProfile.get("/", async (c) => {
  const userId = getAuthenticatedAdminId(c);
  if (!userId) return error(c, "Non autorise", 401);

  const [user] = await db
    .select({
      id: administrateurs.id,
      nom: administrateurs.nom,
      email: administrateurs.email,
      avatar_url: administrateurs.avatar_url,
      role: administrateurs.role,
      filiale_attribuee: administrateurs.filiale_attribuee,
      created_at: administrateurs.created_at,
    })
    .from(administrateurs)
    .where(eq(administrateurs.id, userId));

  if (!user) return error(c, "Utilisateur introuvable", 404);
  return success(c, user);
});

adminProfile.put("/", async (c) => {
  const userId = getAuthenticatedAdminId(c);
  if (!userId) return error(c, "Non autorise", 401);

  const body = await c.req.json();

  // On empeche la modification directe du password_hash ici
  delete body.password_hash;

  const updatePayload = {
    avatar_url: body.avatar_url === undefined ? undefined : String(body.avatar_url || ""),
    nom: body.nom === undefined ? undefined : String(body.nom || "").trim(),
    updated_at: new Date(),
  };

  const [updated] = await db
    .update(administrateurs)
    .set(updatePayload)
    .where(eq(administrateurs.id, userId))
    .returning(adminPublicColumns);

  return success(c, updated, "Profil mis a jour");
});

// Changement de mot de passe par l'administrateur connecte
adminProfile.put("/password", async (c) => {
  const userId = getAuthenticatedAdminId(c);
  if (!userId) return error(c, "Non autorise", 401);

  const body = await c.req.json().catch(() => ({}));
  const currentPassword = typeof body?.current_password === "string" ? body.current_password : "";
  const newPassword = typeof body?.new_password === "string" ? body.new_password : "";

  if (!currentPassword || !newPassword) return error(c, "Champs requis", 422);
  if (newPassword.length < 8) {
    return error(c, "Le nouveau mot de passe doit contenir au moins 8 caracteres", 422);
  }

  const [admin] = await db
    .select({ password_hash: administrateurs.password_hash })
    .from(administrateurs)
    .where(eq(administrateurs.id, userId))
    .limit(1);

  if (!admin) return error(c, "Utilisateur introuvable", 404);

  const isValid = await compare(currentPassword, admin.password_hash);
  if (!isValid) return error(c, "Mot de passe actuel incorrect", 401);

  const password_hash = await hash(newPassword, 10);

  await db
    .update(administrateurs)
    .set({ password_hash, updated_at: new Date() })
    .where(eq(administrateurs.id, userId));

  return success(c, null, "Mot de passe mis a jour");
});

// ─── 9. Administrateurs Router (admin uniquement) ────────────────────────────
export const adminAdministrateurs = new Hono();
adminAdministrateurs.use("*", requireRole("admin"));

// Normalise filiale_attribuee : "" -> null, "3" -> 3
function normalizeFilialeAttribuee(body: any) {
  if (body?.filiale_attribuee === "") body.filiale_attribuee = null;
  else if (body?.filiale_attribuee !== undefined && body.filiale_attribuee !== null) {
    body.filiale_attribuee = Number(body.filiale_attribuee);
  }
  return body;
}

adminAdministrateurs.get("/", async (c) => {
  const list = await db
    .select({
      ...adminPublicColumns,
      filiale_nom: filiales.nom,
    })
    .from(administrateurs)
    .leftJoin(filiales, eq(administrateurs.filiale_attribuee, filiales.id))
    .orderBy(asc(administrateurs.id));

  return success(c, list);
});

adminAdministrateurs.post("/", async (c) => {
  const body = normalizeFilialeAttribuee(await c.req.json().catch(() => ({})));

  const parsed = adminCreateSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  const { password, ...data } = parsed.data;

  // Email unique
  const [existing] = await db
    .select({ id: administrateurs.id })
    .from(administrateurs)
    .where(eq(administrateurs.email, data.email))
    .limit(1);

  if (existing) return error(c, "Email deja utilise", 409);

  const password_hash = await hash(password, 10);

  const created = await db
    .insert(administrateurs)
    .values({ ...data, password_hash })
    .returning(adminPublicColumns);

  return success(c, created[0], "Administrateur cree", 201);
});

adminAdministrateurs.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return error(c, "ID invalide", 400);

  const body = normalizeFilialeAttribuee(await c.req.json().catch(() => ({})));

  const parsed = adminEditSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  if (Object.keys(parsed.data).length === 0) {
    return error(c, "Aucun champ a mettre a jour", 422);
  }

  const [updated] = await db
    .update(administrateurs)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(administrateurs.id, id))
    .returning(adminPublicColumns);

  if (!updated) return error(c, "Administrateur introuvable", 404);
  return success(c, updated, "Administrateur mis a jour");
});

adminAdministrateurs.put("/:id/password", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return error(c, "ID invalide", 400);

  const body = await c.req.json().catch(() => ({}));
  const newPassword = typeof body?.new_password === "string" ? body.new_password : "";

  if (newPassword.length < 8) {
    return error(c, "Le nouveau mot de passe doit contenir au moins 8 caracteres", 422);
  }

  const [existing] = await db
    .select({ id: administrateurs.id })
    .from(administrateurs)
    .where(eq(administrateurs.id, id))
    .limit(1);

  if (!existing) return error(c, "Administrateur introuvable", 404);

  const password_hash = await hash(newPassword, 10);

  await db
    .update(administrateurs)
    .set({ password_hash, updated_at: new Date() })
    .where(eq(administrateurs.id, id));

  return success(c, null, "Mot de passe reinitialise");
});

// ─── 10. Upload Router ───────────────────────────────────────────────────────
export const adminUpload = new Hono();
adminUpload.use("*", requireRole("admin"));

adminUpload.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const folder = (body["folder"] as string) || "uploads";

  if (!file) {
    return error(c, "Aucun fichier fourni", 400);
  }

  const url = await uploadFile(file, folder);

  return success(
    c,
    {
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    },
    "Fichier televerse avec succes",
    201,
  );
});

// ─── 11. Router Principal Administration ────────────────────────────────────
export const adminRoutes = new Hono();
adminRoutes.use("*", authMiddleware);
adminRoutes.use("*", requireRole("admin", "gestionnaire"));

adminRoutes.route("/dashboard/stats", adminDashboard);
adminRoutes.route("/stats", adminDashboard);
adminRoutes.route("/demandes", adminDemandes);
adminRoutes.route("/filiales", adminFiliales);
adminRoutes.route("/galerie", adminGalerie);
adminRoutes.route("/catalogues", adminCatalogues);
adminRoutes.route("/pages", adminPages);
adminRoutes.route("/settings", adminSettings);
adminRoutes.route("/profile", adminProfile);
adminRoutes.route("/administrateurs", adminAdministrateurs);
adminRoutes.route("/upload", adminUpload);

export default adminRoutes;
