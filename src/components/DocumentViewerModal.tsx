'use client';
import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Image,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  uploaderName?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(fileName: string): 'pdf' | 'image' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'other';
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileSize,
  uploadedAt,
  uploaderName,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fileType = getFileType(fileName);

  useEffect(() => {
    if (!isOpen) {
      setZoom(100);
      setRotation(0);
      setImgLoaded(false);
      setImgError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center flex-shrink-0">
            {fileType === 'image' ? (
              <Image size={16} className="text-navy" />
            ) : (
              <FileText size={16} className="text-navy" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy truncate">{fileName}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              {fileSize && <span>{formatBytes(fileSize)}</span>}
              {uploadedAt && (
                <span>
                  {new Date(uploadedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
              {uploaderName && <span>par {uploaderName}</span>}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {fileType === 'image' && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  title="Zoom arrière"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs text-slate-500 w-10 text-center font-medium">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  title="Zoom avant"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Rotation"
                >
                  <RotateCw size={15} />
                </button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
              </>
            )}
            <a
              href={fileUrl}
              download={fileName}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Télécharger"
            >
              <Download size={15} />
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors ml-1"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-0">
          {fileType === 'pdf' ? (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full min-h-[500px]"
              title={fileName}
              style={{ border: 'none' }}
            />
          ) : fileType === 'image' ? (
            <div className="p-6 flex items-center justify-center w-full h-full">
              {!imgLoaded && !imgError && (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin" />
                  <span className="text-sm">Chargement…</span>
                </div>
              )}
              {imgError && (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FileText size={40} />
                  <p className="text-sm">Impossible de charger l&apos;image.</p>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-navy underline"
                  >
                    Ouvrir dans un nouvel onglet
                  </a>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={fileName}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  setImgError(true);
                  setImgLoaded(true);
                }}
                style={{
                  display: imgLoaded && !imgError ? 'block' : 'none',
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <FileText size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-sm mb-1">{fileName}</p>
                <p className="text-slate-400 text-xs mb-4">
                  Ce type de fichier ne peut pas être prévisualisé directement.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={fileUrl}
                  download={fileName}
                  className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
                >
                  <Download size={14} />
                  Télécharger
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink size={14} />
                  Ouvrir
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
