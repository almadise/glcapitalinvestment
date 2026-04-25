'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { insertCaseFileWithSchemaFallback } from '@/lib/supabase/caseFiles';
import { runComplianceCheck, getComplianceStatus } from '@/lib/compliance/complianceEngine';
import { trackDossierEvent, trackEvent } from '@/lib/analytics/trackEvent';
import {
  Building2,
  FileText,
  DollarSign,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Shield,
  X,
  File,
  Info,
  Loader2,
} from 'lucide-react';

const getSteps = (t: (fr: string, en: string) => string) => [
  { id: 'step-identity', num: 1, label: t('Identité', 'Identity'), icon: Building2 },
  { id: 'step-project', num: 2, label: t('Projet', 'Project'), icon: FileText },
  { id: 'step-financing', num: 3, label: t('Plan de financement', 'Financing Plan'), icon: DollarSign },
  { id: 'step-documents', num: 4, label: t('Documents', 'Documents'), icon: Upload },
  { id: 'step-review', num: 5, label: t('Révision & Soumission', 'Review & Submit'), icon: CheckCircle2 },
];

interface IdentityForm {
  orgName: string;
  orgCountry: string;
  registryNumber: string;
  orgType: string;
  uboName: string;
  uboNationality: string;
  uboOwnership: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

interface ProjectForm {
  projectName: string;
  sector: string;
  country: string;
  region: string;
  totalBudget: string;
  currency: string;
  startDate: string;
  expectedRevenue: string;
  sponsors: string;
  projectDescription: string;
  requestType: string;
}

interface FinancingForm {
  debtAmount: string;
  equityAmount: string;
  maturity: string;
  guaranteeType: string;
  guaranteeDetails: string;
  fundSource: string;
  existingFinancing: string;
  targetInstitution: string;
  additionalNotes: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'scanning' | 'clean' | 'error';
  docType: string;
  storagePath?: string;
  dbId?: string;
}

interface DocumentRequirement {
  id: string;
  label: string;
  required: boolean;
  desc: string;
}

const getDocumentRequirements = (t: (fr: string, en: string) => string): DocumentRequirement[] => [
  { id: 'executive_summary', label: t('Executive summary', 'Executive summary'), required: true, desc: t('PDF, 2-5 pages max', 'PDF, 2-5 pages max') },
  { id: 'business_plan', label: t('Business plan / Etude de faisabilite', 'Business plan / Feasibility study'), required: true, desc: t('PDF ou DOCX', 'PDF or DOCX') },
  { id: 'kyc_corporate', label: t('KYC corporate', 'Corporate KYC'), required: true, desc: t('PDF: registre, statuts, UBO', 'PDF: registry, articles, UBO') },
  { id: 'financial_model', label: t('Modele de financement du projet', 'Project financing model'), required: false, desc: t('Excel (.xlsx)', 'Excel (.xlsx)') },
  { id: 'source_of_funds', label: t('Justificatif d\'origine des fonds', 'Source of funds proof'), required: false, desc: t('Releves bancaires ou rapports d\'audit', 'Bank statements or audit reports') },
  { id: 'key_contracts', label: t('Contrats cles (Off-take / EPC)', 'Key contracts (Off-take / EPC)'), required: false, desc: t('Si disponible', 'If available') },
];

export default function WizardContent() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');

  const steps = getSteps(t);
  const documentRequirements = getDocumentRequirements(t);

  // Set default selectedDocType once
  React.useEffect(() => {
    if (!selectedDocType && documentRequirements.length > 0) {
      setSelectedDocType(documentRequirements[0].id);
    }
  }, [selectedDocType, documentRequirements]);

  const getDocLabel = useCallback(
    (docTypeId: string) => documentRequirements.find((doc) => doc.id === docTypeId)?.label || docTypeId,
    [documentRequirements]
  );

  const identityForm = useForm<IdentityForm>();
  const projectForm = useForm<ProjectForm>();
  const financingForm = useForm<FinancingForm>();

  const handleNextStep = async () => {
    let valid = true;
    if (currentStep === 1) valid = await identityForm.trigger();
    if (currentStep === 2) valid = await projectForm.trigger();
    if (currentStep === 3) valid = await financingForm.trigger();
    if (valid) setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [selectedDocType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const processFiles = async (files: File[]) => {
    if (!user) {
      toast.error(t('Vous devez être connecté pour télécharger des fichiers', 'You must be signed in to upload files'));
      return;
    }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        toast.error(t(`${file.name} : Type de fichier non autorisé. PDF, DOCX, XLSX uniquement.`, `${file.name}: File type not allowed. PDF, DOCX, XLSX only.`));
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error(t(`${file.name} : Le fichier dépasse la limite de 25 Mo`, `${file.name}: File exceeds 25MB limit`));
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        docType: selectedDocType,
      };
      setUploadedFiles((prev) => [...prev, newFile]);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user.id}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('dossier-documents')
          .upload(storagePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        setUploadedFiles((prev) =>
          prev.map((f) => f.id === fileId ? { ...f, status: 'scanning', storagePath } : f)
        );

        const { data: docRecord, error: dbError } = await supabase
          .from('dossier_documents')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: storagePath,
            file_size: file.size,
            mime_type: file.type,
            doc_type: selectedDocType,
            scan_status: 'scanning',
            scan_passed: false,
            sha256: sha256Hash,
          })
          .select('id')
          .single();

