import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { escapeHtml, requireInternalApiAccess } from '@/lib/apiSecurity';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

type ReminderType = 'incomplete' | 'pending_docs' | 'no_action';

function buildReminderHtml(params: {
  clientName: string;
  caseTitle: string;
  caseId: string;
  reminderType: ReminderType;
  customMessage?: string;
  lang: 'fr' | 'en';
}): string {
  const { clientName, caseTitle, caseId, reminderType, customMessage, lang } = params;
  const isFr = lang === 'fr';
  const portalLink = `${SITE_URL}/client-dashboard/dossier-timeline`;
  const docsLink = `${SITE_URL}/client-dashboard/documents`;

  const safeClientName = escapeHtml(clientName);
  const safeCaseTitle = escapeHtml(caseTitle);
  const safeCaseId = escapeHtml(caseId);

  const contentByType: Record<ReminderType, { subject: string; badge: string; headline: string; body: string; ctaLabel: string; ctaLink: string }> = {
    incomplete: {
      subject: isFr ? `Action requise – Dossier incomplet : ${safeCaseTitle}` : `Action required – Incomplete file: ${safeCaseTitle}`,
      badge: isFr ? '⚠️ Dossier incomplet' : '⚠️ Incomplete file',
      headline: isFr ? 'Des documents sont manquants' : 'Documents are missing',
      body: isFr
        ? `Votre dossier "${safeCaseTitle}" nécessite des documents complémentaires pour être traité. Veuillez accéder à votre espace client pour déposer les pièces manquantes dès que possible.`
        : `Your file "${safeCaseTitle}" requires additional documents to be processed. Please access your client portal to upload the missing documents as soon as possible.`,
      ctaLabel: isFr ? 'Déposer mes documents' : 'Upload my documents',
      ctaLink: docsLink,
    },
    pending_docs: {
      subject: isFr ? `Rappel – Documents en attente : ${safeCaseTitle}` : `Reminder – Pending documents: ${safeCaseTitle}`,
      badge: isFr ? '📋 Documents requis' : '📋 Documents required',
      headline: isFr ? 'Votre dossier attend vos documents' : 'Your file is waiting for your documents',
      body: isFr
        ? `Nous attendons toujours les documents requis pour votre dossier "${safeCaseTitle}". Leur réception permettra de relancer immédiatement l'instruction de votre dossier.`
        : `We are still waiting for the required documents for your file "${safeCaseTitle}". Their receipt will immediately resume the processing of your file.`,
      ctaLabel: isFr ? 'Accéder à mon espace' : 'Access my portal',
      ctaLink: docsLink,
    },
    no_action: {
      subject: isFr ? `Rappel de suivi – ${safeCaseTitle}` : `Follow-up reminder – ${safeCaseTitle}`,
      badge: isFr ? '🔔 Mise à jour dossier' : '🔔 File update',
      headline: isFr ? 'Un point sur votre dossier' : 'An update on your file',
      body: isFr
        ? `Nous souhaitons vous informer que votre dossier "${safeCaseTitle}" est en cours de traitement. Consultez votre espace client pour suivre l'avancement en temps réel.`
        : `We would like to inform you that your file "${safeCaseTitle}" is currently being processed. Check your client portal to track progress in real time.`,
      ctaLabel: isFr ? 'Suivre mon dossier' : 'Track my file',
      ctaLink: portalLink,
    },
  };

  const content = contentByType[reminderType];
  const finalBody = customMessage ? escapeHtml(customMessage) : content.body;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${content.subject}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#1E2D4A 0%,#2A3D5C 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;">${content.badge}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:36px 40px 0;">
          <p style="margin:0 0 8px;color:#1E2D4A;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${safeClientName},` : `Dear ${safeClientName},`}</p>
          <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:20px;font-weight:700;">${content.headline}</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${finalBody}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Référence dossier' : 'File reference'}</span>
              <p style="margin:4px 0 0;color:#1E2D4A;font-size:13px;font-family:monospace;">${safeCaseId}</p>
              <p style="margin:4px 0 0;color:#1E2D4A;font-size:14px;font-weight:600;">${safeCaseTitle}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:24px 40px 36px;text-align:center;">
          <a href="${content.ctaLink}" style="display:inline-block;background:#B8912A;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${content.ctaLabel}</a>
        </td></tr>
        <tr><td style="background:#1E2D4A;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 4px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#64748b;font-size:11px;">${isFr ? 'Pour toute question, répondez à cet email ou accédez à votre espace client.' : 'For any questions, reply to this email or access your client portal.'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-dossier-reminder');
  if (!guard.ok) return guard.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    clientEmail: string;
    clientName: string;
    caseTitle: string;
    caseId: string;
    reminderType?: ReminderType;
    customMessage?: string;
    lang?: 'fr' | 'en';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const {
    clientEmail,
    clientName,
    caseTitle,
    caseId,
    reminderType = 'incomplete',
    customMessage,
    lang = 'fr',
  } = body;

  if (!clientEmail || !clientName || !caseTitle || !caseId) {
    return NextResponse.json({ success: false, error: 'Missing required fields: clientEmail, clientName, caseTitle, caseId' }, { status: 400 });
  }

  const normalizedEmail = clientEmail.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  if (!isValidEmail) {
    return NextResponse.json({ success: false, error: 'Invalid clientEmail format' }, { status: 400 });
  }

  if (!['incomplete', 'pending_docs', 'no_action'].includes(reminderType)) {
    return NextResponse.json({ success: false, error: 'Invalid reminderType' }, { status: 400 });
  }

  const html = buildReminderHtml({ clientName, caseTitle, caseId, reminderType, customMessage, lang });

  const subjectMap: Record<ReminderType, string> = {
    incomplete: lang === 'fr' ? `Action requise – Dossier incomplet : ${caseTitle}` : `Action required – Incomplete file: ${caseTitle}`,
    pending_docs: lang === 'fr' ? `Rappel – Documents en attente : ${caseTitle}` : `Reminder – Pending documents: ${caseTitle}`,
    no_action: lang === 'fr' ? `Rappel de suivi – ${caseTitle}` : `Follow-up reminder – ${caseTitle}`,
  };

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [normalizedEmail],
      subject: subjectMap[reminderType],
      html,
    });
    return NextResponse.json({ success: true, reminderType, caseId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Send failed' }, { status: 500 });
  }
}
