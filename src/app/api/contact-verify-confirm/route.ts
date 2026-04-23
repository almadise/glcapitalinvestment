import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceRoleClient } from '../../../lib/supabase/service';
import { escapeHtml } from '@/lib/apiSecurity';

const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/contact?error=invalid_token', req.url));
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error('[contact-verify-confirm] Supabase service client:', e);
    return NextResponse.redirect(new URL('/contact?error=server_config', req.url));
  }

  // Look up the pending verification
  const { data: pending, error: fetchError } = await supabase
    .from('contact_pending_verifications')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (fetchError || !pending) {
    return NextResponse.redirect(new URL('/contact?error=token_not_found', req.url));
  }

  // Check expiry
  if (new Date(pending.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/contact?error=token_expired', req.url));
  }

  // Mark token as used
  await supabase.from('contact_pending_verifications').update({ used: true }).eq('token', token);

  // Store verified lead in contact_submissions
  const { error: insertError } = await supabase.from('contact_submissions').insert({
    nom_complet: pending.nom_complet,
    societe: pending.societe,
    email: pending.email,
    telephone: null,
    pays: 'Non renseigné',
    montant_projet: pending.project_type,
    message: pending.message,
  });

  if (insertError) {
    console.error('[contact-verify-confirm] Insert error:', insertError.message);
  }

  // Send admin notification
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.CONTACT_EMAIL || 'glcontact@glcapitalinvestment.com';

  if (apiKey) {
    const resend = new Resend(apiKey);
    const submittedAt = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const safeNom = escapeHtml(String(pending.nom_complet || ''));
    const safeSociete = escapeHtml(String(pending.societe || ''));
    const safeEmail = escapeHtml(String(pending.email || ''));
    const safeProjectType = escapeHtml(String(pending.project_type || ''));
    const safeMessage = escapeHtml(String(pending.message || '')).replace(/\n/g, '<br/>');

    await resend.emails
      .send({
        from: EMAIL_FROM,
        to: adminEmail,
        replyTo: pending.email,
        subject: `✓ Nouveau lead vérifié - ${pending.nom_complet} (${pending.societe})`,
        html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;">
<tr><td style="background:linear-gradient(135deg,#0a1941,#0d2060);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#c9a84c;font-size:20px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
<p style="margin:4px 0 0;color:#c9a84c;font-size:10px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Nouveau lead vérifié</p>
</td></tr>
<tr><td style="background:#c9a84c;height:3px;"></td></tr>
<tr><td style="background:#fff;padding:36px 40px;border-radius:0 0 12px 12px;">
<p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">Un nouveau lead a confirmé son adresse email et a été enregistré.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
<tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;width:35%;"><span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;">Nom</span></td><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><strong style="color:#0a1941;">${safeNom}</strong></td></tr>
<tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;">Société</span></td><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><span style="color:#0a1941;">${safeSociete}</span></td></tr>
<tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;">Email</span></td><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><a href="mailto:${safeEmail}" style="color:#c9a84c;">${safeEmail}</a></td></tr>
<tr><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;">Type de projet</span></td><td style="padding:12px 20px;border-bottom:1px solid #f1f5f9;"><span style="color:#0a1941;">${safeProjectType}</span></td></tr>
<tr><td style="padding:12px 20px;vertical-align:top;"><span style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;">Message</span></td><td style="padding:12px 20px;"><p style="margin:0;color:#334155;font-size:13px;line-height:1.6;">${safeMessage}</p></td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="mailto:${safeEmail}?subject=RE: Demande GL Capital - ${safeNom}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Répondre au prospect</a>
</td></tr></table>
<p style="margin:20px 0 0;color:#94a3b8;font-size:11px;">Vérifié le : ${submittedAt}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
      .catch((e) => console.error('[contact-verify-confirm] Admin email error:', e));
  }

  return NextResponse.redirect(new URL('/contact-success', req.url));
}
