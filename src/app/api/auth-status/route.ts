import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  // Rate limit auth-status checks
  const ip = getClientIp(request);
  const rl = checkRateLimit(`auth-status:${ip}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const payload = {
    is_authenticated: !!user,
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
    session: session
      ? {
          expires_at: session.expires_at,
          expires_in: session.expires_in,
        }
      : null,
    auth_error: error ? { message: error.message, status: error.status } : null,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
