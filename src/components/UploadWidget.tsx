'use client';
import React, { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

interface UploadWidgetProps {
  caseId: string;
  onUploadComplete?: (files: { name: string; url: string }[]) => void;
  compact?: boolean;
  analystEmail?: string;
  analystName?: string;
  portal?: 'analyst' | 'compliance';
  caseTitle?: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadWidget({ caseId, onUploadComplete, compact = false, analystEmail, analystName, portal, caseTitle }: UploadWidgetProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Type non supporté. Formats acceptés : PDF, DOCX, XLSX, DOC, XLS, JPG, PNG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Fichier trop volumineux (max 10 MB)`;
    }
    return null;
  };

  const uploadFile = async (file: File, fileId: string) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `${user.id}/${caseId}/${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const fileUrl = urlData?.publicUrl || path;

      // Save metadata to documents table
      await supabase.from('documents').insert({
        case_id: caseId,
        user_id: user.id,
        file_name: file.name,
        file_url: fileUrl,
      });

      setFiles((prev) =>
        prev.map((f) => f.id === fileId ? { ...f, status: 'done', url: fileUrl } : f)
      );

      // Send upload notification email if analyst/compliance context provided
      if (analystEmail && portal) {
        fetch('/api/send-upload-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analystName: analystName || analystEmail,
            analystEmail,
            caseTitle: caseTitle || caseId,
            caseId,
            fileName: file.name,
            fileSize: file.size,
            portal,
          }),
        }).catch(() => {});
      }

      return { name: file.name, url: fileUrl };
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) => f.id === fileId ? { ...f, status: 'error', error: err.message || 'Erreur upload' } : f)
      );
      return null;
    }
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    const validFiles: { file: File; id: string }[] = [];

    Array.from(fileList).forEach((file) => {
      const error = validateFile(file);
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      if (error) {
        newFiles.push({ id, name: file.name, size: file.size, status: 'error', error });
      } else {
        newFiles.push({ id, name: file.name, size: file.size, status: 'uploading' });
        validFiles.push({ file, id });
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
    if (validFiles.length === 0) return;

    setUploading(true);
    const results = await Promise.all(validFiles.map(({ file, id }) => uploadFile(file, id)));
    setUploading(false);

    const successful = results.filter(Boolean) as { name: string; url: string }[];
    if (successful.length > 0) {
      toast.success(`${successful.length} fichier(s) téléversé(s) avec succès`);
      onUploadComplete?.(successful);
    }
  }, [user, caseId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  if (compact) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-blue-300 transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
          Joindre des fichiers
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden" onChange={handleInputChange} />
        {files.length > 0 && (
          <div className="space-y-1">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                {f.status === 'uploading' && <Loader2 size={11} className="animate-spin text-blue-500 flex-shrink-0" />}
                {f.status === 'done' && <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />}
                {f.status === 'error' && <AlertCircle size={11} className="text-red-500 flex-shrink-0" />}
                <span className="flex-1 truncate text-slate-700">{f.name}</span>
                <button onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0"><X size={11} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-blue-400 bg-blue-50' :'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dragging ? 'bg-blue-100' : 'bg-white border border-slate-200'}`}>
            <Upload size={18} className={dragging ? 'text-blue-600' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {dragging ? 'Déposez les fichiers ici' : 'Glissez-déposez ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">PDF, DOCX, XLSX, DOC, XLS, JPG, PNG — max 10 MB par fichier</p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fichiers ({files.length})</p>
          {files.map((f) => (
            <div key={f.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm ${
              f.status === 'done' ? 'bg-emerald-50 border-emerald-200' :
              f.status === 'error'? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
            }`}>
              <FileText size={14} className={
                f.status === 'done' ? 'text-emerald-600' :
                f.status === 'error'? 'text-red-500' : 'text-slate-400'
              } />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{f.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(f.size)}</p>
                {f.status === 'error' && f.error && (
                  <p className="text-xs text-red-600 mt-0.5">{f.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                {f.status === 'done' && <CheckCircle2 size={14} className="text-emerald-500" />}
                {f.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                <button onClick={() => removeFile(f.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
