import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../../../lib/rateLimit';
import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital9393.builtwithrocket.new';

function buildSignupConfirmationHtml(params: {
  email: string;
  fullName: string;
  confirmationUrl: string;
  lang: 'fr' | 'en';
}): string {
  const { email, fullName, confirmationUrl, lang } = params;
  const isFr = lang === 'fr';

  const subject = isFr
    ? 'Confirmez votre adresse email — GL Capital' :'Confirm your email address — GL Capital';

  const greeting = isFr ? `Bonjour ${fullName || 'cher client'},` : `Hello ${fullName || 'there'},`;
  const intro = isFr
    ? 'Merci de vous être inscrit sur le portail GL Capital. Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.' :'Thank you for registering on the GL Capital portal. To activate your account, please confirm your email address by clicking the button below.';
  const ctaText = isFr ? 'Confirmer mon adresse email' : 'Confirm my email address';
  const expiryNote = isFr
    ? 'Ce lien est valable 24 heures. Si vous n\'avez pas créé de compte GL Capital, ignorez cet email.' :'This link is valid for 24 hours. If you did not create a GL Capital account, please ignore this email.';
  const footerNote = isFr
    ? 'GL Capital Investment SA — Portail sécurisé de gestion de dossiers'
    : 'GL Capital Investment SA — Secure case management portal';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">✉️ ${isFr ? 'Vérification d\'email' : 'Email Verification'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px 40px 0;">
          <p style="margin:0 0 8px;color:#0a1941;font-size:16px;font-weight:600;">${greeting}</p>
          <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">${intro}</p>
        </td></tr>
        <!-- Email display -->
        <tr><td style="background:#ffffff;padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Adresse email' : 'Email address'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:600;">${email}</p>
            </td></tr>
          </table>
        </td></tr>
        <!-- CTA -->
        <tr><td style="background:#ffffff;padding:0 40px 36px;text-align:center;">
          <a href="${confirmationUrl}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:16px 36px;border-radius:10px;text-decoration:none;">${ctaText}</a>
        </td></tr>
        <!-- Expiry note -->
        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">${expiryNote}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
          <p style="margin:0;color:#475569;font-size:11px;">${footerNote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  // Rate limit email sending
  const ip = getClientIp(req);
  const rl = checkRateLimit(`send-signup:${ip}`, RATE_LIMITS.email);
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

  let body: {
    email: string;
    fullName?: string;
    confirmationUrl: string;
    lang?: 'fr' | 'en';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { email, fullName = '', confirmationUrl, lang = 'fr' } = body;

  if (!email || !confirmationUrl) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const subject = lang === 'fr' ?'Confirmez votre adresse email — GL Capital' :'Confirm your email address — GL Capital';

  const html = buildSignupConfirmationHtml({ email, fullName, confirmationUrl, lang });

  try {
    await resend.emails.send({
      from: 'GL Capital <noreply@glcapital.com>',
      to: [email],
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch {
    // Fallback to onboarding@resend.dev if custom domain not verified
    try {
      await resend.emails.send({
        from: 'GL Capital <onboarding@resend.dev>',
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
