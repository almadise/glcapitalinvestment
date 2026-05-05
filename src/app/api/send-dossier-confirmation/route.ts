import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireInternalApiAccess } from '@/lib/apiSecurity';
import { RESEND_FROM_FALLBACK } from '@/lib/companyContact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

function buildDossierConfirmationHtml(params: {
  clientName: string;
  caseTitle: string;
  caseId: string;
  lang: 'fr' | 'en';
}): string {
  const { clientName, caseTitle, caseId, lang } = params;
  const isFr = lang === 'fr';
  const portalLink = `${SITE_URL}/client-dashboard/case-files`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${isFr ? 'Dossier reçu - GL Capital' : 'File received - GL Capital'}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">📁 ${isFr ? 'Dossier reçu' : 'File received'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`}</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">${
            isFr
              ? 'Nous avons bien reçu votre dossier de financement. Notre équipe va procéder à son analyse dans les meilleurs délais. Vous serez notifié de chaque mise à jour.'
              : 'We have received your financing file. Our team will proceed with its analysis as soon as possible. You will be notified of each update.'
          }</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Dossier' : 'Case file'}</span>
                  <p style="margin:4px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
                </td></tr>
                <tr><td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Référence' : 'Reference'}</span>
                  <p style="margin:4px 0 0;color:#0a1941;font-size:13px;font-family:monospace;">${caseId}</p>
                </td></tr>
                <tr><td style="padding-top:12px;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Statut initial' : 'Initial status'}</span>
                  <p style="margin:4px 0 0;"><strong style="color:#3b82f6;">${isFr ? 'Reçu' : 'Received'}</strong></p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${portalLink}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${isFr ? 'Suivre mon dossier' : 'Track my file'}</a>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${isFr ? 'Confirmation automatique de réception de dossier.' : 'Automatic case file receipt confirmation.'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-dossier-confirmation');
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
    lang?: 'fr' | 'en';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { clientEmail, clientName, caseTitle, caseId, lang = 'fr' } = body;

  if (!clientEmail || !clientName || !caseTitle || !caseId) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const isFr = lang === 'fr';
  const subject = isFr
    ? `Dossier reçu - ${caseTitle} | GL Capital`
    : `File received - ${caseTitle} | GL Capital`;

  const html = buildDossierConfirmationHtml({ clientName, caseTitle, caseId, lang });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [clientEmail],
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [clientEmail],
        subject,
        html,
      });
      return NextResponse.json({ success: true });
    } catch (fallbackErr: any) {
      return NextResponse.json({ success: false, error: fallbackErr.message }, { status: 500 });
    }
  }
}
