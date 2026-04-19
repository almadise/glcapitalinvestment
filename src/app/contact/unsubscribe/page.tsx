'use client';
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import UnsubscribeContent from './UnsubscribeContent';

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" aria-hidden="true" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
