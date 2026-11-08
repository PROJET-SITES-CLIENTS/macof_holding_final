import * as webpush from 'web-push';
import { db } from '../db/client';
import { push_subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Service d'envoi de notifications push Web (standard W3C / VAPID).
 * Fonctionne avec Android Chrome et iOS 16.4+ (application installee).
 */

let configured = false;

function configure(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@macof-holding.com';

  if (!publicKey || !privateKey) return false;

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  titre: string;
  message: string;
  url: string;
  media_url?: string | null;
  campaign_id?: number;
}

export interface SendReport {
  sent: number;
  failed: number;
  total: number;
}

/**
 * Envoie une notification a TOUS les abonnes.
 * - Supprime les abonnements expires (404/410) signals par les services push.
 * - Retourne le decompte envois reussis / echecs.
 */
export async function sendPushToAll(payload: PushPayload): Promise<SendReport> {
  if (!configure()) {
    throw new Error('Notifications push non configurees (cles VAPID manquantes)');
  }

  const subscribers = await db.select().from(push_subscriptions);
  if (subscribers.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const notification = JSON.stringify({
    title: payload.titre,
    body: payload.message,
    url: payload.url,
    image: payload.media_url || undefined,
    campaignId: payload.campaign_id,
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  // Envoi par lots de 50 pour rester compatible serverless
  const CHUNK = 50;
  for (let i = 0; i < subscribers.length; i += CHUNK) {
    const chunk = subscribers.slice(i, i + CHUNK);

    const results = await Promise.allSettled(
      chunk.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notification,
          { TTL: 86400, urgency: 'normal' }
        )
      )
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent += 1;
        return;
      }
      failed += 1;
      const reason = result.reason as { statusCode?: number } | undefined;
      // 404 / 410 : abonnement expire → on nettoie la base
      if (reason?.statusCode === 404 || reason?.statusCode === 410) {
        staleEndpoints.push(chunk[index].endpoint);
      }
    });
  }

  // Nettoyage des abonnements morts
  for (const endpoint of staleEndpoints) {
    await db.delete(push_subscriptions).where(eq(push_subscriptions.endpoint, endpoint));
  }

  return { sent, failed, total: subscribers.length };
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || '';
}
