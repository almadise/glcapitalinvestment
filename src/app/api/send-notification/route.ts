import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';

function buildNotificationHtml(params: {
  recipientName: string;
  title: string;
  message: string;
  type: string;
  caseTitle?: string;
  actionUrl?: string;
  lang: 'fr' | 'en';
}): string {
  const { recipientName, title, message, type, caseTitle, actionUrl, lang } = params;
  const isFr = lang === 'fr';

  const typeColors: Record<string, string> = {
    STATUS_UPDATE: '#3b82f6',
    ACTION_REQUIRED: '#f97316',
    COMPLIANCE_DECISION: '#10b981',
    DOCUMENT_REQUEST: '#8b5cf6',
    GENERAL: '#64748b',
  };
  const typeColor = typeColors[type] || '#64748b';

  const typeLabels: Record<string, { fr: string; en: string }> = {
    STATUS_UPDATE: { fr: 'Mise à jour statut', en: 'Status Update' },
    ACTION_REQUIRED: { fr: 'Action requise', en: 'Action Required' },
    COMPLIANCE_DECISION: { fr: 'Décision conformité', en: 'Compliance Decision' },
    DOCUMENT_REQUEST: { fr: 'Document requis', en: 'Document Request' },
    GENERAL: { fr: 'Notification', en: 'Notification' },
  };
  const typeLabel = isFr ? (typeLabels[type]?.fr ?? 'Notification') : (typeLabels[type]?.en ?? 'Notification');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title} — GL Capital</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">🔔 ${typeLabel}</span>
          </div>
        </td></tr>
        <tr><td style="background:${typeColor};height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${recipientName},` : `Hello ${recipientName},`}</p>
          <h2 style="margin:0 0 12px;color:#0a1941;font-size:18px;font-weight:700;">${title}</h2>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">${message}</p>
        </td></tr>
        ${caseTitle ? `
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid ${typeColor};border-radius:0 8px 8px 0;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Dossier concerné' : 'Related file'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:600;">${caseTitle}</p>
            </td></tr>
          </table>
        </td></tr>` : ''}
        ${actionUrl ? `
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${actionUrl}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">
            ${isFr ? 'Voir dans le portail' : 'View in portal'}
          </a>
        </td></tr>` : ''}
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${isFr ? 'Notification automatique du portail.' : 'Automated portal notification.'}</p>
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
    recipientEmail: string;
    recipientName: string;
    title: string;
    message: string;
    type: string;
    caseTitle?: string;
    actionUrl?: string;
    lang?: 'fr' | 'en';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { recipientEmail, recipientName, title, message, type, caseTitle, actionUrl, lang = 'fr' } = body;
  if (!recipientEmail || !title || !message) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const subject = `${title} — GL Capital`;
  const html = buildNotificationHtml({ recipientName, title, message, type, caseTitle, actionUrl, lang });

  try {
    await resend.emails.send({
      from: 'GL Capital <noreply@glcapital.com>',
      to: [recipientEmail],
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch {
    try {
      await resend.emails.send({
        from: 'GL Capital <onboarding@resend.dev>',
        to: [recipientEmail],
        subject,
        html,
      });
      return NextResponse.json({ success: true });
    } catch (fallbackErr: any) {
      return NextResponse.json({ success: false, error: fallbackErr.message }, { status: 500 });
    }
  }
}
