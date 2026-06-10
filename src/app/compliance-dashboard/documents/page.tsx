'use client';
import React from 'react';
import ComplianceLayout from '../components/ComplianceLayout';
import { FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ComplianceDocumentsPage() {
  const { lang } = useLanguage();
  return (
    <ComplianceLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={20} className="text-emerald-600" />
          <h1 className="font-display text-2xl font-bold text-navy">
            {lang === 'fr' ? 'Documents de conformité' : 'Compliance Documents'}
          </h1>
        </div>
        <p className="text-slate-500 text-sm">
          {lang === 'fr'
            ? 'Consultez et gérez les documents de conformité réglementaire.'
            : 'View and manage regulatory compliance documents.'}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <FileText size={40} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          {lang === 'fr'
            ? 'Les documents de conformité seront disponibles prochainement.'
            : 'Compliance documents will be available soon.'}
        </p>
      </div>
    </ComplianceLayout>
  );
}
