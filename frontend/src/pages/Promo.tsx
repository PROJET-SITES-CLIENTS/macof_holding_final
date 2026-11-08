import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { RAW_BASE_URL } from '../lib/api';

interface Campaign {
  id: number;
  titre: string;
  message: string;
  media_url: string | null;
  media_type: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sent_at: string | null;
}

/**
 * PromoPage — Publicité ouverte depuis une notification push.
 * Affiche l'affiche / GIF / vidéo en plein écran avec un bouton d'action.
 */
export default function Promo() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const campaignId = Number(id);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      setError('Lien de publicité invalide.');
      setLoading(false);
      return;
    }

    fetch(`${RAW_BASE_URL}/push/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (body?.success && body.data) {
          setCampaign(body.data as Campaign);
        } else {
          setError('Cette publicité n’est plus disponible.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger cette publicité. Vérifiez votre connexion.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const ctaTarget = campaign?.cta_url
    ? campaign.cta_url.startsWith('http')
      ? campaign.cta_url
      : campaign.cta_url
    : '/';

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-5 py-14 text-center sm:py-20">
      {/* Halo d'ambiance */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(205,164,52,0.13),transparent_65%)]" />

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-[#cda434]" />
          <p className="text-sm text-slate-400">Chargement de la publicité…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-16">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </span>
          <p className="max-w-sm text-sm text-slate-400">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-[#cda434]/30 hover:bg-[#cda434]/10"
          >
            Retour à l'accueil
          </Link>
        </div>
      )}

      {!loading && campaign && (
        <div className="relative w-full">
          <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cda434]/80">
            <Sparkles className="h-3.5 w-3.5" />
            Annonce MACOF Holding
          </p>
          <h1 className="mt-3 font-[Cormorant_Garamond] text-3xl font-bold leading-tight text-slate-100 sm:text-4xl">
            {campaign.titre}
          </h1>
          <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-base leading-relaxed text-slate-300">
            {campaign.message}
          </p>

          {campaign.media_url && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
              {campaign.media_type === 'video' ? (
                <video
                  src={campaign.media_url}
                  className="max-h-[62vh] w-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={campaign.media_url}
                  alt={campaign.titre}
                  className="max-h-[62vh] w-full object-contain"
                  loading="eager"
                />
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {campaign.cta_url && campaign.cta_label ? (
              campaign.cta_url.startsWith('http') ? (
                <a
                  href={campaign.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-6 py-3 text-sm font-semibold text-[#1a1405] shadow-[0_10px_28px_-10px_rgba(205,164,52,0.6)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  {campaign.cta_label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={ctaTarget}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cda434] to-[#e0b83d] px-6 py-3 text-sm font-semibold text-[#1a1405] shadow-[0_10px_28px_-10px_rgba(205,164,52,0.6)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  {campaign.cta_label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )
            ) : null}
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:border-[#cda434]/30 hover:bg-[#cda434]/10 hover:text-[#e0b83d]"
            >
              Découvrir MACOF Holding
            </Link>
          </div>

          {campaign.sent_at && (
            <p className="mt-8 text-xs text-slate-600">
              Annonce publiée le{' '}
              {new Date(campaign.sent_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
