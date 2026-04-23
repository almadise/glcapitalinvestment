'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  File,
  Eye,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Suspense } from 'react';
import DocumentViewerModal from '@/components/DocumentViewerModal';

interface DocumentRecord {
  id: string;
  case_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function DocumentsContent() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user, caseId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
      if (caseId) query = query.eq('case_id', caseId);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploadError(null);
    setUploadSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(lang === 'fr' ? 'Type de fichier non autorisé. Formats acceptés : PDF, DOCX, XLSX.' : 'File type not allowed. Accepted formats: PDF, DOCX, XLSX.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(lang === 'fr' ? 'Fichier trop volumineux. Taille maximale : 10 Mo.' : 'File too large. Maximum size: 10MB.');
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = caseId
        ? `${user.id}/${caseId}/${safeName}`
        : `${user.id}/general/${safeName}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
      const fileUrl = urlData?.publicUrl || storagePath;

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        case_id: caseId || null,
        file_name: file.name,
        file_url: fileUrl,
      });

      if (dbError) throw dbError;

      setUploadSuccess(lang === 'fr' ? `"${file.name}" téléversé avec succès.` : `"${file.name}" uploaded successfully.`);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (doc: DocumentRecord) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce document ?' : 'Delete this document?')) return;
    try {
      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression.');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const formatSize = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy">
          {lang === 'fr' ? 'Documents' : 'Documents'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {caseId
            ? (lang === 'fr' ? 'Documents liés à ce dossier' : 'Documents linked to this case file')
            : (lang === 'fr' ? 'Tous vos documents téléversés' : 'All your uploaded documents')}
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? 'border-navy bg-navy/5' : 'border-slate-200 hover:border-navy/40 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.doc,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-navy" />
            <p className="text-navy font-medium text-sm">
              {lang === 'fr' ? 'Téléversement en cours...' : 'Uploading...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
              <Upload size={22} className="text-navy" />
            </div>
            <div>
              <p className="font-semibold text-navy text-sm">
                {lang === 'fr' ? 'Glissez un fichier ici ou cliquez pour parcourir' : 'Drag a file here or click to browse'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {lang === 'fr' ? 'PDF, DOCX, XLSX - max 10 Mo' : 'PDF, DOCX, XLSX - max 10MB'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback messages */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{uploadError}</p>
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium text-sm">
            {lang === 'fr' ? 'Aucun document téléversé' : 'No documents uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center flex-shrink-0">
                <File size={16} className="text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{doc.file_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSize(doc.file_name)} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { setViewerDoc(doc); setViewerOpen(true); }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors"
                  title={lang === 'fr' ? 'Aperçu' : 'Preview'}
                >
                  <Eye size={15} />
                </button>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy transition-colors"
                  title={lang === 'fr' ? 'Télécharger' : 'Download'}
                >
                  <Download size={15} />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document viewer modal */}
      {viewerDoc && (
        <DocumentViewerModal
          isOpen={viewerOpen}
          onClose={() => { setViewerOpen(false); setViewerDoc(null); }}
          fileUrl={viewerDoc.file_url}
          fileName={viewerDoc.file_name}
          uploadedAt={viewerDoc.uploaded_at}
        />
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-navy" />
        </div>
      }>
        <DocumentsContent />
      </Suspense>
    </DashboardLayout>
  );
}
