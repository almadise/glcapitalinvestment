import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';

function buildRequestDocumentsHtml(params: {
  clientName: string;
  caseTitle: string;
  caseId: string;
  adminMessage: string;
  lang: 'fr' | 'en';
}): string {
  const { clientName, caseTitle, caseId, adminMessage, lang } = params;
  const isFr = lang === 'fr';
  const portalLink = `${SITE_URL}/client-dashboard/case-files`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${isFr ? 'Documents requis — GL Capital' : 'Documents required — GL Capital'}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);border-radius:20px;padding:6px 18px;">
            <span style="color:#fb923c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">⚠️ ${isFr ? 'Documents requis' : 'Documents required'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#f97316;height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`}</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">${isFr
    ? `Votre dossier <strong>${caseTitle}</strong> nécessite des documents complémentaires avant de pouvoir poursuivre son traitement.`
    : `Your case file <strong>${caseTitle}</strong> requires additional documents before we can proceed with its processing.`}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Dossier' : 'Case file'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseId}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:20px;">
              <span style="color:#c2410c;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Message de notre équipe' : 'Message from our team'}</span>
              <p style="margin:8px 0 0;color:#7c2d12;font-size:14px;line-height:1.7;">${adminMessage.replace(/\n/g, '<br/>')}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${portalLink}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${isFr ? 'Accéder à mon dossier' : 'Access my file'}</a>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${isFr ? 'Ce message vous a été envoyé automatiquement suite à une demande de documents.' : 'This message was sent automatically following a document request.'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    clientEmail: string;
    clientName: string;
    caseTitle: string;
    caseId: string;
    adminMessage: string;
    lang?: 'fr' | 'en';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { clientEmail, clientName, caseTitle, caseId, adminMessage, lang = 'fr' } = body;

  if (!clientEmail || !clientName || !caseTitle || !caseId || !adminMessage) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const isFr = lang === 'fr';
  const subject = isFr
    ? `Documents requis pour votre dossier — ${caseTitle}`
    : `Documents required for your case file — ${caseTitle}`;

  const html = buildRequestDocumentsHtml({ clientName, caseTitle, caseId, adminMessage, lang });

  try {
    await resend.emails.send({
      from: 'GL Capital <noreply@glcapital.com>',
      to: [clientEmail],
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Fallback to onboarding@resend.dev if custom domain not verified
    try {
      await resend.emails.send({
        from: 'GL Capital <onboarding@resend.dev>',
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
