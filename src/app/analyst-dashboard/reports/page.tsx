'use client';
import React from 'react';
import AnalystLayout from '../components/AnalystLayout';
import { FileSearch } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AnalystReportsPage() {
  const { lang } = useLanguage();
  return (
    <AnalystLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileSearch size={20} className="text-blue-600" />
          <h1 className="font-display text-2xl font-bold text-navy">
            {lang === 'fr' ? "Rapports d'analyse" : 'Analysis Reports'}
          </h1>
        </div>
        <p className="text-slate-500 text-sm">
          {lang === 'fr'
            ? 'Générez et exportez des rapports sur les dossiers analysés.'
            : 'Generate and export reports on analyzed cases.'}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <FileSearch size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          {lang === 'fr'
            ? 'Les rapports seront disponibles prochainement.'
            : 'Reports will be available soon.'}
        </p>
      </div>
    </AnalystLayout>
  );
}
