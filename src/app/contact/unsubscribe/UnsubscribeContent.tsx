/* eslint-disable react/no-unescaped-entities */
'use client';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { OFFICIAL_PUBLIC_EMAIL } from '@/lib/companyContact';

export default function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Une erreur est survenue.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erreur réseau. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-500" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-navy mb-2">
              Désabonnement confirmé
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              L'adresse <strong className="text-slate-700">{email}</strong> a été retirée de nos
              listes de communication.
            </p>
            <Link
              href="/home-page"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Retour à l'accueil
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <MailX size={32} className="text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-navy mb-2">Se désabonner</h1>
            <p className="text-slate-500 text-sm mb-6">
              Entrez votre adresse email pour vous désabonner de toutes les communications de GL
              Capital Investment SA.
            </p>

            <form onSubmit={handleUnsubscribe} className="text-left" noValidate>
              <div className="flex flex-col gap-2 mb-4">
                <label
                  htmlFor="unsub-email"
                  className="text-xs font-semibold text-slate-600 uppercase tracking-widest"
                >
                  Adresse email
                </label>
                <input
                  id="unsub-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-navy text-sm placeholder-slate-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                />
              </div>

              {errorMsg && (
                <div
                  className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
                  role="alert"
                >
                  <AlertCircle
                    size={16}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Traitement…
                  </>
                ) : (
                  'Confirmer le désabonnement'
                )}
              </button>
            </form>

            <p className="text-slate-400 text-xs mt-4">
              Vous pouvez toujours nous contacter directement à{' '}
              <a href={`mailto:${OFFICIAL_PUBLIC_EMAIL}`} className="text-gold hover:underline">
                {OFFICIAL_PUBLIC_EMAIL}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
