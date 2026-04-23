import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'error' | 'warn' | 'info';

interface LogPayload {
  level: LogLevel;
  message: string;
  stack?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

async function logToSupabase(payload: LogPayload) {
  try {
    const supabase = createClient();
    await supabase.from('error_logs').insert({
      level: payload.level,
      message: payload.message,
      stack: payload.stack || null,
      url: payload.url || (typeof window !== 'undefined' ? window.location.href : null),
      user_id: payload.userId || null,
      metadata: payload.metadata || null,
    });
  } catch {
    // Silently fail - never throw from logger
  }
}

export const logger = {
  error(message: string, options?: Omit<LogPayload, 'level' | 'message'>) {
    console.error('[GL Capital Error]', message, options);
    logToSupabase({ level: 'error', message, ...options });
  },
  warn(message: string, options?: Omit<LogPayload, 'level' | 'message'>) {
    console.warn('[GL Capital Warn]', message, options);
    logToSupabase({ level: 'warn', message, ...options });
  },
  info(message: string, options?: Omit<LogPayload, 'level' | 'message'>) {
    console.info('[GL Capital Info]', message, options);
    logToSupabase({ level: 'info', message, ...options });
  },
};

export function captureError(error: unknown, context?: Record<string, any>) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(err.message, {
    stack: err.stack,
    metadata: context,
  });
}
