'use client';
import React from 'react';
import Link from 'next/link';

export default function ServicesOverview() {
  return (
    <section className="py-20" style={{ background: '#F7F8FA' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
        <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: '#4A5C7A' }}>Services</p>
        <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#1E2D4A' }}>
          Solutions de financement <span className="text-gradient-gold">institutionnel</span>
        </h2>
        <p className="max-w-xl mx-auto mb-10 text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>
          GL Capital structure vos dossiers de financement pour soumission aux institutions financières agréées.
        </p>
        <Link
          href="/services-page"
          className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm"
          style={{ background: '#B8912A', color: '#FFFFFF' }}
        >
          Voir tous les services
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </div>
    </section>
  );
}