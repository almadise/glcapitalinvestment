/**
 * Instrumentation unifiée GL Capital.
 * Pousse dans window.dataLayer (GA4/GTM) et log en console en dev.
 *
 * Utilisation:
 *   trackEvent('lead_submitted', { channel: 'services-page', service: 'structuration' })
 *   trackEvent('dossier_created', { case_id: '...', type: 'FINANCEMENT_PROJET' })
 *   trackEvent('dossier_qualified', { case_id: '...', status: 'ELIGIBLE' })
 *   trackEvent('dossier_closed', { case_id: '...', status: 'CLOTURE' })
 */

export type TrackableEvent =
  | 'lead_submitted' // Contact form soumis
  | 'lead_qualified' // Lead qualifié par l'équipe
  | 'dossier_created' // Nouveau dossier créé
  | 'dossier_qualified' // Dossier éligible
  | 'dossier_submitted_partner' // Soumis aux partenaires
  | 'dossier_closed' // Dossier clôturé
  | 'dossier_rejected' // Dossier rejeté
  | 'page_view_services' // Vue page services
  | 'cta_clicked' // CTA cliqué
  | 'package_interest' // Intérêt pour un package
  | 'document_uploaded' // Document uploadé
  | 'compliance_flag' // Flag conformité déclenché
  | 'email_reminder_sent'; // Email de relance envoyé

interface EventPayload {
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(event: TrackableEvent, payload?: EventPayload): void {
  if (typeof window === 'undefined') return;

  const enriched = {
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  // Push to Google Tag Manager dataLayer
  if (!window.dataLayer) window.dataLayer = [];
  window.dataLayer.push(enriched);

  // Also push as GA4 custom event if gtag is available
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, payload ?? {});
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[GL Track]', event, payload ?? {});
  }
}

/** Convenience: track CTA click with location and target */
export function trackCTA(ctaId: string, href: string, page?: string): void {
  trackEvent('cta_clicked', {
    cta_id: ctaId,
    href,
    page: page ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}

/** Convenience: track lead from contact form */
export function trackLeadSubmitted(channel: string, service?: string): void {
  trackEvent('lead_submitted', { channel, service });
}

/** Convenience: track dossier lifecycle */
export function trackDossierEvent(
  eventType:
    | 'dossier_created'
    | 'dossier_qualified'
    | 'dossier_submitted_partner'
    | 'dossier_closed'
    | 'dossier_rejected',
  caseId: string,
  extras?: EventPayload
): void {
  trackEvent(eventType, { case_id: caseId, ...extras });
}
