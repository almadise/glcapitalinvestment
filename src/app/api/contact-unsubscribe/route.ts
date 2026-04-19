import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Corps de requête invalide' }, { status: 400 });
  }

  const { email } = body;
  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Adresse email invalide' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from('contact_unsubscribes').upsert(
    { email: email.toLowerCase().trim(), unsubscribed_at: new Date().toISOString() },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('[contact-unsubscribe] DB error:', error.message);
    return NextResponse.json({ success: false, error: 'Erreur base de données' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
