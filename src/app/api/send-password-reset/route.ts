import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { ensureTrustedUrl } from '@/lib/apiSecurity';
import { RESEND_FROM_FALLBACK } from '@/lib/companyContact';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

function buildPasswordResetHtml(params: {
  email: string;
  resetUrl: string;
  lang: 'fr' | 'en';
}): string {
  const { email, resetUrl, lang } = params;
  const isFr = lang === 'fr';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${isFr ? 'Réinitialisation de mot de passe - GL Capital' : 'Password Reset - GL Capital'}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">🔐 ${isFr ? 'Réinitialisation de mot de passe' : 'Password Reset'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? 'Bonjour,' : 'Hello,'}</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
            ${
              isFr
                ? 'Vous avez demandé la réinitialisation de votre mot de passe GL Capital. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.'
                : 'You requested a password reset for your GL Capital account. Click the button below to choose a new password.'
            }
          </p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Adresse email' : 'Email address'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:600;">${email}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${resetUrl}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:16px 36px;border-radius:10px;text-decoration:none;">
            ${isFr ? 'Réinitialiser mon mot de passe' : 'Reset my password'}
          </a>
        </td></tr>
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
            ${
              isFr
                ? "Ce lien est valable 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email."
                : 'This link is valid for 1 hour. If you did not request this reset, please ignore this email.'
            }
          </p>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${isFr ? 'Email automatique de sécurité.' : 'Automated security email.'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`send-password-reset:${ip}`, RATE_LIMITS.email);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  let body: { email: string; resetUrl?: string; lang?: 'fr' | 'en' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { email, resetUrl, lang = 'fr' } = body;
  if (!email) {
    return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
  }
  const safeResetUrl = ensureTrustedUrl(resetUrl, SITE_URL, '/reset-password');

  const resend = new Resend(apiKey);
  const subject =
    lang === 'fr' ? 'Réinitialisation de mot de passe - GL Capital' : 'Password Reset - GL Capital';
  const html = buildPasswordResetHtml({ email, resetUrl: safeResetUrl, lang });

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [email],
        subject,
        html,
      });
      return NextResponse.json({ success: true });
    } catch (fallbackErr: any) {
      return NextResponse.json({ success: false, error: fallbackErr.message }, { status: 500 });
    }
  }
}
