'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Lien de vérification invalide ou manquant.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/contact-verify-confirm?token=${encodeURIComponent(token)}`);
        if (res?.redirected || res?.ok) {
          setStatus('success');
          setTimeout(() => router?.push('/contact-success'), 2000);
        } else {
          setStatus('error');
          setErrorMsg('Ce lien est invalide ou a déjà été utilisé.');
        }
      } catch {
        setStatus('error');
        setErrorMsg('Une erreur réseau est survenue. Veuillez réessayer.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="text-gold animate-spin mx-auto mb-4" aria-hidden="true" />
            <h1 className="font-display text-xl font-bold text-navy mb-2">
              Vérification en cours…
            </h1>
            <p className="text-slate-500 text-sm">
              Veuillez patienter pendant que nous confirmons votre adresse email.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-500" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-navy mb-2">Email confirmé !</h1>
            <p className="text-slate-500 text-sm mb-4">
              Votre demande a été enregistrée. Redirection en cours…
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={32} className="text-red-500" aria-hidden="true" />
            </div>
            <h1 className="font-display text-xl font-bold text-navy mb-2">Lien invalide</h1>
            <p className="text-slate-500 text-sm mb-6" role="alert">
              {errorMsg}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Retour au formulaire
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
