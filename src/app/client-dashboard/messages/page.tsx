'use client';
import React from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';

export default function ClientMessagesPage() {
  const { lang } = useLanguage();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-navy/10 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-navy" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-navy mb-2">
            {lang === 'fr' ? 'Messagerie dossiers' : 'Case messages'}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {lang === 'fr'
              ? 'Retrouvez ici les échanges liés à vos dossiers. Ouvrez un dossier pour voir son fil de discussion.'
              : 'Find all case-related conversations here. Open a case to view its discussion thread.'}
          </p>
          <Link
            href="/client-dashboard/case-files"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors"
          >
            {lang === 'fr' ? 'Ouvrir mes dossiers' : 'Open my files'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
