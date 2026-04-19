'use client';
import React, { useState } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { Mail, Eye, Send, ChevronDown, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type TemplateId = 'welcome' | 'dossier-confirmation' | 'status-update' | 'request-documents';

interface TemplateConfig {
  id: TemplateId;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  defaultParams: Record<string, string>;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'welcome',
    labelFr: 'Email de bienvenue',
    labelEn: 'Welcome email',
    descFr: 'Envoyé lors de l\'inscription d\'un nouveau client',
    descEn: 'Sent when a new client registers',
    defaultParams: {
      email: 'client@example.com',
      fullName: 'Jean Dupont',
      confirmationUrl: 'https://glcapital9393.builtwithrocket.new/auth/callback',
      lang: 'fr',
    },
  },
  {
    id: 'dossier-confirmation',
    labelFr: 'Confirmation de dossier',
    labelEn: 'Dossier confirmation',
    descFr: 'Envoyé lors de la création d\'un dossier',
    descEn: 'Sent when a case file is created',
    defaultParams: {
      clientEmail: 'client@example.com',
      clientName: 'Jean Dupont',
      caseTitle: 'Financement infrastructure portuaire',
      caseId: 'CF-2026-001',
      lang: 'fr',
    },
  },
  {
    id: 'status-update',
    labelFr: 'Mise à jour de statut',
    labelEn: 'Status update',
    descFr: 'Envoyé lors d\'un changement de statut de dossier',
    descEn: 'Sent when a case file status changes',
    defaultParams: {
      clientEmail: 'client@example.com',
      clientName: 'Jean Dupont',
      caseTitle: 'Financement infrastructure portuaire',
      caseId: 'CF-2026-001',
      newStatus: 'ELIGIBLE',
      oldStatus: 'EN_ANALYSE',
      note: 'Votre dossier a été validé par notre équipe.',
      lang: 'fr',
    },
  },
  {
    id: 'request-documents',
    labelFr: 'Demande de documents',
    labelEn: 'Request documents',
    descFr: 'Envoyé quand l\'admin demande des documents manquants',
    descEn: 'Sent when admin requests missing documents',
    defaultParams: {
      clientEmail: 'client@example.com',
      clientName: 'Jean Dupont',
      caseTitle: 'Financement infrastructure portuaire',
      caseId: 'CF-2026-001',
      adminMessage: 'Nous avons besoin de vos relevés bancaires des 3 derniers mois ainsi que de votre business plan mis à jour.',
      lang: 'fr',
    },
  },
];

