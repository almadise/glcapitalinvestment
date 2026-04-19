import React from 'react';
import type { Metadata } from 'next';
import PublicNav from '@/components/PublicNav';
import HomeFooter from '@/app/home-page/components/HomeFooter';
import { Lock, Shield, Database, Eye, Trash2, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — GL Capital Investment SA',
  description: 'Politique de confidentialité GL Capital : traitement des données, droits RGPD/CCPA, conservation, sécurité.',
  openGraph: {
    title: 'Politique de Confidentialité — GL Capital',
    description: 'Politique de confidentialité et protection des données personnelles. Conformité RGPD et CCPA.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new'}/politique-confidentialite`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://glcapital8049.builtwithrocket.new'}/politique-confidentialite`,
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <PublicNav />
      <section className="relative pt-32 pb-16 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950" />
        <div className="relative max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full mb-6">
            <Lock size={12} className="text-gold-500" />
            <span className="text-gold-400 text-xs font-mono tracking-widest uppercase">Légal / Legal</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Politique de Confidentialité <span className="text-white/40 text-2xl font-normal">/ Privacy Policy</span></h1>
          <p className="text-white/40 text-sm">Dernière mise à jour : avril 2026 — Last updated: April 2026</p>
        </div>
      </section>
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><Shield size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">1. Responsable de traitement / Data Controller</h2>
            </div>
            <div className="space-y-1 text-white/60 text-sm">
              <p><span className="text-white/80 font-medium">Raison sociale / Legal name :</span> General Luxury SA</p>
              <p><span className="text-white/80 font-medium">Nom commercial / Trading name :</span> GL Capital Investment SA</p>
              <p><span className="text-white/80 font-medium">Adresse / Address :</span> 9 Rue Bonnet, 95400 ARNOUVILLE, France</p>
              <p><span className="text-white/80 font-medium">Email :</span> almadise84@yahoo.fr</p>
              <p><span className="text-white/80 font-medium">Téléphone / Phone :</span> +33 984 046951</p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><Database size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">2. Données collectées / Data Collected</h2>
            </div>
            <div className="space-y-3 text-white/60 text-sm leading-relaxed">
              <p><span className="text-white/80 font-medium">Données d&apos;identification / Identification data :</span> Nom, prénom, adresse email, numéro de téléphone, adresse postale, pays d&apos;exécution. <span className="text-white/40">/ First name, last name, email address, phone number, postal address, execution country.</span></p>
              <p><span className="text-white/80 font-medium">Données professionnelles / Professional data :</span> Nom de l&apos;entreprise, secteur d&apos;activité, montant de financement recherché, nature du projet. <span className="text-white/40">/ Company name, business sector, financing amount sought, project nature.</span></p>
              <p><span className="text-white/80 font-medium">Données de conformité / Compliance data :</span> Documents KYC/AML, états financiers, relevés bancaires, passeport, justificatif de domicile. <span className="text-white/40">/ KYC/AML documents, financial statements, bank statements, passport, proof of address.</span></p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><AlertCircle size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">3. Base légale du traitement / Legal Basis for Processing</h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>• Exécution d&apos;un contrat : traitement des données pour évaluer votre dossier et exécuter nos services. <span className="text-white/40">/ Contract performance: processing data to evaluate your file and execute our services.</span></p>
              <p>• Intérêt légitime : conformité réglementaire, prévention de la fraude, sécurité des systèmes. <span className="text-white/40">/ Legitimate interest: regulatory compliance, fraud prevention, system security.</span></p>
              <p>• Obligation légale : respect des obligations KYC/AML, RGPD, CCPA et réglementations anti-blanchiment. <span className="text-white/40">/ Legal obligation: compliance with KYC/AML, GDPR, CCPA and anti-money laundering regulations.</span></p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><Trash2 size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">4. Durée de conservation / Data Retention Period</h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>• Dossiers acceptés : 5 ans à compter de la clôture de la transaction. <span className="text-white/40">/ Accepted files: 5 years from transaction closure.</span></p>
              <p>• Dossiers rejetés : 3 ans à compter de la date de rejet. <span className="text-white/40">/ Rejected files: 3 years from rejection date.</span></p>
              <p>• Données de conformité : 7 ans conformément aux obligations anti-blanchiment. <span className="text-white/40">/ Compliance data: 7 years in accordance with anti-money laundering obligations.</span></p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><Eye size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">5. Vos droits RGPD / Your GDPR Rights</h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>• Droit d&apos;accès : demander une copie de vos données personnelles. <span className="text-white/40">/ Right of access: request a copy of your personal data.</span></p>
              <p>• Droit de rectification : corriger ou mettre à jour vos données. <span className="text-white/40">/ Right of rectification: correct or update your data.</span></p>
              <p>• Droit à l&apos;effacement : demander la suppression de vos données (sous certaines conditions). <span className="text-white/40">/ Right to erasure: request deletion of your data (under certain conditions).</span></p>
              <p>• Droit à la portabilité : recevoir vos données dans un format structuré et transférable. <span className="text-white/40">/ Right to portability: receive your data in a structured and transferable format.</span></p>
              <p>• Droit d&apos;opposition : s&apos;opposer au traitement de vos données à des fins de marketing. <span className="text-white/40">/ Right to object: object to processing of your data for marketing purposes.</span></p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><Shield size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">6. Droits CCPA / CCPA Rights (California)</h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>• Right to know: request disclosure of personal information collected. <span className="text-white/40">/ Droit de savoir : demander la divulgation des informations personnelles collectées.</span></p>
              <p>• Right to delete: request deletion of personal information. <span className="text-white/40">/ Droit à la suppression : demander la suppression des informations personnelles.</span></p>
              <p>• Right to opt-out: opt out of the sale of personal information. <span className="text-white/40">/ Droit d&apos;opposition à la vente : refuser la vente de vos informations personnelles.</span></p>
              <p>• Right to non-discrimination: equal service regardless of privacy rights exercise. <span className="text-white/40">/ Droit à la non-discrimination : service égal indépendamment de l&apos;exercice de vos droits.</span></p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-gold-500/20 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center"><AlertCircle size={16} className="text-gold-500" /></div>
              <h2 className="text-white font-bold text-lg">7. Comment exercer vos droits / How to Exercise Your Rights</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Pour exercer vos droits RGPD ou CCPA, contactez-nous à :<br />
              <span className="text-white/40">To exercise your GDPR or CCPA rights, contact us at:</span><br />
              <span className="text-gold-400 font-medium">almadise84@yahoo.fr</span>
            </p>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7 text-center">
            <p className="text-white/40 text-xs">GL Capital Investment SA — General Luxury SA</p>
            <p className="text-white/40 text-xs">9 Rue Bonnet, 95400 ARNOUVILLE, France — almadise84@yahoo.fr — +33 984 046951</p>
          </div>
        </div>
      </section>
      <HomeFooter />
    </div>
  );
}