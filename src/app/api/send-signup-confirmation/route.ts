import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../../../lib/rateLimit';
import { Resend } from 'resend';
import { ensureTrustedUrl } from '@/lib/apiSecurity';
import { RESEND_FROM_FALLBACK, getPublicSiteUrl } from '@/lib/companyContact';

const SITE_URL = getPublicSiteUrl();
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL?.trim() || RESEND_FROM_FALLBACK;

function getResendErrorMessage(result: unknown): string | null {
  const err = (result as any)?.error;
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err?.message === 'string') return err.message;
  return 'Unknown Resend error';
}

function getResendMessageId(result: unknown): string | null {
  return ((result as any)?.data?.id || (result as any)?.id || null) as string | null;
}

function buildSignupConfirmationHtml(params: {
  email: string;
  fullName: string;
  confirmationUrl: string;
  lang: 'fr' | 'en';
}): string {
  const { email, fullName, confirmationUrl, lang } = params;
  const isFr = lang === 'fr';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"/><title>Bienvenue sur GL Capital</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">🎉 ${isFr ? 'Bienvenue' : 'Welcome'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#fff;padding:40px;">
          <p style="margin:0 0 16px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${fullName || 'cher client'},` : `Hello ${fullName || 'there'},`}</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${isFr ? 'Bienvenue sur le portail GL Capital. Votre compte a été créé avec succès. Pour activer votre accès, veuillez confirmer votre adresse email.' : 'Welcome to the GL Capital portal. Your account has been successfully created. To activate your access, please confirm your email address.'}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Adresse email' : 'Email address'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:600;">${email}</p>
            </td></tr>
          </table>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${confirmationUrl}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:16px 36px;border-radius:10px;text-decoration:none;">${isFr ? 'Confirmer mon email' : 'Confirm my email'}</a>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">${isFr ? 'Ce lien est valable 24 heures.' : 'This link is valid for 24 hours.'}</p>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
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
  const safeConfirmationUrl = ensureTrustedUrl(confirmationUrl, SITE_URL, '/auth/callback');

  const resend = new Resend(apiKey);
  const subject =
    lang === 'fr'
      ? 'Confirmez votre adresse email - GL Capital'
      : 'Confirm your email address - GL Capital';

  const html = buildSignupConfirmationHtml({
    email,
    fullName,
    confirmationUrl: safeConfirmationUrl,
    lang,
  });

  try {
    console.info(
      '[EMAIL_AUDIT]',
      JSON.stringify({
        event: 'signup_confirmation_preview_send_attempt',
        email,
        from: EMAIL_FROM,
      })
    );

    const sendResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject,
      html,
    });

    const sendError = getResendErrorMessage(sendResult);
    if (sendError) {
      throw new Error(sendError);
    }

    console.info(
      '[EMAIL_AUDIT]',
      JSON.stringify({
        event: 'signup_confirmation_preview_send_success',
        email,
        messageId: getResendMessageId(sendResult),
        from: EMAIL_FROM,
      })
    );
    return NextResponse.json({ success: true });
  } catch (sendErr: any) {
    console.error(
      '[EMAIL_AUDIT]',
      JSON.stringify({
        event: 'signup_confirmation_preview_send_failed',
        email,
        reason: sendErr?.message || 'unknown',
        from: EMAIL_FROM,
      })
    );
    return NextResponse.json(
      { success: false, error: sendErr?.message || 'Email send failed' },
      { status: 500 }
    );
  }
}
