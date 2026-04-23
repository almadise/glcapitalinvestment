'use client';
import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Globe, Lock, Shield, Database, FileText, Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp,  } from 'lucide-react';

type TaskStatus = 'ok' | 'warning' | 'error' | 'pending';

interface ReadinessTask {
  id: string;
  category: string;
  icon: React.ElementType;
  title: string;
  description: string;
  status: TaskStatus;
  details: string[];
  actionItems: string[];
}

const TASKS: ReadinessTask[] = [
  {
    id: 'dns',
    category: 'Infrastructure',
    icon: Globe,
    title: 'Validation DNS',
    description: 'Vérification des enregistrements DNS, propagation et configuration des sous-domaines.',
    status: 'warning',
    details: [
      'Domaine principal : glcapital.com - à configurer',
      'Enregistrement A / CNAME vers hébergement production requis',
      'Enregistrement MX pour emails transactionnels (Resend)',
      'SPF, DKIM, DMARC à configurer pour délivrabilité email',
      'Sous-domaine portail : portal.glcapital.com - à créer',
    ],
    actionItems: [
      'Configurer les enregistrements A/CNAME chez le registrar DNS',
      'Ajouter TXT SPF : v=spf1 include:resend.com ~all',
      'Configurer DKIM via le tableau de bord Resend',
      'Activer DMARC : v=DMARC1; p=quarantine; rua=mailto:dmarc@glcapitalinvestment.com',
      'Vérifier la propagation DNS avec dig ou dnschecker.org',
    ],
  },
  {
    id: 'ssl',
    category: 'Sécurité',
    icon: Lock,
    title: 'Certificat SSL / TLS',
    description: 'État du certificat TLS, version du protocole et configuration HSTS.',
    status: 'warning',
    details: [
      'Certificat TLS 1.3 requis (TLS 1.0/1.1 à désactiver)',
      'Certificat Let\'s Encrypt ou CA commerciale - à provisionner',
      'HSTS (Strict-Transport-Security) à activer avec max-age ≥ 31536000',
      'HSTS preload list - soumission recommandée',
      'Renouvellement automatique à configurer (certbot ou hébergeur)',
    ],
    actionItems: [
      'Provisionner certificat SSL via hébergeur ou Let\'s Encrypt',
      'Activer HTTPS forcé avec redirection 301 HTTP → HTTPS',
      'Ajouter header HSTS dans next.config.mjs',
      'Tester avec SSL Labs (ssllabs.com/ssltest) - viser grade A+',
      'Configurer renouvellement automatique',
    ],
  },
  {
    id: 'gdpr',
    category: 'Conformité',
    icon: Shield,
    title: 'Bannière de consentement RGPD',
    description: 'Consentement cookies, politique de confidentialité et gestion des préférences utilisateur.',
    status: 'warning',
    details: [
      'Bannière de consentement cookies - à implémenter (CNIL obligatoire)',
      'Catégories cookies : nécessaires, analytiques (GA4), marketing',
      'Politique de confidentialité : page /politique-confidentialite existante ✓',
      'Droit à l\'effacement (RGPD Art. 17) - procédure à documenter',
      'Registre des traitements (RGPD Art. 30) - à créer',
      'DPO ou référent RGPD - à désigner',
    ],
    actionItems: [
      'Implémenter bannière cookies conforme CNIL (opt-in explicite)',
      'Bloquer GA4 avant consentement utilisateur',
      'Ajouter lien "Gérer mes préférences" dans le footer',
      'Créer formulaire de demande d\'exercice des droits RGPD',
      'Rédiger et signer le registre des traitements',
    ],
  },
  {
    id: 'data-residency',
    category: 'Données',
    icon: Database,
    title: 'Résidence des données',
    description: 'Localisation des données, conformité RGPD sur le transfert et la souveraineté des données.',
    status: 'pending',
    details: [
      'Supabase région : à vérifier (EU recommandé pour RGPD)',
      'Données personnelles stockées dans l\'UE - à confirmer',
      'Transferts hors UE (Resend, GA4) : clauses contractuelles types requises',
      'Chiffrement au repos : AES-256 (Supabase) ✓',
      'Chiffrement en transit : TLS 1.3 ✓',
      'Sauvegardes : politique de rétention à définir',
    ],
    actionItems: [
      'Vérifier la région Supabase dans les paramètres du projet',
      'Migrer vers région EU si nécessaire (eu-west-1 ou eu-central-1)',
      'Signer DPA (Data Processing Agreement) avec Supabase, Resend',
      'Documenter les transferts hors UE et les garanties associées',
      'Définir politique de rétention des données (ex : 5 ans pour dossiers)',
    ],
  },
  {
    id: 'audit-logs',
    category: 'Audit',
    icon: FileText,
    title: 'Rétention des journaux d\'audit',
    description: 'Conservation des logs d\'audit, immuabilité et conformité réglementaire.',
    status: 'ok',
    details: [
      'Table audit_logs implémentée avec RLS ✓',
      'Logs immuables (INSERT only, pas de UPDATE/DELETE) ✓',
      'Rétention recommandée : 5 ans minimum (réglementation financière)',
      'Archivage automatique à configurer pour logs > 1 an',
      'Export CSV disponible via /admin/audit-export ✓',
      'Alertes sur événements critiques - à configurer',
    ],
    actionItems: [
      'Configurer archivage automatique Supabase après 12 mois',
      'Mettre en place alertes email pour événements critiques (connexions admin, suppressions)',
      'Documenter la politique de rétention dans le registre RGPD',
      'Tester l\'export d\'audit avant mise en production',
    ],
  },
  {
    id: 'security-headers',
    category: 'Sécurité',
    icon: Server,
    title: 'En-têtes de sécurité HTTP',
    description: 'Vérification et configuration des headers de sécurité HTTP recommandés.',
    status: 'warning',
    details: [
      'Content-Security-Policy (CSP) - à configurer',
      'X-Content-Type-Options: nosniff - à ajouter',
      'Referrer-Policy: strict-origin-when-cross-origin - à ajouter',
      'Permissions-Policy - à configurer',
      'HSTS - dépend de la configuration SSL (voir ci-dessus)',
      'Note : X-Frame-Options non applicable (app dans iframe)',
    ],
    actionItems: [
      'Ajouter headers de sécurité dans next.config.mjs (section headers())',
      'Configurer CSP : default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://www.googletagmanager.com',
      'Ajouter X-Content-Type-Options: nosniff',
      'Ajouter Referrer-Policy: strict-origin-when-cross-origin',
      'Tester avec securityheaders.com - viser grade A',
    ],
  },
];

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  ok: { label: 'Conforme', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: CheckCircle2 },
  warning: { label: 'Action requise', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', Icon: AlertTriangle },
  error: { label: 'Critique', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', Icon: XCircle },
  pending: { label: 'À vérifier', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', Icon: RefreshCw },
};

function TaskCard({ task }: { task: ReadinessTask }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[task.status];
  const StatusIcon = cfg.Icon;
  const TaskIcon = task.icon;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-navy/5 flex items-center justify-center flex-shrink-0">
            <TaskIcon size={20} className="text-navy" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{task.category}</span>
                <h2 className="font-display text-base font-bold text-navy mt-0.5">{task.title}</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color} border flex-shrink-0`}>
                <StatusIcon size={12} aria-hidden="true" />
                {cfg.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">{task.description}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={`task-details-${task.id}`}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          {expanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          {expanded ? 'Masquer les détails' : 'Voir les détails et actions'}
        </button>
      </div>

      {expanded && (
        <div id={`task-details-${task.id}`} className="border-t border-slate-100 px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">État actuel</h3>
              <ul className="space-y-2" role="list">
                {task.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-slate-400 mt-1 flex-shrink-0" aria-hidden="true">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Actions requises</h3>
              <ol className="space-y-2" role="list">
                {task.actionItems.map((action, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-navy/10 text-navy text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ProductionReadinessPage() {
  const totalTasks = TASKS.length;
  const okCount = TASKS.filter((t) => t.status === 'ok').length;
  const warningCount = TASKS.filter((t) => t.status === 'warning').length;
  const errorCount = TASKS.filter((t) => t.status === 'error').length;
  const pendingCount = TASKS.filter((t) => t.status === 'pending').length;
  const readinessScore = Math.round((okCount / totalTasks) * 100);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-gold" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Administration</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">Préparation à la mise en production</h1>
          <p className="text-slate-500 text-sm mt-1">
            Checklist des tâches critiques avant déploiement en production. Réservé aux administrateurs.
          </p>
        </div>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <h2 className="font-display text-base font-bold text-navy mb-1">Score de préparation</h2>
              <p className="text-slate-500 text-sm">{okCount} tâche{okCount !== 1 ? 's' : ''} conforme{okCount !== 1 ? 's' : ''} sur {totalTasks}</p>
              <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={readinessScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de préparation : ${readinessScore}%`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${readinessScore}%`,
                    background: readinessScore >= 80 ? '#10b981' : readinessScore >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{readinessScore}% conforme</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { count: okCount, label: 'Conforme', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { count: warningCount, label: 'Action requise', color: 'text-amber-600', bg: 'bg-amber-50' },
                { count: errorCount, label: 'Critique', color: 'text-red-600', bg: 'bg-red-50' },
                { count: pendingCount, label: 'À vérifier', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 text-center min-w-[80px]`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Accès restreint :</strong> Cette page est réservée aux administrateurs. Les informations ci-dessous reflètent l'état de préparation au déploiement en production et doivent être traitées de manière confidentielle.
          </p>
        </div>

        {/* Tasks */}
        <div className="space-y-4" role="list" aria-label="Tâches de préparation à la production">
          {TASKS.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCard task={task} />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-slate-500 text-xs leading-relaxed">
            <strong className="text-slate-600">Note :</strong> Cette checklist est indicative et doit être complétée par une revue de sécurité professionnelle avant tout déploiement en production. Consultez un expert en cybersécurité et un juriste spécialisé RGPD pour valider la conformité complète.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
