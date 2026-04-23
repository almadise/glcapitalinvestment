import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '../../../lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../../../lib/rateLimit';
import { escapeHtml } from '@/lib/apiSecurity';

const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'GL Capital <glcontact@glcapitalinvestment.com>';

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact:${ip}`, RATE_LIMITS.contactForm);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMITS.contactForm.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      }
    );
  }
  // ── End rate limiting ──────────────────────────────────────

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('[send-contact] RESEND_API_KEY is not set');
    return NextResponse.json(
      { success: false, error: 'RESEND_API_KEY manquante' },
      { status: 500 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch (parseErr) {
    console.error('[send-contact] Failed to parse request body:', parseErr);
    return NextResponse.json(
      { success: false, error: 'Corps de requête invalide' },
      { status: 400 }
    );
  }

  const { nomComplet, societe, email, telephone, pays, montantProjet, message } = body;

  if (!nomComplet || !societe || !email || !pays || !montantProjet || !message) {
    console.warn('[send-contact] Missing required fields');
    return NextResponse.json(
      { success: false, error: 'Champs obligatoires manquants' },
      { status: 400 }
    );
  }

  const safeNomComplet = escapeHtml(nomComplet);
  const safeSociete = escapeHtml(societe);
  const safeEmail = escapeHtml(email);
  const safeTelephone = telephone ? escapeHtml(telephone) : '';
  const safePays = escapeHtml(pays);
  const safeMontantProjet = escapeHtml(montantProjet);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  // Save to Supabase
  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('contact_submissions').insert({
      nom_complet: nomComplet,
      societe,
      email,
      telephone: telephone || null,
      pays,
      montant_projet: montantProjet,
      message,
    });
    if (dbError) {
      console.error('[send-contact] Supabase insert error:', dbError.message);
    } else {
      console.log('[send-contact] Submission saved to database.');
    }
  } catch (dbErr) {
    console.error('[send-contact] Unexpected DB error:', dbErr);
  }

  const to = process.env.CONTACT_EMAIL || 'glcontact@glcapitalinvestment.com';

  const submittedAt = new Date().toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau dossier GL Capital</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:6px;">
                    <div style="display:inline-block;width:48px;height:2px;background:#c9a84c;margin-bottom:16px;"></div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
                    <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px;">
                    <div style="display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
                      <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Nouveau Dossier Reçu</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold divider -->
          <tr>
            <td style="background:#c9a84c;height:3px;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">

              <!-- Intro -->
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
                Un nouveau dossier de financement a été soumis via le portail GL Capital. Veuillez trouver ci-dessous les informations du prospect.
              </p>

              <!-- Section: Identité -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:10px;">
                    <span style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border-radius:4px;">Identité du Prospect</span>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;width:38%;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Nom complet</span>
                        </td>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#0a1941;font-size:14px;font-weight:600;">${safeNomComplet}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Société</span>
                        </td>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#0a1941;font-size:14px;font-weight:600;">${safeSociete}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Email</span>
                        </td>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <a href="mailto:${safeEmail}" style="color:#c9a84c;font-size:14px;font-weight:600;text-decoration:none;">${safeEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Téléphone</span>
                        </td>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#0a1941;font-size:14px;">${safeTelephone || '<em style="color:#94a3b8;">Non renseigné</em>'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Pays</span>
                        </td>
                        <td style="padding:14px 20px;">
                          <span style="color:#0a1941;font-size:14px;font-weight:600;">${safePays}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section: Projet -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:10px;">
                    <span style="display:inline-block;background:#0a1941;color:#c9a84c;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border-radius:4px;">Détails du Projet</span>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;width:38%;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Montant</span>
                        </td>
                        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;">
                          <span style="color:#c9a84c;font-size:15px;font-weight:700;">${safeMontantProjet}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px;vertical-align:top;">
                          <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Message</span>
                        </td>
                        <td style="padding:14px 20px;">
                          <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">${safeMessage}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${safeEmail}?subject=RE: Dossier GL Capital - ${safeNomComplet} (${safeSociete})"
                       style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">
                      Répondre au prospect
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Metadata -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">
                      <strong style="color:#64748b;">Soumis le :</strong> ${submittedAt} (heure de Paris)
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
              <p style="margin:0;color:#475569;font-size:11px;">Ce message est confidentiel et destiné exclusivement à son destinataire.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: email,
      subject: `Nouveau dossier GL Capital - ${nomComplet} (${societe}) · ${montantProjet}`,
      html,
    });

    if (error) {
      console.error('[send-contact] Resend API error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ success: false, error: error.message }, { status: 422 });
    }

    console.log('[send-contact] Email sent successfully. ID:', data?.id);
    return NextResponse.json({ success: true, id: data?.id }, { status: 200 });
  } catch (sendErr) {
    console.error('[send-contact] Unexpected error during send:', sendErr);
    return NextResponse.json(
      { success: false, error: "Erreur inattendue lors de l'envoi" },
      { status: 500 }
    );
  }
}
