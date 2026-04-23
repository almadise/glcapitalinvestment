/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding window algorithm per IP address.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
      }
    },
    5 * 60 * 1000
  );
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

/**
 * Check rate limit for a given identifier (IP or user ID).
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const key = identifier;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: now + windowMs,
      retryAfter: 0,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    retryAfter: 0,
  };
}

/**
 * Extract client IP from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// Preset configs
export const RATE_LIMITS = {
  /** Contact form: 5 submissions per 10 minutes */
  contactForm: { limit: 5, windowSec: 600 },
  /** Auth endpoints: 10 attempts per 15 minutes */
  auth: { limit: 10, windowSec: 900 },
  /** General API: 60 requests per minute */
  api: { limit: 60, windowSec: 60 },
  /** Email sending: 3 per 5 minutes */
  email: { limit: 3, windowSec: 300 },
} satisfies Record<string, RateLimitConfig>;
