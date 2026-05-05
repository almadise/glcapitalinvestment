import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireInternalApiAccess } from '@/lib/apiSecurity';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

type NotificationType = 'compliance_flag' | 'antivirus_complete' | 'antivirus_failed';

function buildComplianceFlagHtml(params: {
  caseTitle: string;
  caseId: string;
  clientEmail: string;
  flagReason: string;
  riskTags: string[];
  triggeredBy: string;
}): string {
  const { caseTitle, caseId, clientEmail, flagReason, riskTags, triggeredBy } = params;
  const dashboardLink = `${SITE_URL}/admin/case-management`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>⚠️ Flag Conformité - ${caseTitle}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:#7f1d1d;border-radius:10px 10px 0 0;padding:24px 32px;">
          <h1 style="margin:0;color:#fca5a5;font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">GL Capital - Alerte Conformité</h1>
          <p style="margin:6px 0 0;color:#fecaca;font-size:12px;">⚠️ Flag de conformité déclenché - Action requise</p>
        </td></tr>
        <tr><td style="background:#ef4444;height:2px;"></td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:8px;overflow:hidden;background:#fff5f5;">
            <tr><td style="padding:14px 18px;border-bottom:1px solid #fee2e2;">
              <span style="color:#991b1b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:3px 0 0;color:#1e293b;font-size:15px;font-weight:700;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #fee2e2;">
              <span style="color:#991b1b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Client</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${clientEmail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #fee2e2;">
              <span style="color:#991b1b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Motif du flag</span>
              <p style="margin:3px 0 0;color:#7f1d1d;font-size:13px;font-weight:600;">${flagReason}</p>
            </td></tr>
            ${
              riskTags.length > 0
                ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #fee2e2;">
              <span style="color:#991b1b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tags risque</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${riskTags.join(', ')}</p>
            </td></tr>`
                : ''
            }
            <tr><td style="padding:14px 18px;">
              <span style="color:#991b1b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Déclenché par</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${triggeredBy}</p>
            </td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:#7f1d1d;color:#fca5a5;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">Examiner le dossier</a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Alerte conformité GL Capital - Équipe Back-Office</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildAntivirusHtml(params: {
  caseTitle: string;
  caseId: string;
  documentName: string;
  scanResult: 'clean' | 'threat';
  clientEmail: string;
}): string {
  const { caseTitle, caseId, documentName, scanResult, clientEmail } = params;
  const isClean = scanResult === 'clean';
  const dashboardLink = `${SITE_URL}/admin/case-management`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>${isClean ? '✅' : '🚨'} Scan antivirus - ${documentName}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:${isClean ? '#0a1941' : '#7f1d1d'};border-radius:10px 10px 0 0;padding:24px 32px;">
          <h1 style="margin:0;color:${isClean ? '#c9a84c' : '#fca5a5'};font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">GL Capital - Scan Antivirus</h1>
          <p style="margin:6px 0 0;color:${isClean ? '#94a3b8' : '#fecaca'};font-size:12px;">${isClean ? '✅ Document analysé - Aucune menace détectée' : '🚨 Menace détectée - Document mis en quarantaine'}</p>
        </td></tr>
        <tr><td style="background:${isClean ? '#10b981' : '#ef4444'};height:2px;"></td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Document</span>
              <p style="margin:3px 0 0;color:#1e293b;font-size:14px;font-weight:600;">${documentName}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Client</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${clientEmail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;">
              <span style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Résultat</span>
              <p style="margin:3px 0 0;font-size:14px;font-weight:700;color:${isClean ? '#10b981' : '#ef4444'};">${isClean ? '✅ Propre - Aucune menace' : '🚨 Menace détectée - Quarantaine'}</p>
            </td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">Voir dans le back-office</a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Notification automatique GL Capital - Système antivirus</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-compliance-notification');
  if (!guard.ok) return guard.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    type: NotificationType;
    caseTitle: string;
    caseId: string;
    clientEmail: string;
    flagReason?: string;
    riskTags?: string[];
    triggeredBy?: string;
    documentName?: string;
    scanResult?: 'clean' | 'threat';
    internalRecipients?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const {
    type,
    caseTitle,
    caseId,
    clientEmail,
    flagReason = 'Anomalie détectée',
    riskTags = [],
    triggeredBy = 'système',
    documentName = 'Document',
    scanResult = 'clean',
    internalRecipients = [],
  } = body;

  if (!type || !caseTitle || !caseId || !clientEmail) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const contactEmail = process.env.CONTACT_EMAIL || 'glcontact@glcapitalinvestment.com';
  const errors: string[] = [];
  const sent: string[] = [];

  let html = '';
  let subject = '';

  if (type === 'compliance_flag') {
    html = buildComplianceFlagHtml({
      caseTitle,
      caseId,
      clientEmail,
      flagReason,
      riskTags,
      triggeredBy,
    });
    subject = `⚠️ Flag conformité - ${caseTitle}`;
  } else if (type === 'antivirus_complete' || type === 'antivirus_failed') {
    html = buildAntivirusHtml({
      caseTitle,
      caseId,
      documentName,
      scanResult: type === 'antivirus_complete' ? 'clean' : 'threat',
      clientEmail,
    });
    subject =
      type === 'antivirus_complete'
        ? `✅ Scan antivirus terminé - ${documentName}`
        : `🚨 Menace détectée - ${documentName}`;
  }

  // Validate internalRecipients to prevent sending to arbitrary addresses
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validatedInternalRecipients = internalRecipients.filter(
    (r) => typeof r === 'string' && EMAIL_REGEX.test(r)
  );

  // Send to internal recipients
  const allRecipients = [contactEmail, ...validatedInternalRecipients].filter(Boolean);
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
