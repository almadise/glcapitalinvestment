import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireInternalApiAccess } from '@/lib/apiSecurity';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

function buildInternalNoteHtml(params: {
  caseTitle: string;
  caseRef: string;
  caseId: string;
  authorEmail: string;
  noteContent: string;
  caseStatus: string;
}): string {
  const { caseTitle, caseRef, caseId, authorEmail, noteContent, caseStatus } = params;
  const dashboardLink = `${SITE_URL}/back-office-admin-panel`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>📝 Note interne - ${caseTitle}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#0a1941;border-radius:10px 10px 0 0;padding:24px 32px;">
          <h1 style="margin:0;color:#c9a84c;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">GL Capital - Note Interne</h1>
          <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">📝 Une note interne a été ajoutée sur un dossier</p>
        </td></tr>
        <tr><td style="background:#c9a84c;height:2px;"></td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr><td style="background:#f8fafc;padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:3px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseRef} · ${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Statut actuel</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;font-weight:600;">${caseStatus}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Ajoutée par</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${authorEmail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;background:#fffbeb;">
              <span style="color:#92400e;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Contenu de la note</span>
              <p style="margin:6px 0 0;color:#78350f;font-size:13px;line-height:1.7;white-space:pre-wrap;">${noteContent.replace(/\n/g, '<br/>')}</p>
            </td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">Voir dans le back-office</a>
          </div>
          <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;text-align:center;">⚠️ Cette note est confidentielle - non visible par le client</p>
        </td></tr>
        <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Notification interne GL Capital - Ne pas répondre à cet email</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-internal-note-notification');
  if (!guard.ok) return guard.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    caseTitle: string;
    caseRef: string;
    caseId: string;
    authorEmail: string;
    noteContent: string;
    caseStatus: string;
    internalRecipients?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const {
    caseTitle,
    caseRef,
    caseId,
    authorEmail,
    noteContent,
    caseStatus,
    internalRecipients = [],
  } = body;

  if (!caseTitle || !caseId || !authorEmail || !noteContent) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const contactEmail = process.env.CONTACT_EMAIL || 'glcontact@glcapitalinvestment.com';
  const allRecipients = Array.from(new Set([contactEmail, ...internalRecipients].filter(Boolean)));

  const html = buildInternalNoteHtml({
    caseTitle,
    caseRef: caseRef || caseId,
    caseId,
    authorEmail,
    noteContent,
    caseStatus,
  });
  const subject = `📝 Note interne - ${caseTitle}`;

  const errors: string[] = [];
  const sent: string[] = [];

  for (const recipient of allRecipients) {
    try {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient,
        subject,
        html,
      });
      if (error) {
        errors.push(`${recipient}: ${error.message}`);
      } else {
        sent.push(recipient);
      }
    } catch (err: any) {
      errors.push(`${recipient}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
