import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireInternalApiAccess } from '@/lib/apiSecurity';
import { CONTACT_EMAIL_FALLBACK, RESEND_FROM_FALLBACK } from '@/lib/companyContact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

function buildAuditFlagHtml(params: {
  caseTitle: string;
  caseRef: string;
  caseId: string;
  action: string;
  detail: string;
  actorEmail: string;
  severity: string;
  timestamp: string;
}): string {
  const { caseTitle, caseRef, caseId, action, detail, actorEmail, severity, timestamp } = params;
  const isCritical = severity === 'critical' || severity === 'sensitive';
  const dashboardLink = `${SITE_URL}/back-office-admin-panel`;

  const severityColor = isCritical ? '#7f1d1d' : '#92400e';
  const severityBg = isCritical ? '#fff5f5' : '#fffbeb';
  const severityBorder = isCritical ? '#fecaca' : '#fde68a';
  const headerBg = isCritical ? '#7f1d1d' : '#0a1941';
  const headerTextColor = isCritical ? '#fca5a5' : '#c9a84c';
  const accentColor = isCritical ? '#ef4444' : '#c9a84c';
  const icon = isCritical ? '🚨' : '⚠️';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>${icon} Audit Flag - ${caseTitle}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
        <tr><td style="background:${headerBg};border-radius:10px 10px 0 0;padding:24px 32px;">
          <h1 style="margin:0;color:${headerTextColor};font-size:16px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">GL Capital - Journal Audit</h1>
          <p style="margin:6px 0 0;color:${isCritical ? '#fecaca' : '#94a3b8'};font-size:12px;">${icon} Entrée audit ${isCritical ? 'critique' : 'sensible'} - Action requise</p>
        </td></tr>
        <tr><td style="background:${accentColor};height:2px;"></td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${severityBorder};border-radius:8px;overflow:hidden;background:${severityBg};">
            <tr><td style="padding:14px 18px;border-bottom:1px solid ${severityBorder};">
              <span style="color:${severityColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Dossier</span>
              <p style="margin:3px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
              <p style="margin:2px 0 0;color:#94a3b8;font-size:11px;font-family:monospace;">${caseRef} · ${caseId}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid ${severityBorder};">
              <span style="color:${severityColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Action</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;font-weight:600;font-family:monospace;">${action}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid ${severityBorder};">
              <span style="color:${severityColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Détail</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;line-height:1.6;">${detail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;border-bottom:1px solid ${severityBorder};">
              <span style="color:${severityColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Acteur</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;">${actorEmail}</p>
            </td></tr>
            <tr><td style="padding:14px 18px;">
              <span style="color:${severityColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Horodatage</span>
              <p style="margin:3px 0 0;color:#334155;font-size:13px;font-family:monospace;">${timestamp}</p>
            </td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="${dashboardLink}" style="display:inline-block;background:${headerBg};color:${headerTextColor};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:8px;text-decoration:none;">Examiner dans le back-office</a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Alerte audit GL Capital - Équipe Conformité &amp; Administration</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const guard = await requireInternalApiAccess(req, 'send-audit-flag-notification');
  if (!guard.ok) return guard.response;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: {
    caseTitle: string;
    caseRef?: string;
    caseId: string;
    action: string;
    detail: string;
    actorEmail: string;
    severity: string;
    timestamp?: string;
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
    action,
    detail,
    actorEmail,
    severity,
    timestamp = new Date().toISOString(),
    internalRecipients = [],
  } = body;

  if (!caseTitle || !caseId || !action || !actorEmail) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Only send for sensitive/critical severity
  const isSensitive = ['critical', 'sensitive'].includes(severity);
  if (!isSensitive) {
    return NextResponse.json({ success: true, sent: [], skipped: 'non-sensitive severity' });
  }

  const resend = new Resend(apiKey);
  const contactEmail = process.env.CONTACT_EMAIL || CONTACT_EMAIL_FALLBACK;
  const allRecipients = Array.from(new Set([contactEmail, ...internalRecipients].filter(Boolean)));

  const html = buildAuditFlagHtml({
    caseTitle,
    caseRef: caseRef || caseId,
    caseId,
    action,
    detail,
    actorEmail,
    severity,
    timestamp: new Date(timestamp).toLocaleString('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }),
  });
  const icon = severity === 'critical' ? '🚨' : '⚠️';
  const subject = `${icon} Audit ${severity} - ${action} sur ${caseTitle}`;

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
