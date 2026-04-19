import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

/** Role → allowed route prefixes */
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/admin', '/client-dashboard', '/back-office-admin-panel', '/content-dashboard', '/analyst-dashboard', '/compliance-dashboard', '/client-portal-dashboard', '/dossier-submission-wizard', '/onboarding'],
  compliance: ['/compliance-dashboard', '/client-portal-dashboard'],
  analyst: ['/analyst-dashboard', '/client-portal-dashboard'],
  gestionnaire_contenu: ['/content-dashboard'],
  client: ['/client-dashboard', '/client-portal-dashboard', '/dossier-submission-wizard', '/onboarding'],
};

/** Default redirect per role when accessing a forbidden route */
const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  compliance: '/compliance-dashboard',
  analyst: '/analyst-dashboard',
  gestionnaire_contenu: '/content-dashboard',
  client: '/client-dashboard',
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Brute-force protection on auth-related paths ───────────
  const isAuthPath =
    pathname.startsWith('/sign-up-login-screen') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/');

  if (isAuthPath && request.method === 'POST') {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`auth-bf:${ip}`, RATE_LIMITS.auth);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // ── Rate limit all API routes ──────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`api:${ip}`, RATE_LIMITS.api);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMITS.api.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // ── Auth guard for protected routes ───────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // no-op: we only need to read the session here
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/sign-up-login-screen', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl, 302);
  }

  // ── Role-based route enforcement ──────────────────────────
  // Fetch the user's role from profiles (or user_profiles as fallback)
  let role: string | null = null;
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profileData?.role ?? null;

    if (!role) {
      const { data: upData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = upData?.role ?? null;
    }
  } catch {
    // If profile fetch fails, allow through — client-side RoleGuard will handle it
  }

  if (role) {
    const allowedPrefixes = ROLE_ROUTES[role] ?? [];
    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      const home = ROLE_HOME[role] ?? '/sign-up-login-screen';
      return NextResponse.redirect(new URL(home, request.url), 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client-dashboard/:path*',
    '/analyst-dashboard/:path*',
    '/compliance-dashboard/:path*',
    '/dashboard/:path*',
    '/back-office-admin-panel/:path*',
    '/content-dashboard/:path*',
    '/client-portal-dashboard/:path*',
    '/dossier-submission-wizard/:path*',
    '/onboarding/:path*',
  ],
};