function buildWelcomeHtml(params: Record<string, string>): string {
  const isFr = params.lang === 'fr';
  const fullName = params.fullName || '';
  const email = params.email || '';
  const confirmationUrl = params.confirmationUrl || '#';

  return `<!DOCTYPE html>
<html lang="${params.lang}">
<head><meta charset="UTF-8"/><title>Bienvenue sur GL Capital</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">🎉 ${isFr ? 'Bienvenue' : 'Welcome'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#fff;padding:40px;">
          <p style="margin:0 0 16px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${fullName},` : `Hello ${fullName},`}</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${isFr ? 'Bienvenue sur le portail GL Capital. Votre compte a été créé avec succès. Pour activer votre accès, veuillez confirmer votre adresse email.' : 'Welcome to the GL Capital portal. Your account has been successfully created. To activate your access, please confirm your email address.'}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;">
              <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Adresse email' : 'Email address'}</span>
              <p style="margin:4px 0 0;color:#0a1941;font-size:14px;font-weight:600;">${email}</p>
            </td></tr>
          </table>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${confirmationUrl}" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:16px 36px;border-radius:10px;text-decoration:none;">${isFr ? 'Confirmer mon email' : 'Confirm my email'}</a>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">${isFr ? 'Ce lien est valable 24 heures.' : 'This link is valid for 24 hours.'}</p>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildDossierConfirmationHtml(params: Record<string, string>): string {
  const isFr = params.lang === 'fr';
  const clientName = params.clientName || '';
  const caseTitle = params.caseTitle || '';
  const caseId = params.caseId || '';

  return `<!DOCTYPE html>
<html lang="${params.lang}">
<head><meta charset="UTF-8"/><title>${isFr ? 'Dossier reçu — GL Capital' : 'File received — GL Capital'}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:20px;padding:6px 18px;">
            <span style="color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">📁 ${isFr ? 'Dossier reçu' : 'File received'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#c9a84c;height:3px;"></td></tr>
        <tr><td style="background:#fff;padding:40px;">
          <p style="margin:0 0 16px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`}</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${isFr ? 'Nous avons bien reçu votre dossier de financement. Notre équipe va procéder à son analyse dans les meilleurs délais.' : 'We have received your financing file. Our team will proceed with its analysis as soon as possible.'}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Dossier' : 'Case file'}</span>
                  <p style="margin:4px 0 0;color:#0a1941;font-size:15px;font-weight:700;">${caseTitle}</p>
                </td></tr>
                <tr><td style="padding-top:12px;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Référence' : 'Reference'}</span>
                  <p style="margin:4px 0 0;color:#0a1941;font-size:13px;font-family:monospace;">${caseId}</p>
                </td></tr>
                <tr><td style="padding-top:12px;">
                  <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Statut initial' : 'Initial status'}</span>
                  <p style="margin:4px 0 0;"><strong style="color:#3b82f6;">${isFr ? 'Reçu' : 'Received'}</strong></p>
                </td></tr>
              </table>
            </td></tr>
          </table>
          <div style="text-align:center;">
            <a href="https://glcapital9393.builtwithrocket.new/client-dashboard/case-files" style="display:inline-block;background:#c9a84c;color:#0a1941;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${isFr ? 'Suivre mon dossier' : 'Track my file'}</a>
          </div>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildRequestDocumentsHtml(params: Record<string, string>): string {
  const isFr = params.lang === 'fr';
  const clientName = params.clientName || '';
  const caseTitle = params.caseTitle || '';
  const adminMessage = params.adminMessage || '';

  return `<!DOCTYPE html>
<html lang="${params.lang}">
<head><meta charset="UTF-8"/><title>${isFr ? 'Documents requis — GL Capital' : 'Documents required — GL Capital'}</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0a1941 0%,#0d2060 100%);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#c9a84c;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">GL CAPITAL</h1>
          <p style="margin:4px 0 0;color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;">Investment SA</p>
          <div style="margin-top:20px;display:inline-block;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);border-radius:20px;padding:6px 18px;">
            <span style="color:#fb923c;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">⚠️ ${isFr ? 'Documents requis' : 'Documents required'}</span>
          </div>
        </td></tr>
        <tr><td style="background:#f97316;height:3px;"></td></tr>
        <tr><td style="background:#fff;padding:40px;">
          <p style="margin:0 0 16px;color:#0a1941;font-size:16px;font-weight:600;">${isFr ? `Bonjour ${clientName},` : `Dear ${clientName},`}</p>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">${isFr ? `Votre dossier <strong>${caseTitle}</strong> nécessite des documents complémentaires avant de pouvoir poursuivre son traitement.` : `Your case file <strong>${caseTitle}</strong> requires additional documents before we can proceed with its processing.`}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:20px;">
              <span style="color:#c2410c;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${isFr ? 'Message de notre équipe' : 'Message from our team'}</span>
              <p style="margin:8px 0 0;color:#7c2d12;font-size:14px;line-height:1.7;">${adminMessage.replace(/\n/g, '<br/>')}</p>
            </td></tr>
          </table>
          <div style="text-align:center;">
            <a href="https://glcapital9393.builtwithrocket.new/client-dashboard/case-files" style="display:inline-block;background:#f97316;color:#fff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">${isFr ? 'Accéder à mon dossier' : 'Access my file'}</a>
          </div>
        </td></tr>
        <tr><td style="background:#0a1941;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">GL Capital Investment SA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function getPreviewHtml(templateId: TemplateId, params: Record<string, string>): string {
  switch (templateId) {
    case 'welcome':
      return buildWelcomeHtml(params);
    case 'dossier-confirmation':
      return buildDossierConfirmationHtml(params);
    case 'request-documents':
      return buildRequestDocumentsHtml(params);
    case 'status-update':
      // Reuse the status-update template structure
      return buildDossierConfirmationHtml({ ...params, isStatusUpdate: 'true' });
    default:
      return '<p>Template not found</p>';
  }
}

function EmailPreviewContent() {
  const { lang } = useLanguage();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('welcome');
  const [params, setParams] = useState<Record<string, string>>(TEMPLATES[0].defaultParams);
  const [sendTo, setSendTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [previewLang, setPreviewLang] = useState<'fr' | 'en'>('fr');

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate)!;
  const previewParams = { ...params, lang: previewLang };
  const previewHtml = getPreviewHtml(selectedTemplate, previewParams);

  const handleTemplateChange = (id: TemplateId) => {
    setSelectedTemplate(id);
    const tpl = TEMPLATES.find((t) => t.id === id)!;
    setParams(tpl.defaultParams);
    setSendResult(null);
  };

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendTest = async () => {
    if (!sendTo.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      let endpoint = '';
      let body: Record<string, string> = { ...previewParams };

      if (selectedTemplate === 'welcome') {
        endpoint = '/api/send-signup-confirmation';
        body = {
          email: sendTo,
          fullName: params.fullName || 'Test User',
          confirmationUrl: params.confirmationUrl || 'https://glcapital9393.builtwithrocket.new/auth/callback',
          lang: previewLang,
        };
      } else if (selectedTemplate === 'dossier-confirmation') {
        endpoint = '/api/send-dossier-confirmation';
        body = {
          clientEmail: sendTo,
          clientName: params.clientName || 'Test User',
          caseTitle: params.caseTitle || 'Test Case',
          caseId: params.caseId || 'CF-TEST-001',
          lang: previewLang,
        };
      } else if (selectedTemplate === 'status-update') {
        endpoint = '/api/send-status-notification';
        body = {
          clientEmail: sendTo,
          clientName: params.clientName || 'Test User',
          caseTitle: params.caseTitle || 'Test Case',
          caseId: params.caseId || 'CF-TEST-001',
          newStatus: params.newStatus || 'ELIGIBLE',
          oldStatus: params.oldStatus || 'EN_ANALYSE',
          note: params.note || '',
          lang: previewLang,
        };
      } else if (selectedTemplate === 'request-documents') {
        endpoint = '/api/send-request-documents';
        body = {
          clientEmail: sendTo,
          clientName: params.clientName || 'Test User',
          caseTitle: params.caseTitle || 'Test Case',
          caseId: params.caseId || 'CF-TEST-001',
          adminMessage: params.adminMessage || 'Documents required.',
          lang: previewLang,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ success: true, message: t(`Email envoyé à ${sendTo}`, `Email sent to ${sendTo}`) });
      } else {
        setSendResult({ success: false, message: data.error || t('Erreur lors de l\'envoi', 'Error sending email') });
      }
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || t('Erreur réseau', 'Network error') });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-3">
          <Mail size={24} className="text-gold" />
          {t('Aperçu des templates email', 'Email Template Preview')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t('Visualisez et testez tous les templates Resend avant envoi aux clients', 'Visualize and test all Resend templates before sending to clients')}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left panel: template selector + params */}
        <div className="xl:col-span-1 space-y-4">
          {/* Template selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
              <ChevronDown size={14} />
              {t('Sélectionner un template', 'Select a template')}
            </h2>
            <div className="space-y-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selectedTemplate === tpl.id
                      ? 'bg-navy text-white border-navy' :'bg-white text-slate-700 border-slate-200 hover:border-navy/30 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold">{lang === 'fr' ? tpl.labelFr : tpl.labelEn}</p>
                  <p className={`text-xs mt-0.5 ${selectedTemplate === tpl.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {lang === 'fr' ? tpl.descFr : tpl.descEn}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Language toggle */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-3">{t('Langue de prévisualisation', 'Preview language')}</h2>
            <div className="flex gap-2">
              {(['fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setPreviewLang(l)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    previewLang === l
                      ? 'bg-gold text-navy border-gold' :'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {l === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-3">{t('Paramètres du template', 'Template parameters')}</h2>
            <div className="space-y-3">
              {Object.entries(params)
                .filter(([key]) => key !== 'lang')
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{key}</label>
                    {key === 'adminMessage' || key === 'note' ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-none min-h-[80px]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Send test */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
              <Send size={13} />
              {t('Envoyer un test', 'Send test email')}
            </h2>
            <div className="space-y-3">
              <input
                type="email"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder={t('Email destinataire...', 'Recipient email...')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              />
              <button
                onClick={handleSendTest}
                disabled={!sendTo.trim() || sending}
                className="w-full flex items-center justify-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t('Envoyer le test', 'Send test')}
              </button>
              {sendResult && (
                <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${sendResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {sendResult.success ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                  {sendResult.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: preview */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {lang === 'fr' ? currentTemplate.labelFr : currentTemplate.labelEn}
                </span>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {previewLang === 'fr' ? 'FR' : 'EN'}
                </span>
              </div>
              <button
                onClick={() => setParams({ ...currentTemplate.defaultParams })}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy transition-colors"
              >
                <RefreshCw size={12} />
                {t('Réinitialiser', 'Reset')}
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full rounded-xl shadow-sm"
                style={{ minHeight: '600px', border: 'none' }}
                title="Email preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmailPreviewPage() {
  return (
    <AdminLayout>
      <EmailPreviewContent />
    </AdminLayout>
  );
}
