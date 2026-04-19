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

  const cookies = request.cookies.getAll().map((c) => ({
    name: c.name,
    value: c.name.toLowerCase().includes('token') ? '[REDACTED]' : c.value,
  }));

  const payload = {
    timestamp: new Date().toISOString(),
    middleware_matcher: [
      '/admin/:path*',
      '/client-dashboard/:path*',
      '/analyst-dashboard/:path*',
      '/compliance-dashboard/:path*',
      '/dashboard/:path*',
    ],
    session: session
      ? {
          access_token: '[REDACTED]',
          token_type: session.token_type,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          user_id: session.user?.id ?? null,
        }
      : null,
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        }
      : null,
    auth_error: error ? { message: error.message, status: error.status } : null,
    cookies_present: cookies,
    is_authenticated: !!user,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
