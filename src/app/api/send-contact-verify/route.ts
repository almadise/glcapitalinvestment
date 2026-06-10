import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceRoleClient } from '../../../lib/supabase/service';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../../../lib/rateLimit';
import { resolveDevOrSandboxRecipient } from '@/lib/resendRecipients';
import {
  getPublicSiteUrl,
  OFFICIAL_PUBLIC_EMAIL,
  RESEND_FROM_FALLBACK,
  TRANSACTIONAL_EMAIL_FOOTER_LINE,
} from '@/lib/companyContact';

const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact-verify:${ip}`, RATE_LIMITS.contactForm);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  // ── End rate limiting ──────────────────────────────────────

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'RESEND_API_KEY manquante' },
      { status: 500 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Corps de requête invalide' },
      { status: 400 }
    );
  }

  const { nomComplet, societe, email, projectType, message } = body;

  if (!nomComplet || !societe || !email || !projectType || !message) {
    return NextResponse.json(
      { success: false, error: 'Champs obligatoires manquants' },
      { status: 400 }
    );
  }

  // Generate a secure token
  const token = crypto.randomUUID() + '-' + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error('[send-contact-verify] Supabase service client:', e);
    return NextResponse.json(
      { success: false, error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY)' },
      { status: 500 }
    );
  }

  // Store pending submission (RLS: service_role only sur cette table)
  const { error: dbError } = await supabase.from('contact_pending_verifications').insert({
    nom_complet: nomComplet,
    societe,
    email,
    project_type: projectType,
    message,
    token,
    expires_at: expiresAt,
  });

  if (dbError) {
    console.error('[send-contact-verify] DB insert error:', dbError.message);
    return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 });
  }

  const siteUrl = getPublicSiteUrl();
  const verifyUrl = `${siteUrl}/contact/verify?token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmez votre demande - GL Capital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
              <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
            </td>
          </tr>
          <tr><td style="background:#c9a84c;height:3px;"></td></tr>
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
              <h2 style="margin:0 0 16px;color:#0a1941;font-size:20px;font-weight:700;">Confirmez votre demande de contact</h2>
              <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.7;">
                Bonjour <strong>${nomComplet}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
                Nous avons bien reçu votre demande de contact pour <strong>${societe}</strong>. Pour finaliser votre demande et protéger vos données, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:14px;font-weight:700;letter-spacing:1px;padding:16px 36px;border-radius:8px;text-decoration:none;">
                      ✓ Confirmer mon adresse email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Ce lien est valable 24 heures. Si vous n'avez pas soumis cette demande, ignorez cet email.</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;word-break:break-all;">Lien : ${verifyUrl}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">${TRANSACTIONAL_EMAIL_FOOTER_LINE}</p>
              <p style="margin:8px 0 0;text-align:center;">
                <a href="${siteUrl}/contact/unsubscribe?email=${encodeURIComponent(email)}" style="color:#94a3b8;font-size:11px;">Se désabonner des communications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const resend = new Resend(apiKey);
  const isProduction = process.env.NODE_ENV === 'production';
  const {
    to: recipientEmail,
    redirected,
    configError,
  } = resolveDevOrSandboxRecipient({
    productionRecipient: email,
    fromAddress: EMAIL_FROM,
    isProduction,
  });

  if (configError) {
    console.error('[send-contact-verify]', configError);
    return NextResponse.json({ success: false, error: configError }, { status: 503 });
  }

  if (!isProduction && redirected) {
    console.info(
      `[send-contact-verify] Mode dev actif: envoi adressé à ${recipientEmail} (demandeur du formulaire : ${email})`
    );
  }

  try {
    const replyTo =
      process.env.RESEND_REPLY_TO?.trim() ||
      process.env.CONTACT_EMAIL?.trim() ||
      OFFICIAL_PUBLIC_EMAIL;

    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      replyTo,
      subject: 'Confirmez votre demande - GL Capital Investment SA',
      html,
    });

    if (sendError) {
      console.error('[send-contact-verify] Resend error:', sendError);
      return NextResponse.json({ success: false, error: sendError.message }, { status: 422 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[send-contact-verify] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Erreur inattendue' }, { status: 500 });
  }
}
