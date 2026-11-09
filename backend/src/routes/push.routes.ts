import { Hono } from 'hono';
import { type ZodError } from 'zod';
import { eq, count, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { notification_campaigns, push_subscriptions } from '../db/schema';
import { authMiddleware, requireRole } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { uploadFile } from '../services/upload';
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from '../utils/validation';
import {
  getVapidPublicKey,
  isPushConfigured,
  sendPushToAll,
} from '../services/push';
import { eventEmitter } from '../services/events';

const success = (c: any, data: any, message = 'Succes', status = 200) => {
  return c.json({ success: true, message, data }, status);
};

const error = (c: any, message = 'Erreur', status = 400) => {
  return c.json({ success: false, message }, status);
};

const zodFirstMessage = (zodError: ZodError) => {
  const issue = zodError.issues[0];
  return issue?.code === 'unrecognized_keys'
    ? 'Champ non autorise'
    : issue?.message || 'Donnees invalides';
};

// ─── 1. Routes publiques (application PWA) ──────────────────────────────────

export const pushRoutes = new Hono();

/** Cle publique VAPID — necessaire au navigateur pour souscrire au push. */
pushRoutes.get('/vapid-key', (c) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return error(c, 'Notifications push non configurees', 503);
  return success(c, { publicKey });
});

// Services push légitimes — empêche l'inscription d'URLs arbitraires
// (anti-flood + anti-SSRF lors des envois de campagne)
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'fcm.googleapis.com.', // variante FQDN
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
];

function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const { hostname, protocol } = new URL(endpoint);
    if (protocol !== 'https:') return false;
    return ALLOWED_PUSH_HOSTS.includes(hostname) || ALLOWED_PUSH_HOSTS.includes(`${hostname}.`);
  } catch {
    return false;
  }
}

/**
 * Enregistrement d'un abonnement push.
 * Idempotent : un re-abonnement met a jour les cles existantes.
 */
pushRoutes.post(
  '/subscribe',
  rateLimit({ key: 'push-sub', limit: 10, windowMs: 60 * 60 * 1000 }),
  async (c) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return error(c, 'JSON invalide', 400);
    }

    body.user_agent = c.req.header('user-agent') || undefined;
    const parsed = pushSubscriptionSchema.safeParse(body);
    if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

    const { endpoint, keys, user_agent } = parsed.data;
    if (!isAllowedPushEndpoint(endpoint)) {
      return error(c, 'Endpoint push non autorise', 422);
    }

  const existing = await db
    .select({ id: push_subscriptions.id })
    .from(push_subscriptions)
    .where(eq(push_subscriptions.endpoint, endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(push_subscriptions)
      .set({ p256dh: keys.p256dh, auth: keys.auth, user_agent: user_agent ?? null })
      .where(eq(push_subscriptions.endpoint, endpoint));
  } else {
    await db.insert(push_subscriptions).values({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: user_agent ?? null,
    });
  }

  return success(c, null, 'Abonnement enregistre', 201);
});

/** Desabonnement (notification refusee, application desinstallee…). */
pushRoutes.post('/unsubscribe', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return error(c, 'JSON invalide', 400);
  }

  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) return error(c, zodFirstMessage(parsed.error), 422);

  await db
    .delete(push_subscriptions)
    .where(eq(push_subscriptions.endpoint, parsed.data.endpoint));

  return success(c, null, 'Desabonnement effectue');
});

/** Lecture publique d'une campagne — ouverte depuis la notification (/promo/:id). */
pushRoutes.get('/campaigns/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return error(c, 'ID invalide', 400);

  const [campaign] = await db
    .select({
      id: notification_campaigns.id,
      titre: notification_campaigns.titre,
      message: notification_campaigns.message,
      media_url: notification_campaigns.media_url,
      media_type: notification_campaigns.media_type,
      cta_label: notification_campaigns.cta_label,
      cta_url: notification_campaigns.cta_url,
      sent_at: notification_campaigns.sent_at,
    })
    .from(notification_campaigns)
    .where(eq(notification_campaigns.id, id))
    .limit(1);

  if (!campaign) return error(c, 'Campagne introuvable', 404);
  return success(c, campaign);
});

// ─── 2. Routes admin (campagnes publicitaires) ──────────────────────────────

export const adminNotifications = new Hono();
adminNotifications.use('*', authMiddleware, requireRole('admin'));

