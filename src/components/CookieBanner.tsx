'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gl_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gl_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('gl_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[9999] shadow-2xl"
      style={{ background: '#1E2D4A', borderTop: '1px solid rgba(184,145,42,0.3)' }}
    >
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: '#B8912A' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-white/80 leading-relaxed">
            Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic.{' '}
            <Link
              href="/cookies"
              className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 rounded"
              style={{ color: '#B8912A' }}
            >
              En savoir plus
            </Link>{' '}
            sur notre utilisation des cookies et notre{' '}
            <Link
              href="/politique-confidentialite"
              className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 rounded"
              style={{ color: '#B8912A' }}
            >
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-white/70 border border-white/20 rounded-lg hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: '#B8912A', color: '#FFFFFF' }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
