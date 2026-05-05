'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Loader2, SendHorizonal, ShieldCheck, User } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface GatewayResponse {
  success?: boolean;
  blocked?: boolean;
  reply?: string;
  error?: string;
  code?: string;
  requestId?: string;
}

const QUICK_PROMPTS = {
  fr: [
    'Quels documents KYC sont requis pour un dossier entreprise ?',
    'Comment améliorer la bancabilité de mon projet ?',
    'Différence entre SBLC et BG dans notre contexte ?',
  ],
  en: [
    'Which KYC documents are required for a company file?',
    'How can I improve my project bankability?',
    'Difference between SBLC and BG in our context?',
  ],
};

export default function ClientAiAssistantPage() {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        lang === 'fr'
          ? 'Bienvenue. Je suis votre assistant institutionnel GL Capital. Je traite uniquement les sujets de structuration de dossiers, conformité KYC/AML, instruments bancaires et soumission institutionnelle.'
          : 'Welcome. I am your GL Capital institutional assistant. I only handle dossier structuring, KYC/AML compliance, bank instruments and institutional submission topics.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  const labels = useMemo(
    () => ({
      title: lang === 'fr' ? 'Assistant IA Institutionnel' : 'Institutional AI Assistant',
      subtitle:
        lang === 'fr'
          ? 'Assistant spécialisé GL Capital, limité au domaine financement, conformité et documentation.'
          : 'GL Capital specialized assistant, limited to financing, compliance and documentation.',
      placeholder:
        lang === 'fr'
          ? 'Posez une question sur un dossier, le KYC/AML ou les instruments bancaires...'
          : 'Ask about a file, KYC/AML, or bank instruments...',
      send: lang === 'fr' ? 'Envoyer' : 'Send',
      policy:
        lang === 'fr'
          ? 'Champ couvert: structuration, conformité, instruments bancaires, workflow institutionnel.'
          : 'Covered scope: structuring, compliance, bank instruments, institutional workflow.',
      disclaimer:
        lang === 'fr'
          ? "GL Capital n'exécute pas de transactions financières et ne garantit pas l'approbation d'un dossier."
          : 'GL Capital does not execute financial transactions and does not guarantee dossier approval.',
      blockedLabel:
        lang === 'fr'
          ? 'Demande hors domaine detectee. Reformulez sur un sujet GL Capital.'
          : 'Out-of-scope request detected. Please ask about GL Capital domain topics.',
    }),
    [lang]
  );

  function mapGatewayError(code?: string, fallback?: string): string {
    if (lang === 'fr') {
      if (code === 'RATE_LIMITED') return 'Trop de requetes. Merci de patienter quelques instants.';
      if (code === 'MISSING_MESSAGE')
        return 'Votre message est vide. Merci de saisir une question.';
      if (code === 'INVALID_JSON') return 'Requete invalide. Merci de reessayer.';
      if (code === 'PROVIDER_ERROR' || code === 'EMPTY_PROVIDER_RESPONSE')
        return 'Le service IA est temporairement indisponible. Merci de reessayer sous peu.';
      if (code === 'MISSING_PROVIDER_CONFIG')
        return 'Configuration IA incomplète. Merci de contacter un administrateur.';
      return fallback || 'Erreur inattendue du service IA.';
    }
    if (code === 'RATE_LIMITED') return 'Too many requests. Please wait a moment.';
    if (code === 'MISSING_MESSAGE') return 'Your message is empty. Please enter a question.';
    if (code === 'INVALID_JSON') return 'Invalid request. Please retry.';
    if (code === 'PROVIDER_ERROR' || code === 'EMPTY_PROVIDER_RESPONSE')
      return 'AI service is temporarily unavailable. Please retry shortly.';
    if (code === 'MISSING_PROVIDER_CONFIG')
      return 'AI configuration is incomplete. Contact an administrator.';
    return fallback || 'Unexpected AI service error.';
  }

  const sendMessage = async (messageText: string) => {
    const message = messageText.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          lang,
        }),
      });

      const data = (await res.json()) as GatewayResponse;
      if (data.requestId) setLastRequestId(data.requestId);

      if (!res.ok || !data.success) {
        throw new Error(mapGatewayError(data.code, data.error));
      }

      if (data.blocked) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply || labels.blockedLabel },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || (lang === 'fr' ? 'Réponse vide.' : 'Empty response.'),
        },
      ]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : lang === 'fr'
            ? 'Erreur inattendue.'
            : 'Unexpected error.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">{labels.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{labels.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <section className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50">
            <Bot size={16} className="text-navy" />
            <p className="text-xs sm:text-sm font-semibold text-navy">{labels.policy}</p>
          </div>

          <div className="h-[52vh] overflow-y-auto px-4 sm:px-5 py-4 space-y-3 bg-white">
            {messages.map((messageItem, index) => {
              const isAssistant = messageItem.role === 'assistant';
              return (
                <div
                  key={`msg-${index}`}
                  className={`flex items-start gap-2.5 ${isAssistant ? '' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center flex-shrink-0">
                      <Bot size={14} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-navy text-white'
                    }`}
                  >
                    {messageItem.content}
                  </div>
                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-full bg-gold text-navy flex items-center justify-center flex-shrink-0">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin" />
                {lang === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3 sm:p-4 bg-white">
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            {lastRequestId && (
              <p className="text-[11px] text-slate-400 mb-2">
                Request ID: <span className="font-mono">{lastRequestId}</span>
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={labels.placeholder}
                rows={2}
                maxLength={1200}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <SendHorizonal size={14} />
                )}
                {labels.send}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {lang === 'fr' ? 'Cadre institutionnel' : 'Institutional policy'}
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{labels.disclaimer}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {lang === 'fr' ? 'Questions suggérées' : 'Suggested prompts'}
            </p>
            <div className="space-y-2">
              {(lang === 'fr' ? QUICK_PROMPTS.fr : QUICK_PROMPTS.en).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-xs text-slate-600 hover:text-navy border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