/** Statistiques : abonnes, campagnes, derniere diffusion. */
adminNotifications.get('/stats', async (c) => {
  const [subsRow] = await db.select({ value: count() }).from(push_subscriptions);
  const [campaignsRow] = await db.select({ value: count() }).from(notification_campaigns);
  const [last] = await db
    .select({
      id: notification_campaigns.id,
      titre: notification_campaigns.titre,
      sent_at: notification_campaigns.sent_at,
      sent_count: notification_campaigns.sent_count,
    })
    .from(notification_campaigns)
    .orderBy(desc(notification_campaigns.created_at))
    .limit(1);

  return success(c, {
    abonnes: Number(subsRow?.value ?? 0),
    campagnes: Number(campaignsRow?.value ?? 0),
    push_configure: isPushConfigured(),
    derniere: last ?? null,
  });
});

/** Historique des campagnes. */
adminNotifications.get('/', async (c) => {
  const campaigns = await db
    .select()
    .from(notification_campaigns)
    .orderBy(desc(notification_campaigns.created_at));
  return success(c, campaigns);
});

/**
 * Creation + envoi immediat d'une campagne a tous les abonnes.
 * multipart/form-data : titre, message, cta_label, cta_url, media (fichier optionnel).
 */
adminNotifications.post('/', async (c) => {
  const contentType = c.req.header('content-type') || '';
  let body: any;
  let media: File | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await c.req.parseBody();
    media = form.media instanceof File && form.media.size > 0 ? form.media : undefined;
    body = Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'media'));
  } else {
    body = await c.req.json();
  }

  const titre = typeof body.titre === 'string' ? body.titre.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const ctaLabel = typeof body.cta_label === 'string' ? body.cta_label.trim() : '';
  let ctaUrl = typeof body.cta_url === 'string' ? body.cta_url.trim() : '';
  // Normalisation : un lien interne doit commencer par "/", un externe par "http"
  if (ctaUrl && !ctaUrl.startsWith('http') && !ctaUrl.startsWith('/')) {
    ctaUrl = `/${ctaUrl}`;
  }

  if (titre.length < 3) return error(c, 'Le titre est requis (min 3 caracteres)', 422);
  if (titre.length > 200) return error(c, 'Titre trop long (200 caracteres max)', 422);
  if (message.length < 3) return error(c, 'Le message est requis (min 3 caracteres)', 422);
  if (message.length > 500) return error(c, 'Message trop long (500 caracteres max)', 422);

  // Upload du media (affiche / GIF / video) vers Vercel Blob
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  if (media) {
    try {
      mediaUrl = await uploadFile(media, 'notifications');
      mediaType = media.type.startsWith('video/') ? 'video' : 'image';
    } catch (err: any) {
      return error(c, err?.message || 'Upload du media impossible', 400);
    }
  }

  // La notification ouvre la page publicite du site public
  const origin =
    c.req.header('origin') ||
    process.env.FRONTEND_URL ||
    new URL(c.req.url).origin.replace(/\/$/, '');
  const originClean = origin.replace(/\/$/, '');
  const promoUrl = `${originClean}/promo/__CAMPAIGN_ID__`;

  // 1) Insertion de la campagne (statut brouillon le temps de recuperer l'ID)
  const [campaign] = await db
    .insert(notification_campaigns)
    .values({
      titre,
      message,
      media_url: mediaUrl,
      media_type: mediaType,
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      statut: 'envoi_en_cours',
    })
    .returning();

  const finalUrl = promoUrl.replace('__CAMPAIGN_ID__', String(campaign.id));

  // 2) Diffusion push a tous les abonnes
  try {
    const report = await sendPushToAll({
      titre,
      message,
      url: finalUrl,
      media_url: mediaUrl,
      campaign_id: campaign.id,
    });

    const [updated] = await db
      .update(notification_campaigns)
      .set({
        statut: 'envoyee',
        sent_count: report.sent,
        failed_count: report.failed,
        sent_at: new Date(),
      })
      .where(eq(notification_campaigns.id, campaign.id))
      .returning();

    eventEmitter.emit('invalidate', { entity: 'notifications' });
    return success(c, { campaign: updated, rapport: report }, `Campagne envoyee a ${report.sent} abonne(s)`, 201);
  } catch (err: any) {
    await db
      .update(notification_campaigns)
      .set({ statut: 'erreur' })
      .where(eq(notification_campaigns.id, campaign.id));
    console.error('[notifications] Echec envoi push:', err);
    return error(c, err?.message || 'Echec de l envoi des notifications', 502);
  }
});

/** Suppression d'une campagne (l'historique seulement, pas les abonnements). */
adminNotifications.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) return error(c, 'ID invalide', 400);

  const [deleted] = await db
    .delete(notification_campaigns)
    .where(eq(notification_campaigns.id, id))
    .returning({ id: notification_campaigns.id });

  if (!deleted) return error(c, 'Campagne introuvable', 404);
  eventEmitter.emit('invalidate', { entity: 'notifications' });
  return success(c, null, 'Campagne supprimee');
});
