import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../lib/supabase/service';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact-unsubscribe:${ip}`, RATE_LIMITS.contactForm);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Corps de requête invalide' },
      { status: 400 }
    );
  }

  const { email } = body;
  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Adresse email invalide' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error('[contact-unsubscribe] Supabase service client:', e);
    return NextResponse.json(
      { success: false, error: 'Configuration serveur incomplète' },
      { status: 500 }
    );
  }

  const { error } = await supabase
    .from('contact_unsubscribes')
    .upsert(
      { email: email.toLowerCase().trim(), unsubscribed_at: new Date().toISOString() },
      { onConflict: 'email' }
    );

  if (error) {
    console.error('[contact-unsubscribe] DB error:', error.message);
    return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
