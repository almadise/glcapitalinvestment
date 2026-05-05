import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { requireInternalApiAccess } from '@/lib/apiSecurity';
import { buildSystemPrompt, guardDomain } from '@/lib/ai/gateway';

interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GatewayPayload {
  message?: string;
  history?: GatewayMessage[];
  lang?: 'fr' | 'en';
}

interface GatewayErrorBody {
  success: false;
  error: string;
  code: string;
  requestId: string;
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.AI_GATEWAY_BASE_URL || 'https://api.openai.com/v1').trim();
  const model = (process.env.AI_GATEWAY_MODEL || 'gpt-4o-mini').trim();
  return { apiKey, baseUrl, model };
}

function sanitizeHistory(history: GatewayMessage[] | undefined): GatewayMessage[] {
  if (!history || !Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: String(item.content || '').slice(0, 1500),
    }));
}

function errorResponse(
  requestId: string,
  status: number,
  code: string,
  error: string,
  headers?: Record<string, string>
) {
  return NextResponse.json<GatewayErrorBody>(
    { success: false, error, code, requestId },
    { status, headers: { ...headers, 'X-Request-Id': requestId } }
  );
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  const access = await requireInternalApiAccess(req, 'ai-gateway');
  if (!access.ok) {
    console.warn(`[ai-gateway][${requestId}] Unauthorized internal API access`);
    return access.response;
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(`ai-gateway:${ip}`, { limit: 20, windowSec: 60 });
  if (!rl.success) {
    return errorResponse(requestId, 429, 'RATE_LIMITED', 'Trop de requetes. Veuillez ralentir.', {
      'Retry-After': String(rl.retryAfter),
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '0',
    });
  }

  let payload: GatewayPayload;
  try {
    payload = (await req.json()) as GatewayPayload;
  } catch {
    return errorResponse(requestId, 400, 'INVALID_JSON', 'Corps de requete JSON invalide.');
  }

  const message = payload.message?.trim() || '';
  const lang = payload.lang === 'en' ? 'en' : 'fr';
  if (!message) {
    return errorResponse(requestId, 400, 'MISSING_MESSAGE', 'Le champ "message" est requis.');
  }

  const domainCheck = guardDomain(message);
  if (!domainCheck.allowed) {
    return NextResponse.json(
      {
        success: true,
        blocked: true,
        reply: domainCheck.reason,
        requestId,
      },
      { status: 200, headers: { 'X-Request-Id': requestId } }
    );
  }

  const { apiKey, baseUrl, model } = getOpenAIConfig();
  if (!apiKey) {
    return errorResponse(
      requestId,
      500,
      'MISSING_PROVIDER_CONFIG',
      'Configuration manquante: OPENAI_API_KEY.'
    );
  }

  const messages: GatewayMessage[] = [
    { role: 'system', content: buildSystemPrompt(lang) },
    ...sanitizeHistory(payload.history),
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ai-gateway][${requestId}] Provider error`, {
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        body: errorText,
      });
      return errorResponse(
        requestId,
        502,
        'PROVIDER_ERROR',
        'Le fournisseur IA a retourne une erreur.'
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return errorResponse(requestId, 502, 'EMPTY_PROVIDER_RESPONSE', 'Reponse IA vide.');
    }

    console.info(`[ai-gateway][${requestId}] Completed`, {
      userId: access.userId,
      model,
      blocked: false,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        success: true,
        blocked: false,
        model,
        reply,
        requestId,
        meta: {
          remaining: rl.remaining,
          policy: 'gl-capital-domain-only',
          userId: access.userId,
        },
      },
      { headers: { 'X-Request-Id': requestId } }
    );
  } catch (error) {
    console.error(`[ai-gateway][${requestId}] Unexpected error`, {
      elapsedMs: Date.now() - startedAt,
      error,
    });
    return errorResponse(
      requestId,
      500,
      'UNEXPECTED_GATEWAY_ERROR',
      'Erreur inattendue du gateway IA.'
    );
  }
}