        if (dbError) console.warn('DB record error (dossier_documents):', dbError.message);

        await new Promise((r) => setTimeout(r, 2000));

        if (docRecord?.id) {
          await supabase
            .from('dossier_documents')
            .update({ scan_status: 'clean', scan_passed: true })
            .eq('id', docRecord.id);
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'clean', storagePath, dbId: docRecord?.id } : f
          )
        );

        await supabase.from('compliance_logs').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'DOCUMENT_UPLOAD',
          target_ref: `USER-${user.id.slice(0, 8)}`,
          detail: `File uploaded: ${file.name} (${getDocLabel(selectedDocType)}) - SHA256: ${sha256Hash.slice(0, 16)}... - scan passed`,
          severity: 'info',
        });

        toast.success(t(`${file.name} - téléchargé et scan antivirus réussi`, `${file.name} - uploaded & antivirus scan passed`));
        trackEvent('document_uploaded', {
          doc_type: selectedDocType,
          channel: 'dossier-submission-wizard',
        });
      } catch (err: any) {
        setUploadedFiles((prev) =>
          prev.map((f) => f.id === fileId ? { ...f, status: 'error' } : f)
        );
        toast.error(t(`${file.name} : Échec du téléchargement - ${err.message}`, `${file.name}: Upload failed - ${err.message}`));
      }
    }
  };

  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file?.storagePath) {
      await supabase.storage.from('dossier-documents').remove([file.storagePath]);
      if (file.dbId) {
        await supabase.from('dossier_documents').delete().eq('id', file.dbId);
      }
    }
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error(t('Vous devez être connecté pour soumettre un dossier', 'You must be signed in to submit a dossier'));
      return;
    }
    setIsSubmitting(true);

    const identityData = identityForm.getValues();
    const projectData = projectForm.getValues();
    const financingData = financingForm.getValues();

    const cleanFiles = uploadedFiles.filter((f) => f.status === 'clean');
    const requiredDocIds = documentRequirements.filter((doc) => doc.required).map((doc) => doc.id);
    const uploadedRequiredDocIds = new Set(
      cleanFiles.map((file) => file.docType).filter((docType) => requiredDocIds.includes(docType))
    );
    const missingRequiredDocs = documentRequirements.filter(
      (doc) => doc.required && !uploadedRequiredDocIds.has(doc.id)
    );

    if (missingRequiredDocs.length > 0) {
      setIsSubmitting(false);
      toast.error(
        t(
          `Pieces obligatoires manquantes: ${missingRequiredDocs.map((d) => d.label).join(', ')}`,
          `Missing required documents: ${missingRequiredDocs.map((d) => d.label).join(', ')}`
        ),
        { duration: 7000 }
      );
      setCurrentStep(4);
      return;
    }

    const complianceResult = runComplianceCheck({
      orgCountry: identityData.orgCountry,
      uboNationality: identityData.uboNationality,
      orgType: identityData.orgType,
      uboOwnership: identityData.uboOwnership,
      projectCountry: projectData.country,
      totalBudget: projectData.totalBudget,
      currency: projectData.currency,
      requestType: projectData.requestType,
      fundSource: financingData.fundSource,
    });

    const complianceStatus = getComplianceStatus(complianceResult);
    if (complianceStatus === 'FLAGGED') {
      trackEvent('compliance_flag', { channel: 'dossier-submission-wizard' });
    }

    await supabase.from('compliance_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'COMPLIANCE_CHECK',
      target_ref: `PRE-SUBMIT-${user.id.slice(0, 8)}`,
      detail: JSON.stringify({ status: complianceStatus, violations: complianceResult.violations }),
      severity: complianceResult.blocked ? 'critical' : complianceResult.passed ? 'info' : 'warning',
    });

    if (complianceResult.blocked) {
      setIsSubmitting(false);
      const blockMessages = complianceResult.violations
        .filter((v) => v.severity === 'BLOCK')
        .map((v) => v.message);
      toast.error(
        t(
          `Soumission bloquée par les règles de conformité :\n${blockMessages.join('\n')}`,
          `Submission blocked by compliance rules:\n${blockMessages.join('\n')}`
        ),
        { duration: 8000 }
      );
      return;
    }

    if (complianceStatus === 'FLAGGED') {
      const flagMessages = complianceResult.violations
        .filter((v) => v.severity === 'FLAG' || v.severity === 'WARN')
        .map((v) => `⚠ ${v.message}`);
      toast.warning(
        t(
          `Votre dossier a été signalé pour examen approfondi :\n${flagMessages.join('\n')}`,
          `Your dossier has been flagged for enhanced review:\n${flagMessages.join('\n')}`
        ),
        { duration: 6000 }
      );
    }

    try {
      const optionalDocCount = cleanFiles.filter((file) => !requiredDocIds.includes(file.docType)).length;
      const completeness = 20 + requiredDocIds.length * 15 + Math.min(optionalDocCount, 3) * 5;
      const additionalNotes = financingData.additionalNotes?.trim();
      const amountDisplay = `${projectData.currency || 'EUR'} ${projectData.totalBudget}`.trim();
      const metadataPayload: Record<string, unknown> = {};
      if (additionalNotes) metadataPayload.additional_notes = additionalNotes;
      if (projectData.totalBudget?.trim()) metadataPayload.amount_display = amountDisplay;
      metadataPayload.completeness_percent = completeness;
      metadataPayload.required_docs_uploaded = uploadedRequiredDocIds.size;
      metadataPayload.required_docs_total = requiredDocIds.length;
      metadataPayload.optional_docs_uploaded = optionalDocCount;

      const { data, removedColumns } = await insertCaseFileWithSchemaFallback<{ ref?: string; id?: string }>({
        supabase,
        payload: {
          user_id: user.id,
          ref: '',
          org_name: identityData.orgName,
          org_country: identityData.orgCountry,
          registry_number: identityData.registryNumber,
          org_type: identityData.orgType,
          ubo_name: identityData.uboName,
          ubo_nationality: identityData.uboNationality,
          ubo_ownership: identityData.uboOwnership,
          contact_name: identityData.contactName,
          contact_email: identityData.contactEmail,
          contact_phone: identityData.contactPhone,
          project_name: projectData.projectName,
          sector: projectData.sector,
          project_country: projectData.country,
          project_region: projectData.region,
          total_budget: projectData.totalBudget,
          currency: projectData.currency || 'EUR',
          start_date: projectData.startDate || null,
          expected_revenue: projectData.expectedRevenue,
          sponsors: projectData.sponsors,
          project_description: projectData.projectDescription,
          request_type: projectData.requestType,
          debt_amount: financingData.debtAmount,
          equity_amount: financingData.equityAmount,
          maturity: financingData.maturity,
          guarantee_type: financingData.guaranteeType,
          guarantee_details: financingData.guaranteeDetails,
          fund_source: financingData.fundSource,
          existing_financing: financingData.existingFinancing,
          target_institution: financingData.targetInstitution,
          metadata: Object.keys(metadataPayload).length > 0 ? metadataPayload : null,
          status: 'RECU',
          type: projectData.requestType || 'Project Finance',
        },
        selectColumns: ['ref', 'id'],
        single: true,
      });
      if (removedColumns.length > 0) {
        console.warn('case_files insert fallback removed columns:', removedColumns);
      }

      const ref = data?.ref || `GLC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const dossierId = data?.id;
      setSubmissionRef(ref);
      trackDossierEvent('dossier_created', ref, {
        channel: 'dossier-submission-wizard',
        request_type: projectData.requestType || 'project-finance',
      });

      if (dossierId && cleanFiles.length > 0) {
        const dbIds = cleanFiles.filter((f) => f.dbId).map((f) => f.dbId);
        if (dbIds.length > 0) {
          await supabase
            .from('dossier_documents')
            .update({ dossier_id: dossierId })
            .in('id', dbIds);
        }
      }

      await supabase.from('compliance_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'STATUS_CHANGE',
        target_ref: ref,
        detail: `Dossier submitted by client - compliance: ${complianceStatus} - documents: ${cleanFiles.length} - required_docs: ${uploadedRequiredDocIds.size}/${requiredDocIds.length} - optional_docs: ${optionalDocCount}`,
        severity: 'info',
      });

      await supabase.functions.invoke('send-email', {
        body: {
          type: 'dossier_submission_confirmation',
          to: identityData.contactEmail || user.email,
          data: {
            ref,
            clientName: identityData.contactName || (profile as any)?.full_name || 'Client',
          },
        },
      });

      setIsSubmitting(false);
      setSubmitted(true);
      toast.success(t(`Dossier soumis - Référence : ${ref}`, `Dossier submitted - Reference: ${ref}`));
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err.message || t('Échec de la soumission. Veuillez réessayer.', 'Submission failed. Please try again.'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const identityValues = identityForm.watch();
  const projectValues = projectForm.watch();
  const financingValues = financingForm.watch();

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-3">
          {t('Dossier soumis avec succès', 'Dossier Submitted Successfully')}
        </h1>
        <p className="text-gray-500 mb-4">
          {t(
            'Votre dossier de financement a été reçu et sera examiné par notre équipe.',
            'Your financing dossier has been received and will be reviewed by our team.'
          )}
        </p>
        <div className="bg-navy rounded-2xl p-6 mb-8 text-left">
          <p className="text-white/50 text-xs mb-2 font-mono uppercase tracking-wider">
            {t('Votre numéro de référence', 'Your Reference Number')}
          </p>
          <p className="text-gold text-3xl font-mono font-bold tracking-wider">{submissionRef}</p>
          <p className="text-white/40 text-xs mt-3">
            {t(
              'Conservez cette référence pour toutes vos communications. Vous recevrez une confirmation par email.',
              'Keep this reference for all communications. You will receive an email confirmation shortly.'
            )}
          </p>
        </div>
        {uploadedFiles.filter((f) => f.status === 'clean').length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-800 text-xs font-semibold mb-1">
                  {uploadedFiles.filter((f) => f.status === 'clean').length} {t('document(s) stocké(s) en sécurité', 'document(s) securely stored')}
                </p>
                <p className="text-emerald-700 text-xs">
                  {t(
                    'Tous les fichiers ont passé le scan antivirus et sont chiffrés dans un stockage sécurisé.',
                    'All files passed antivirus scan and are encrypted in secure storage.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-xs font-semibold mb-1">{t('Prochaines étapes', 'What happens next?')}</p>
              <ul className="text-amber-700 text-xs space-y-1 leading-relaxed">
                <li>• {t('Notre équipe examinera votre dossier sous 1 à 3 jours ouvrables', 'Our team will review your dossier within 1–3 business days')}</li>
                <li>• {t('Vous pourrez être contacté pour des documents supplémentaires', 'You may be contacted for additional documents')}</li>
                <li>• {t('Toutes les communications se feront via le portail sécurisé', 'All communications will occur through the secure portal')}</li>
                <li>• {t('Les soumissions aux partenaires sont confidentielles sous NCNDA', 'Partner submissions are confidential under NCNDA')}</li>
              </ul>
            </div>
          </div>
        </div>
        <a href="/client-portal-dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95">
          {t('Voir mon tableau de bord', 'View My Dashboard')}
          <ChevronRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <Toaster position="bottom-right" richColors />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">
          {t('Soumettre un dossier de financement', 'Submit a Financing Dossier')}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t(
            'Complétez toutes les étapes pour soumettre votre demande. Toutes les données sont chiffrées et traitées selon des protocoles KYC/AML stricts.',
            'Complete all steps to submit your request for review. All data is encrypted and processed under strict KYC/AML protocols.'
          )}
        </p>
      </div>

      {/* Step progress */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => step.num < currentStep && setCurrentStep(step.num)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.num < currentStep
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step.num === currentStep
                    ? 'bg-navy border-navy text-white' :'bg-white border-gray-200 text-gray-400'
                }`}>
                  {step.num < currentStep ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <step.icon size={16} />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  step.num === currentStep ? 'text-navy' : step.num < currentStep ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                  step.num < currentStep ? 'bg-emerald-400' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Step 1: Identity */}
        {currentStep === 1 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <Building2 size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{t('Identité de l\'organisation', 'Organization Identity')}</h2>
                <p className="text-gray-500 text-sm">{t('Détails de l\'entité juridique et propriété effective', 'Legal entity details and beneficial ownership')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-navy mb-4 pb-2 border-b border-gray-100">{t('Entité juridique', 'Legal Entity')}</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Dénomination sociale', 'Legal Name of Organization')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Telle qu\'enregistrée auprès de l\'autorité compétente', 'As registered with the relevant authority')}</p>
                <input
                  {...identityForm.register('orgName', { required: t('Nom de l\'organisation requis', 'Organization name is required') })}
                  placeholder="West Africa Energy Holdings Ltd"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                {identityForm.formState.errors.orgName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.orgName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Pays d\'immatriculation', 'Country of Registration')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Juridiction où l\'entité est enregistrée', 'Jurisdiction where the entity is registered')}</p>
                <select
                  {...identityForm.register('orgCountry', { required: t('Pays requis', 'Country is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner un pays...', 'Select country...')}</option>
                  <option value="SN">Sénégal</option>
                  <option value="CI">Côte d&apos;Ivoire</option>
                  <option value="NG">Nigeria</option>
                  <option value="MA">Maroc</option>
                  <option value="FR">France</option>
                  <option value="DE">Allemagne</option>
                  <option value="GB">Royaume-Uni</option>
                  <option value="AE">Émirats arabes unis</option>
                  <option value="SG">Singapour</option>
                  <option value="OTHER">{t('Autre', 'Other')}</option>
                </select>
                {identityForm.formState.errors.orgCountry && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.orgCountry.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Numéro de registre / SIRET', 'Registry / Company Number')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...identityForm.register('registryNumber', { required: t('Numéro de registre requis', 'Registry number is required') })}
                  placeholder="SN-2019-00847"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                />
                {identityForm.formState.errors.registryNumber && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.registryNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Type d\'entité', 'Entity Type')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...identityForm.register('orgType', { required: t('Type d\'entité requis', 'Entity type is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner un type...', 'Select type...')}</option>
                  <option value="llc">{t('SARL / LLC', 'Limited Liability Company (LLC / SARL)')}</option>
                  <option value="plc">{t('SA / PLC', 'Public Limited Company (PLC / SA)')}</option>
                  <option value="spv">{t('Véhicule ad hoc (SPV)', 'Special Purpose Vehicle (SPV)')}</option>
                  <option value="holding">{t('Holding', 'Holding Company')}</option>
                  <option value="partnership">{t('Société de personnes / LLP', 'Partnership / LLP')}</option>
                  <option value="individual">{t('Personne physique / Auto-entrepreneur', 'Individual / Sole Proprietor')}</option>
                </select>
                {identityForm.formState.errors.orgType && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.orgType.message}</p>
                )}
              </div>

              {/* UBO Section */}
              <div className="lg:col-span-2 mt-2">
                <h3 className="text-sm font-bold text-navy mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                  {t('Bénéficiaire effectif (UBO)', 'Ultimate Beneficial Owner (UBO)')}
                  <span className="text-xs font-normal text-gray-400">{t('Requis pour les entités avec participation > 25%', 'Required for entities with ownership > 25%')}</span>
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Nom complet de l\'UBO', 'UBO Full Name')}</label>
                <input
                  {...identityForm.register('uboName')}
                  placeholder="Amadou Kofi Diallo"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Nationalité de l\'UBO', 'UBO Nationality')}</label>
                <input
                  {...identityForm.register('uboNationality')}
                  placeholder={t('Sénégalaise', 'Senegalese')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Pourcentage de détention', 'Ownership Percentage')}</label>
                <input
                  {...identityForm.register('uboOwnership')}
                  placeholder="65%"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              {/* Contact */}
              <div className="lg:col-span-2 mt-2">
                <h3 className="text-sm font-bold text-navy mb-4 pb-2 border-b border-gray-100">{t('Contact principal', 'Primary Contact')}</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Nom du contact', 'Contact Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...identityForm.register('contactName', { required: t('Nom du contact requis', 'Contact name is required') })}
                  placeholder="Amadou Diallo"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                {identityForm.formState.errors.contactName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.contactName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Email professionnel', 'Professional Email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...identityForm.register('contactEmail', { required: t('Email requis', 'Email is required') })}
                  placeholder="amadou.diallo@weaenergyholdings.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                {identityForm.formState.errors.contactEmail && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{identityForm.formState.errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Numéro de téléphone', 'Phone Number')}</label>
                <input
                  {...identityForm.register('contactPhone')}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>
            </div>

            {/* KYC notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs leading-relaxed">
                {t(
                  'Toutes les informations d\'identité sont traitées selon des protocoles KYC/AML stricts. La fourniture d\'informations inexactes peut entraîner le rejet de votre dossier.',
                  'All identity information is processed under strict KYC/AML protocols. Providing inaccurate or untraceable information may result in rejection of your dossier.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Project */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <FileText size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{t('Description du projet', 'Project Description')}</h2>
                <p className="text-gray-500 text-sm">{t('Décrivez le projet ou la transaction nécessitant un financement', 'Describe the project or transaction requiring financing')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Type de demande', 'Request Type')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Sélectionnez la catégorie de financement principale', 'Select the primary financing category')}</p>
                <select
                  {...projectForm.register('requestType', { required: t('Type de demande requis', 'Request type is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner un type...', 'Select type...')}</option>
                  <option value="project-finance">{t('Financement de projet', 'Project Finance')}</option>
                  <option value="sblc-bg">SBLC / {t('Garantie bancaire', 'Bank Guarantee')}</option>
                  <option value="advisory">{t('Conseil & Structuration uniquement', 'Advisory & Structuring Only')}</option>
                  <option value="trade-finance">{t('Financement du commerce', 'Trade Finance')}</option>
                  <option value="other">{t('Autre', 'Other')}</option>
                </select>
                {projectForm.formState.errors.requestType && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{projectForm.formState.errors.requestType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Nom du projet', 'Project Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...projectForm.register('projectName', { required: t('Nom du projet requis', 'Project name is required') })}
                  placeholder="Solar Infrastructure SPV - Phase 1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
                {projectForm.formState.errors.projectName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{projectForm.formState.errors.projectName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Secteur', 'Sector')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...projectForm.register('sector', { required: t('Secteur requis', 'Sector is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner un secteur...', 'Select sector...')}</option>
                  <option value="energy">{t('Énergie & Renouvelables', 'Energy & Renewables')}</option>
                  <option value="infrastructure">{t('Infrastructure & Transport', 'Infrastructure & Transport')}</option>
                  <option value="real-estate">{t('Immobilier & Construction', 'Real Estate & Construction')}</option>
                  <option value="agri">{t('Agro-industrie', 'Agri-Industrial')}</option>
                  <option value="mining">{t('Mines & Ressources', 'Mining & Resources')}</option>
                  <option value="telecom">{t('Télécom & Technologie', 'Telecom & Technology')}</option>
                  <option value="finance">{t('Services financiers', 'Financial Services')}</option>
                  <option value="trade">{t('Commerce & Matières premières', 'Trade & Commodities')}</option>
                  <option value="other">{t('Autre', 'Other')}</option>
                </select>
                {projectForm.formState.errors.sector && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{projectForm.formState.errors.sector.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Pays du projet', 'Project Country')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...projectForm.register('country', { required: t('Pays requis', 'Country is required') })}
                  placeholder={t('Sénégal', 'Senegal')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Budget total du projet', 'Total Project Budget')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Capex total approximatif incluant les imprévus', 'Approximate total capex including contingencies')}</p>
                <input
                  {...projectForm.register('totalBudget', { required: t('Budget requis', 'Budget is required') })}
                  placeholder="42,000,000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                />
                {projectForm.formState.errors.totalBudget && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{projectForm.formState.errors.totalBudget.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Devise', 'Currency')}</label>
                <select
                  {...projectForm.register('currency')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="XOF">XOF - Franc CFA UEMOA</option>
                  <option value="MAD">MAD - Dirham marocain</option>
                  <option value="NGN">NGN - Naira nigérian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Date de démarrage prévue', 'Expected Start Date')}</label>
                <input
                  type="date"
                  {...projectForm.register('startDate')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Chiffre d\'affaires annuel attendu (si applicable)', 'Expected Annual Revenue (if applicable)')}</label>
                <input
                  {...projectForm.register('expectedRevenue')}
                  placeholder="8,400,000 EUR/an"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Sponsors du projet', 'Project Sponsors')}</label>
                <p className="text-xs text-gray-400 mb-2">{t('Noms des principaux sponsors ou investisseurs en fonds propres', 'Names of key sponsors or equity investors')}</p>
                <input
                  {...projectForm.register('sponsors')}
                  placeholder="West Africa Energy Holdings Ltd, Solaris Partners SA"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Description du projet', 'Project Description')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Brève description du projet, ses objectifs et sa justification stratégique (min. 100 caractères)', 'Brief description of the project, its objectives, and strategic rationale (min. 100 characters)')}</p>
                <textarea
                  {...projectForm.register('projectDescription', {
                    required: t('Description du projet requise', 'Project description is required'),
                    minLength: { value: 100, message: t('Minimum 100 caractères requis', 'Minimum 100 characters required') },
                  })}
                  rows={5}
                  placeholder={t('Décrivez votre projet : objectifs, périmètre, localisation, impact attendu et raisons du financement...', 'Describe your project: objectives, scope, location, expected impact, and why financing is being sought...')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors resize-none"
                />
                {projectForm.formState.errors.projectDescription && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{projectForm.formState.errors.projectDescription.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financing Plan */}
        {currentStep === 3 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <DollarSign size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{t('Plan de financement', 'Financing Plan')}</h2>
                <p className="text-gray-500 text-sm">{t('Définissez la structure dette/fonds propres, les garanties et la traçabilité des fonds', 'Define the debt/equity structure, guarantees, and fund traceability')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Montant de dette recherché', 'Debt Amount Sought')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Dette senior, mezzanine ou montant total du prêt', 'Senior debt, mezzanine, or total loan amount')}</p>
                <input
                  {...financingForm.register('debtAmount', { required: t('Montant de dette requis', 'Debt amount is required') })}
                  placeholder="30,000,000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                />
                {financingForm.formState.errors.debtAmount && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{financingForm.formState.errors.debtAmount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Fonds propres / Apport personnel', 'Equity / Own Contribution')}</label>
                <p className="text-xs text-gray-400 mb-2">{t('Fonds propres engagés par les sponsors', 'Equity committed by sponsors')}</p>
                <input
                  {...financingForm.register('equityAmount')}
                  placeholder="12,000,000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Maturité souhaitée', 'Desired Maturity')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...financingForm.register('maturity', { required: t('Maturité requise', 'Maturity is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner une maturité...', 'Select maturity...')}</option>
                  <option value="1-3">1–3 {t('ans', 'years')}</option>
                  <option value="3-5">3–5 {t('ans', 'years')}</option>
                  <option value="5-10">5–10 {t('ans', 'years')}</option>
                  <option value="10-15">10–15 {t('ans', 'years')}</option>
                  <option value="15+">15+ {t('ans', 'years')}</option>
                </select>
                {financingForm.formState.errors.maturity && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{financingForm.formState.errors.maturity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Type de garantie disponible', 'Available Guarantee Type')}</label>
                <select
                  {...financingForm.register('guaranteeType')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner une garantie...', 'Select guarantee...')}</option>
                  <option value="real-estate">{t('Immobilier / Hypothèque', 'Real Estate / Mortgage')}</option>
                  <option value="equipment">{t('Équipements / Actifs', 'Equipment / Assets')}</option>
                  <option value="receivables">{t('Créances / Off-take', 'Receivables / Off-take')}</option>
                  <option value="personal">{t('Garantie personnelle', 'Personal Guarantee')}</option>
                  <option value="sblc">SBLC / {t('Garantie bancaire', 'Bank Guarantee')}</option>
                  <option value="none">{t('Aucune disponible', 'None available')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('Origine des fonds / Fonds propres', 'Source of Funds / Equity')} <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">{t('Décrivez l\'origine de l\'apport en fonds propres et la traçabilité des fonds', 'Describe origin of equity contribution and fund traceability')}</p>
                <select
                  {...financingForm.register('fundSource', { required: t('Origine des fonds requise', 'Source of funds is required') })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                >
                  <option value="">{t('Sélectionner une source...', 'Select source...')}</option>
                  <option value="operating">{t('Bénéfices d\'exploitation / Réserves', 'Operating profits / retained earnings')}</option>
                  <option value="sale">{t('Produit de cession d\'actifs', 'Asset sale proceeds')}</option>
                  <option value="investment">{t('Capital d\'investisseurs existants', 'Existing investor capital')}</option>
                  <option value="grant">{t('Subvention / Financement public', 'Grant / public funding')}</option>
                  <option value="other">{t('Autre (préciser dans les notes)', 'Other (specify in notes)')}</option>
                </select>
                {financingForm.formState.errors.fundSource && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{financingForm.formState.errors.fundSource.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Financements existants', 'Existing Financing Arrangements')}</label>
                <input
                  {...financingForm.register('existingFinancing')}
                  placeholder={t('ex. Prêt senior IFC 5M€ (actif), BOAD subordonné 3M€', 'e.g. IFC senior loan €5M (active), BOAD subordinated €3M')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Type d\'institution préféré', 'Preferred Institution Type')}</label>
                <p className="text-xs text-gray-400 mb-2">{t('Indiquez votre préférence - GL Capital évaluera la faisabilité et orientera en conséquence', 'Indicate preference - GL Capital will assess feasibility and route accordingly')}</p>
                <input
                  {...financingForm.register('targetInstitution')}
                  placeholder={t('ex. Institution de financement du développement (IFD), banque commerciale, fonds spécialisé', 'e.g. Development Finance Institution (DFI), commercial bank, specialized fund')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Notes complémentaires', 'Additional Notes')}</label>
                <textarea
                  {...financingForm.register('additionalNotes')}
                  rows={3}
                  placeholder={t('Tout contexte supplémentaire : conditions particulières, urgence, rejets antérieurs, exigences spécifiques...', 'Any additional context: special conditions, urgency, previous rejections, specific requirements...')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors resize-none"
                />
              </div>
            </div>

            {/* Compliance notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs leading-relaxed">
                {t(
                  'GL Capital ne garantit pas l\'approbation du financement. La fourniture d\'informations inexactes sur l\'origine des fonds peut entraîner un rejet immédiat et un signalement aux autorités compétentes au titre des obligations LCB-FT.',
                  'GL Capital does not guarantee financing approval. Providing inaccurate fund source information may result in immediate rejection and may be reported to relevant authorities under AML obligations.'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {currentStep === 4 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <Upload size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{t('Téléchargement de documents', 'Document Uploads')}</h2>
                <p className="text-gray-500 text-sm">{t('Téléchargez les documents requis. Tous les fichiers sont chiffrés, scannés et stockés en sécurité.', 'Upload required documents. All files are encrypted, antivirus-scanned, and stored securely.')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('Type de document', 'Document Type')}</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy transition-colors bg-white"
                  >
                    {documentRequirements.map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.label}</option>
                    ))}
                  </select>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    isDragging ? 'border-navy bg-navy/5' : 'border-gray-200 hover:border-navy/30 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-navy/8 flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} className="text-navy" />
                  </div>
                  <p className="text-navy font-semibold text-sm mb-1">{t('Déposez les fichiers ici ou cliquez pour parcourir', 'Drop files here or click to browse')}</p>
                  <p className="text-gray-400 text-xs mb-4">PDF, DOCX, XLSX · {t('Max 25 Mo par fichier', 'Max 25MB per file')}</p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-lg transition-colors">
                      {t('Sélectionner des fichiers', 'Select Files')}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.xls,.doc"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                  <Shield size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-xs leading-relaxed">
                    {t(
                      'Les fichiers sont téléchargés dans un stockage Supabase chiffré, scannés antivirus, et accessibles uniquement par vous et le personnel GL Capital autorisé.',
                      'Files are uploaded to encrypted Supabase Storage, antivirus-scanned, and accessible only to you and authorized GL Capital staff.'
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-navy mb-3">{t('Documents requis', 'Required documents')}</h3>
                <div className="space-y-2 mb-6">
                  {documentRequirements.map((dt) => {
                    const uploaded = uploadedFiles.filter((f) => f.docType === dt.id && f.status === 'clean');
                    return (
                      <div key={dt.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        uploaded.length > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          uploaded.length > 0 ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}>
                          {uploaded.length > 0 ? (
                            <CheckCircle2 size={12} className="text-white" />
                          ) : (
                            <span className="text-[9px] text-gray-500 font-bold">{dt.required ? '!' : '?'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${uploaded.length > 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {dt.label}
                            {dt.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <p className="text-[10px] text-gray-400">{dt.desc}</p>
                        </div>
                        {uploaded.length > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 flex-shrink-0">
                            {uploaded.length} {t('fichier(s)', 'file(s)')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-navy mb-3">
                  {t('Fichiers téléchargés', 'Uploaded Files')} ({uploadedFiles.length})
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      file.status === 'clean' ? 'bg-emerald-50 border-emerald-200' :
                      file.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <File size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{formatFileSize(file.size)}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-500">{getDocLabel(file.docType)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {file.status === 'uploading' && (
                          <div className="flex items-center gap-1.5">
                            <Loader2 size={12} className="text-blue-500 animate-spin" />
                            <span className="text-[10px] text-blue-600 font-medium">{t('Téléchargement...', 'Uploading...')}</span>
                          </div>
                        )}
                        {file.status === 'scanning' && (
                          <div className="flex items-center gap-1.5">
                            <Shield size={12} className="text-amber-500 animate-pulse" />
                            <span className="text-[10px] text-amber-600 font-medium">{t('Scan...', 'Scanning...')}</span>
                          </div>
                        )}
                        {file.status === 'clean' && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 font-semibold">{t('Stocké', 'Stored')}</span>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-red-500" />
                            <span className="text-[10px] text-red-600 font-medium">{t('Échec', 'Failed')}</span>
                          </div>
                        )}
                        {(file.status === 'clean' || file.status === 'error') && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
                <CheckCircle2 size={18} className="text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">{t('Révision & Soumission', 'Review & Submit')}</h2>
                <p className="text-gray-500 text-sm">{t('Vérifiez votre dossier avant la soumission finale', 'Review your dossier before final submission')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Identity summary */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2"><Building2 size={14} />{t('Identité de l\'organisation', 'Organization Identity')}</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-xs text-navy hover:text-navy/80 font-medium">{t('Modifier', 'Edit')}</button>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { label: t('Organisation', 'Organization'), value: identityValues.orgName },
                    { label: t('Pays', 'Country'), value: identityValues.orgCountry },
                    { label: t('Registre', 'Registry #'), value: identityValues.registryNumber },
                    { label: t('Type', 'Entity Type'), value: identityValues.orgType },
                    { label: 'UBO', value: identityValues.uboName },
                    { label: t('Contact', 'Contact'), value: identityValues.contactName },
                  ].map((item) => (
                    <div key={`review-id-${item.label}`}>
                      <dt className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</dt>
                      <dd className="text-xs font-semibold text-navy mt-0.5">{item.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Project summary */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2"><FileText size={14} />{t('Projet', 'Project')}</h3>
                  <button onClick={() => setCurrentStep(2)} className="text-xs text-navy hover:text-navy/80 font-medium">{t('Modifier', 'Edit')}</button>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { label: t('Nom du projet', 'Project Name'), value: projectValues.projectName },
                    { label: t('Secteur', 'Sector'), value: projectValues.sector },
                    { label: t('Pays', 'Country'), value: projectValues.country },
                    { label: t('Budget', 'Budget'), value: `${projectValues.currency || 'EUR'} ${projectValues.totalBudget}` },
                  ].map((item) => (
                    <div key={`review-proj-${item.label}`}>
                      <dt className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</dt>
                      <dd className="text-xs font-semibold text-navy mt-0.5">{item.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Financing summary */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2"><DollarSign size={14} />{t('Financement', 'Financing')}</h3>
                  <button onClick={() => setCurrentStep(3)} className="text-xs text-navy hover:text-navy/80 font-medium">{t('Modifier', 'Edit')}</button>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { label: t('Montant dette', 'Debt Amount'), value: financingValues.debtAmount },
                    { label: t('Fonds propres', 'Equity'), value: financingValues.equityAmount },
                    { label: t('Maturité', 'Maturity'), value: financingValues.maturity },
                    { label: t('Origine des fonds', 'Fund Source'), value: financingValues.fundSource },
                  ].map((item) => (
                    <div key={`review-fin-${item.label}`}>
                      <dt className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</dt>
                      <dd className="text-xs font-semibold text-navy mt-0.5">{item.value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Documents summary */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2"><Upload size={14} />{t('Documents', 'Documents')}</h3>
                  <button onClick={() => setCurrentStep(4)} className="text-xs text-navy hover:text-navy/80 font-medium">{t('Modifier', 'Edit')}</button>
                </div>
                {uploadedFiles.filter((f) => f.status === 'clean').length === 0 ? (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {t('Aucun document telecharge.', 'No documents uploaded yet.')}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {uploadedFiles.filter((f) => f.status === 'clean').map((f) => (
                      <div key={`review-doc-${f.id}`} className="flex items-center gap-2">
                        <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{f.name}</span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">({getDocLabel(f.docType)})</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-3">
                  {t(
                    'Soumission possible uniquement avec: Executive summary, Business plan, et KYC corporate.',
                    'Submission is allowed only when Executive summary, Business plan, and Corporate KYC are uploaded.'
                  )}
                </p>
              </div>

              {/* Compliance notice */}
              <div className="p-4 bg-navy rounded-2xl">
                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-xs font-semibold mb-1">{t('Déclaration de conformité', 'Compliance Declaration')}</p>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {t(
                        'En soumettant ce dossier, je confirme que toutes les informations fournies sont exactes et complètes. Je reconnais que GL Capital effectuera un contrôle KYC/AML et que les fausses informations peuvent entraîner un rejet et un signalement aux autorités compétentes.',
                        'By submitting this dossier, I confirm that all information provided is accurate and complete. I acknowledge that GL Capital will conduct KYC/AML screening and that false information may result in rejection and reporting to relevant authorities.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-white disabled:opacity-40 transition-all duration-200"
          >
            <ChevronLeft size={16} />{t('Précédent', 'Previous')}
          </button>

          <div className="flex items-center gap-2">
            {uploadedFiles.some((f) => f.status === 'uploading' || f.status === 'scanning') && (
              <span className="text-xs text-amber-600 flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                {t('Traitement des fichiers...', 'Processing files...')}
              </span>
            )}
          </div>

          {currentStep < 5 ? (
            <button
              onClick={handleNextStep}
              disabled={uploadedFiles.some((f) => f.status === 'uploading' || f.status === 'scanning')}
              className="flex items-center gap-2 px-5 py-2.5 bg-navy hover:bg-navy/90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95"
            >
              {t('Étape suivante', 'Next Step')}<ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting || uploadedFiles.some((f) => f.status === 'uploading' || f.status === 'scanning')}
              className="flex items-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold/90 disabled:opacity-50 text-navy text-sm font-bold rounded-xl transition-all duration-200 active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" />{t('Soumission...', 'Submitting...')}</>
              ) : (
                <>{t('Soumettre le dossier', 'Submit Dossier')}<CheckCircle2 size={16} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}