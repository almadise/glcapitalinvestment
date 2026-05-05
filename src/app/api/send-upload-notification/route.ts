import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireInternalApiAccess } from '@/lib/apiSecurity';
import { RESEND_FROM_FALLBACK } from '@/lib/companyContact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildUploadEmailHtml(params: {
  analystName: string;
  analystEmail: string;
  caseTitle: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  portal: 'analyst' | 'compliance';
}): string {
  const { analystName, analystEmail, caseTitle, caseId, fileName, fileSize, uploadedAt, portal } =
    params;
  const dashboardLink =
    portal === 'analyst'
      ? `${SITE_URL}/analyst-dashboard/cases`
      : `${SITE_URL}/compliance-dashboard/cases`;

  const portalLabel = portal === 'analyst' ? 'Analyste' : 'Conformité';
  const subject = `Document téléversé - ${caseTitle}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:32px 36px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:20px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:16px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:5px 16px;">
            <span style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">📎 Document téléversé</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 36px;">
          <p style="margin:0 0 6px;color:#0a1941;font-size:15px;font-weight:600;">Confirmation de téléversement</p>
          <p style="margin:0 0 24px;color:#475569;font-size:13px;line-height:1.7;">
            Un document a été téléversé avec succès dans le dossier <strong>${caseTitle}</strong>.
          </p>
          <!-- File info card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="background:#f8fafc;padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Fichier</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:700;">${fileName}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">${formatBytes(fileSize)}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:4px 0 0;color:#334155;font-size:13px;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:10px;font-family:monospace;">${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Téléversé par</span>
              <p style="margin:4px 0 0;color:#334155;font-size:13px;">${analystName} (${portalLabel})</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;">${analystEmail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;">
              <span style="color:#64748b;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Date & heure</span>
              <p style="margin:4px 0 0;color:#334155;font-size:13px;">${uploadedAt}</p>
            </td></tr>
          </table>
          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">
              Voir dans le back-office
            </a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
          <p style="margin:0 0 4px;color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:10px;">Notification automatique - Piste d'audit interne</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-upload-notification');
  if (!guard.ok) return guard.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    analystName: string;
    analystEmail: string;
    caseTitle: string;
    caseId: string;
    fileName: string;
    fileSize: number;
    portal: 'analyst' | 'compliance';
    internalRecipients?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const {
    analystName,
    analystEmail,
    caseTitle,
    caseId,
    fileName,
    fileSize,
    portal,
    internalRecipients = [],
  } = body;

  if (!analystEmail || !caseTitle || !caseId || !fileName) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const uploadedAt = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = buildUploadEmailHtml({
    analystName,
    analystEmail,
    caseTitle,
    caseId,
    fileName,
    fileSize,
    uploadedAt,
    portal,
  });

  const subject = `Document téléversé - ${caseTitle}`;

  // Send to analyst + any internal recipients
  const recipients = Array.from(new Set([analystEmail, ...internalRecipients]));

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: recipients,
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
