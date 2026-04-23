import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

/** Role → allowed route prefixes */
const ROLE_ROUTES: Record<string, string[]> = {
  admin: [
    '/admin',
    '/client-dashboard',
    '/back-office-admin-panel',
    '/content-dashboard',
    '/analyst-dashboard',
    '/compliance-dashboard',
    '/client-portal-dashboard',
    '/dossier-submission-wizard',
    '/onboarding',
  ],
  compliance: ['/compliance-dashboard', '/client-portal-dashboard'],
  analyst: ['/analyst-dashboard', '/client-portal-dashboard'],
  gestionnaire_contenu: ['/content-dashboard'],
  client: [
    '/client-dashboard',
    '/client-portal-dashboard',
    '/dossier-submission-wizard',
    '/onboarding',
  ],
};

/** Default redirect per role when accessing a forbidden route */
const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  compliance: '/compliance-dashboard',
  analyst: '/analyst-dashboard',
  gestionnaire_contenu: '/content-dashboard',
  client: '/client-dashboard',
};

function logMiddlewareAuthError(err: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[middleware] Supabase auth check failed:', err);
  }
}

const AUTH_RETRY_ATTEMPTS = 2;
const AUTH_RETRY_DELAY_MS = 120;

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Conserve les cookies de session (p.ex. après refresh) sur une réponse de redirection. */
function copySupabaseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, cookie);
  });
}

async function getUserWithRetry(
  getUser: () => Promise<{ data: { user: { id: string } | null } }>
): Promise<{ user: { id: string } | null; ok: boolean }> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= AUTH_RETRY_ATTEMPTS; attempt++) {
    try {
      const {
        data: { user },
      } = await getUser();
      return { user: user ?? null, ok: true };
    } catch (err) {
      lastError = err;
      if (attempt < AUTH_RETRY_ATTEMPTS) {
        await delay(AUTH_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  logMiddlewareAuthError(lastError);
  return { user: null, ok: false };
}

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

  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/client-dashboard') ||
    pathname.startsWith('/analyst-dashboard') ||
    pathname.startsWith('/compliance-dashboard') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/back-office-admin-panel') ||
    pathname.startsWith('/content-dashboard') ||
    pathname.startsWith('/client-portal-dashboard') ||
    pathname.startsWith('/dossier-submission-wizard') ||
    pathname.startsWith('/onboarding');

  // Public/auth/api paths only need lightweight middleware checks above.
  if (!isProtectedRoute) {
    return NextResponse.next({ request });
  }

  // ── Auth guard for protected routes ───────────────────────
  // Important : setAll doit écrire les cookies sur la réponse (voir doc Supabase SSR).
  // Sinon le refresh ne met pas à jour les cookies → jetons désynchronisés / erreurs refresh côté client.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          if (cacheHeaders && typeof cacheHeaders === 'object') {
            Object.entries(cacheHeaders).forEach(([key, value]) => {
              if (typeof value === 'string') {
                supabaseResponse.headers.set(key, value);
              }
            });
          }
        },
      },
    }
  );

  const authResult = await getUserWithRetry(() => supabase.auth.getUser());
  const user = authResult.user;
  const authCheckOk = authResult.ok;

  // If auth backend is temporarily unreachable, avoid false redirects.
  if (!authCheckOk) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/sign-up-login-screen', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    const redirect = NextResponse.redirect(loginUrl, 302);
    copySupabaseCookies(supabaseResponse, redirect);
    return redirect;
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
    // If profile fetch fails, allow through - client-side RoleGuard will handle it
  }

  if (role) {
    const allowedPrefixes = ROLE_ROUTES[role] ?? [];
    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      const home = ROLE_HOME[role] ?? '/sign-up-login-screen';
      const redirect = NextResponse.redirect(new URL(home, request.url), 302);
      copySupabaseCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/sign-up-login-screen/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/auth/:path*',
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
