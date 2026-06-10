import React from 'react';
import type { Metadata } from 'next';
import PublicNav from '@/components/PublicNav';
import HomeFooter from '@/app/home-page/components/HomeFooter';
import { FileText, AlertCircle, Shield, DollarSign } from 'lucide-react';
import { ENTITY_GL_CAPITAL,
  ENTITY_GENERAL_LUXURY,
  OFFICIAL_PUBLIC_EMAIL,
  REGISTERED_ADDRESS_ONE_LINE_FR, getPublicSiteUrl } from '@/lib/companyContact';

export const metadata: Metadata = {
  title: 'Conditions Générales - GL Capital Investment SA',
  description:
    'Conditions générales GL Capital : services, responsabilités, limitations, propriété intellectuelle, résolution des litiges.',
  openGraph: {
    title: 'Conditions Générales - GL Capital',
    description:
      "Conditions générales d'utilisation des services GL Capital. Responsabilités, limitations et dispositions légales.",
    type: 'website',
    url: `${getPublicSiteUrl()}/conditions-generales`,
  },
  alternates: {
    canonical: `${getPublicSiteUrl()}/conditions-generales`,
  },
};

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <PublicNav />
      <section className="relative pt-32 pb-16 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950" />
        <div className="relative max-w-screen-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full mb-6">
            <FileText size={12} className="text-gold-500" />
            <span className="text-gold-400 text-xs font-mono tracking-widest uppercase">
              Légal / Legal
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Conditions Générales{' '}
            <span className="text-white/40 text-2xl font-normal">/ Terms of Service</span>
          </h1>
          <p className="text-white/40 text-sm">
            Dernière mise à jour : avril 2026 - Last updated: April 2026
          </p>
        </div>
      </section>
      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <FileText size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">1. Objet / Purpose</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Les présentes conditions générales régissent l&apos;utilisation des services fournis
              par GL Capital Investment SA.
              <br />
              <span className="text-white/40">
                These terms and conditions govern the use of services provided by GL Capital
                Investment SA.
              </span>
            </p>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <Shield size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">
                2. Statut de GL Capital / GL Capital Status
              </h2>
            </div>
            <div className="space-y-3 text-white/60 text-sm leading-relaxed">
              <p>
                GL Capital Investment SA n&apos;est pas une banque, ne détient aucune licence
                bancaire ou d&apos;investissement.
                <br />
                <span className="text-white/40">
                  GL Capital Investment SA is not a bank and does not hold any banking or investment
                  licence.
                </span>
              </p>
              <p>
                GL Capital fournit exclusivement des services de conseil en structuration de
                dossiers de financement.
                <br />
                <span className="text-white/40">
                  GL Capital exclusively provides advisory services for structuring financing files.
                </span>
              </p>
              <p>
                Toute transaction financière est exécutée par des institutions financières dûment
                agréées.
                <br />
                <span className="text-white/40">
                  Any financial transaction is executed by duly authorised financial institutions.
                </span>
              </p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <DollarSign size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">
                3. Services fournis / Services Provided
              </h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>
                • Évaluation préliminaire de votre dossier de financement.{' '}
                <span className="text-white/40">
                  / Preliminary evaluation of your financing file.
                </span>
              </p>
              <p>
                • Structuration et documentation du dossier selon les critères institutionnels.{' '}
                <span className="text-white/40">
                  / Structuring and documentation according to institutional criteria.
                </span>
              </p>
              <p>
                • Mise en relation avec des institutions financières partenaires qualifiées.{' '}
                <span className="text-white/40">
                  / Introduction to qualified partner financial institutions.
                </span>
              </p>
              <p>
                • Suivi du dossier jusqu&apos;à la décision de financement.{' '}
                <span className="text-white/40">/ File monitoring until financing decision.</span>
              </p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <AlertCircle size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">
                4. Critères d&apos;éligibilité / Eligibility Criteria
              </h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>
                • Montant minimum : 200 millions d&apos;euros ou USD.{' '}
                <span className="text-white/40">/ Minimum amount: 200 million euros or USD.</span>
              </p>
              <p>
                • Apport en fonds propres : 5% à 10% du besoin total.{' '}
                <span className="text-white/40">
                  / Equity contribution: 5% to 10% of total requirement.
                </span>
              </p>
              <p>
                • Conformité KYC/AML complète et à jour.{' '}
                <span className="text-white/40">/ Complete and up-to-date KYC/AML compliance.</span>
              </p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <FileText size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">5. Confidentialité / Confidentiality</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Toutes les informations échangées dans le cadre de nos services sont soumises à un
              accord de confidentialité (NCNDA). GL Capital s&apos;engage à ne pas divulguer vos
              informations à des tiers non autorisés.
              <br />
              <span className="text-white/40">
                All information exchanged within the scope of our services is subject to a
                confidentiality agreement (NCNDA). GL Capital undertakes not to disclose your
                information to unauthorised third parties.
              </span>
            </p>
          </div>

          <div className="bg-navy-900/60 border border-amber-500/20 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle size={16} className="text-amber-400" />
              </div>
              <h2 className="text-white font-bold text-lg">
                6. Disclaimers institutionnels / Institutional Disclaimers
              </h2>
            </div>
            <div className="space-y-2 text-white/60 text-sm leading-relaxed">
              <p>
                • GL Capital n&apos;est pas une banque et ne collecte pas de dépôts.{' '}
                <span className="text-white/40">
                  / GL Capital is not a bank and does not collect deposits.
                </span>
              </p>
              <p>
                • GL Capital n&apos;exécute pas de transactions financières. Toute transaction est
                exécutée par des institutions agréées.{' '}
                <span className="text-white/40">
                  / GL Capital does not execute financial transactions. All transactions are
                  executed by licensed institutions.
                </span>
              </p>
              <p>
                • Les informations sur ce site sont à titre informatif uniquement.{' '}
                <span className="text-white/40">
                  / Information on this site is for informational purposes only.
                </span>
              </p>
              <p>
                • Aucune garantie de financement n&apos;est accordée.{' '}
                <span className="text-white/40">/ No financing guarantee is provided.</span>
              </p>
            </div>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <Shield size={16} className="text-gold-500" />
              </div>
              <h2 className="text-white font-bold text-lg">7. Droit applicable / Governing Law</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Les présentes conditions sont régies par le droit français. Tout litige sera soumis à
              la juridiction compétente de Paris, France.
              <br />
              <span className="text-white/40">
                These terms are governed by French law. Any dispute shall be submitted to the
                competent jurisdiction of Paris, France.
              </span>
            </p>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 rounded-2xl p-7 text-center">
            <p className="text-white/40 text-xs">
              {ENTITY_GL_CAPITAL} — {ENTITY_GENERAL_LUXURY}
            </p>
            <p className="text-white/40 text-xs">
              {REGISTERED_ADDRESS_ONE_LINE_FR} — {OFFICIAL_PUBLIC_EMAIL}
            </p>
          </div>
        </div>
      </section>
      <HomeFooter />
    </div>
  );
}
