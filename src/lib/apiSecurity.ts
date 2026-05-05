import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

type GuardResult =
  | { ok: true; userId: string; userEmail: string }
  | { ok: false; response: NextResponse };

export async function requireInternalApiAccess(
  req: NextRequest,
  scope: string
): Promise<GuardResult> {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`${scope}:${ip}`, RATE_LIMITS.email);
  if (!rl.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true, userId: user.id, userEmail: user.email ?? 'system' };
}

export function ensureTrustedUrl(
  candidateUrl: string | undefined,
  siteUrl: string,
  fallbackPath: string
): string {
  const fallback = new URL(fallbackPath, siteUrl).toString();
  if (!candidateUrl) return fallback;

  try {
    const candidate = new URL(candidateUrl);
    const trustedOrigin = new URL(siteUrl).origin;
    return candidate.origin === trustedOrigin ? candidate.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
