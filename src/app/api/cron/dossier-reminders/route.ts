import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceRoleClient } from '@/lib/supabase/service';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization') || '';
  const hasVercelCronHeader = req.headers.has('x-vercel-cron');

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  return hasVercelCronHeader;
}

function buildReminderHtml(clientName: string, caseTitle: string, caseRef: string): string {
  const docsLink = `${SITE_URL}/client-dashboard/documents`;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Rappel documents</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:#1E2D4A;border-radius:12px 12px 0 0;padding:28px 34px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:21px;letter-spacing:2px;">GL CAPITAL</h1>
          <p style="margin:6px 0 0;color:#c9a84c;font-size:11px;letter-spacing:2px;">RAPPEL DOSSIER</p>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#fff;padding:28px 34px;">
          <p style="margin:0 0 10px;color:#1E2D4A;font-size:15px;">Bonjour ${clientName},</p>
          <p style="margin:0 0 14px;color:#475569;font-size:14px;line-height:1.7;">
            Votre dossier <strong>${caseTitle}</strong> (${caseRef}) est toujours en attente de pièces complémentaires.
            Pour relancer son traitement, merci de déposer les documents requis.
          </p>
          <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.7;">
            Notre équipe reste disponible pour vous accompagner.
          </p>
          <a href="${docsLink}" style="display:inline-block;background:#B8912A;color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;">
            Déposer mes documents
          </a>
        </td></tr>
        <tr><td style="background:#1E2D4A;border-radius:0 0 12px 12px;padding:14px 34px;text-align:center;">
          <p style="margin:0;color:#64748b;font-size:11px;">Notification automatique GL Capital Investment SA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized cron access' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  const supabase = createServiceRoleClient();
  const resend = new Resend(resendApiKey);
  const now = new Date();
  const threshold = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const { data: staleCases, error: fetchErr } = await supabase
    .from('case_files')
    .select('id, ref, project_name, contact_name, contact_email, updated_at, metadata')
    .eq('status', 'A_COMPLETER')
    .lt('updated_at', threshold)
    .limit(25);

  if (fetchErr) {
    return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ caseId: string; error: string }> = [];

  for (const row of staleCases || []) {
    const caseId = String(row.id);
    const email = row.contact_email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }

    const metadata = (row.metadata || {}) as Record<string, unknown>;
    const lastReminderRaw = typeof metadata.last_reminder_at === 'string' ? metadata.last_reminder_at : '';
    if (lastReminderRaw) {
      const lastReminderDate = new Date(lastReminderRaw);
      const diffHours = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);
      if (diffHours < 48) {
        skipped += 1;
        continue;
      }
    }

    const clientName = row.contact_name?.trim() || 'Client';
    const caseTitle = row.project_name?.trim() || 'Dossier de financement';
    const caseRef = row.ref?.trim() || caseId;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject: `Rappel – Documents en attente : ${caseTitle}`,
        html: buildReminderHtml(clientName, caseTitle, caseRef),
      });

      const nextMetadata = {
        ...metadata,
        last_reminder_at: now.toISOString(),
        last_reminder_type: 'pending_docs',
      };

      await supabase.from('case_files').update({ metadata: nextMetadata }).eq('id', caseId);
      sent += 1;
    } catch (err: any) {
      errors.push({ caseId, error: err?.message || 'Unknown send error' });
    }
  }

  return NextResponse.json({
    success: true,
    scanned: staleCases?.length || 0,
    sent,
    skipped,
    errors,
  });
}
