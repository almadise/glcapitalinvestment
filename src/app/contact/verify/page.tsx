'use client';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ContactVerifyContent from './ContactVerifyContent';

export default function ContactVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <Loader2 size={40} className="text-gold animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    }>
      <ContactVerifyContent />
    </Suspense>
  );
}
