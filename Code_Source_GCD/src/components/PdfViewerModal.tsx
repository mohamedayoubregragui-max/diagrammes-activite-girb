import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import {
  ApplicationDossier,
  AuthenticatedUser,
  JustificatifDocument
} from '../types';
import {
  canUserAccessDossierDocuments,
  downloadDocumentPdf,
  loadDocumentPdfBytes
} from '../services/fileStorage';
import {
  formatDocumentDate,
  getDocumentStatusMeta
} from '../services/documentService';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

interface PdfViewerModalProps {
  documentItem: JustificatifDocument | null;
  onClose: () => void;
  dossier?: ApplicationDossier | null;
  currentUser?: AuthenticatedUser | null;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  documentItem,
  onClose,
  dossier = null,
  currentUser = null
}) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  // Load binary PDF bytes and initialize PDF.js document
  useEffect(() => {
    if (!documentItem) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setLoadError(null);
      return;
    }

    let isCancelled = false;
    let activeBlobUrl: string | null = null;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;

    const loadPdf = async () => {
      setIsLoading(true);
      setLoadError(null);
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);

      try {
        if (currentUser && dossier && !canUserAccessDossierDocuments(currentUser, dossier)) {
          throw new Error(
            'Accès refusé : vous ne disposez pas des permissions requises pour consulter ce document.'
          );
        }

        const { bytes } = await loadDocumentPdfBytes(documentItem);
        if (isCancelled) return;

        // Create Blob URL for Download & Open in New Tab
        const blob = new Blob([bytes.slice().buffer], { type: 'application/pdf' });
        activeBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(activeBlobUrl);

        // Pass a fresh copy of Uint8Array so PDF.js worker transfer doesn't detach original
        loadingTask = pdfjsLib.getDocument({
          data: bytes.slice(),
          useWorkerFetch: false,
          standardFontDataUrl: '/pdfjs/standard_fonts/'
        });

        const pdf = await loadingTask.promise;
        if (isCancelled) {
          await loadingTask.destroy();
          return;
        }

        pageRefs.current = new Array(pdf.numPages).fill(null);
        canvasRefs.current = new Array(pdf.numPages).fill(null);
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        if (!isCancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Impossible de charger ou décoder le fichier PDF.';
          setLoadError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
      setBlobUrl(null);
    };
  }, [
    documentItem?.id,
    documentItem?.storageKey,
    documentItem?.fileUrl,
    documentItem?.fileData,
    documentItem?.version,
    currentUser,
    dossier
  ]);

  // Render every page cleanly to its <canvas> whenever pdfDoc or zoom scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    let cancelled = false;
    const renderTasks: RenderTask[] = [];

    const renderAllPages = async () => {
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (cancelled) return;
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        try {
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale });
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const transform =
            outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

          const task = page.render({
            canvas,
            canvasContext: context,
            transform,
            viewport
          });
          renderTasks.push(task);
          await task.promise;
        } catch (err: unknown) {
          const errName = (err as { name?: string })?.name;
          if (errName !== 'RenderingCancelledException' && !cancelled) {
            console.error(`Erreur rendu PDF page ${pageNum}:`, err);
          }
        }
      }
    };

    renderAllPages();

    return () => {
      cancelled = true;
      renderTasks.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // Ignore cancellation errors
        }
      });
    };
  }, [pdfDoc, numPages, scale]);

  // Update active page number as user scrolls through pages
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages <= 1) return;

    const containerTop = container.getBoundingClientRect().top;
    let closestPage = 1;
    let closestDist = Infinity;

    for (let i = 0; i < numPages; i++) {
      const el = pageRefs.current[i];
      if (!el) continue;
      const dist = Math.abs(el.getBoundingClientRect().top - containerTop - 24);
      if (dist < closestDist) {
        closestDist = dist;
        closestPage = i + 1;
      }
    }
    setCurrentPage(closestPage);
  }, [numPages]);

  const goToPage = (targetPage: number) => {
    const clamped = Math.max(1, Math.min(numPages, targetPage));
    setCurrentPage(clamped);
    const el = pageRefs.current[clamped - 1];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!documentItem) return null;

  const statusMeta = getDocumentStatusMeta(documentItem.status);
  const techCheck = documentItem.technicalCheck;
  const downloadFileName =
    documentItem.fileName && documentItem.fileName.toLowerCase().endsWith('.pdf')
      ? documentItem.fileName
      : `${documentItem.fileName || documentItem.label || 'document'}.pdf`;

  const handleDownload = async () => {
    try {
      await downloadDocumentPdf(documentItem);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Impossible de télécharger ce fichier PDF.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-white truncate">
                  {documentItem.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase shrink-0">
                  PDF {documentItem.version ? `v${documentItem.version}` : ''}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5 font-mono truncate">
                <span className="truncate">{documentItem.fileName || 'Aucun fichier'}</span>
                {documentItem.fileSize && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      {documentItem.fileSize}
                    </span>
                  </>
                )}
                {documentItem.uploadDate && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDocumentDate(documentItem.uploadDate)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                title="Ouvrir le PDF dans un nouvel onglet"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Nouvel onglet</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={!blobUrl && !documentItem.fileUrl && !documentItem.storageKey && !documentItem.fileData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Télécharger le document PDF original"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Technical Check vs Administrative Status Bar */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            {techCheck ? (
              techCheck.isPdfFormatValid && techCheck.isSizeValid && techCheck.isIntegrityValid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Contrôle technique valide (PDF intègre · ≤ {techCheck.maxAllowedSizeMb} Mo)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{techCheck.summary}</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Document déposé au format PDF</span>
              </span>
            )}
            {techCheck?.sha256Short && (
              <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                SHA-256: #{techCheck.sha256Short}
              </span>
            )}
          </div>

          <div className="text-slate-600 text-[11px]">
            Validation administrative : <strong className="text-slate-900">{statusMeta.label}</strong>
            {documentItem.reviewedBy ? ` (par ${documentItem.reviewedBy})` : ''}
          </div>
        </div>

        {/* PDF.js Controls Toolbar (Pagination & Zoom) */}
        <div className="px-4 py-2 bg-slate-800 text-slate-200 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Page Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={numPages === 0 || currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded bg-slate-900/70 border border-slate-700 font-mono text-[11px]">
              {numPages > 0 ? `Page ${currentPage} / ${numPages}` : 'Chargement...'}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={numPages === 0 || currentPage >= numPages}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.2).toFixed(2))))}
              disabled={scale <= 0.5}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 rounded bg-slate-900/70 border border-slate-700 font-mono text-[11px] min-w-[54px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(2.4, Number((s + 0.2).toFixed(2))))}
              disabled={scale >= 2.4}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1.15)}
              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Réinitialiser le zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Lecteur PDF.js intégré GCD
          </div>
        </div>

        {/* Multi-page PDF.js Canvas Viewport */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="p-4 sm:p-6 bg-slate-900 overflow-y-auto h-[560px] flex flex-col items-center gap-5"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs font-medium">
                Chargement et rendu du document PDF ({downloadFileName})...
              </p>
            </div>
          ) : loadError ? (
            <div className="max-w-lg my-auto p-6 rounded-2xl bg-slate-800 border border-red-500/40 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">
                Impossible d’afficher le document PDF
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{loadError}</p>
              {blobUrl && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          ) : numPages > 0 ? (
            Array.from({ length: numPages }, (_, idx) => (
              <div
                key={`pdf-page-${idx + 1}`}
                ref={(el) => {
                  pageRefs.current[idx] = el;
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden ring-1 ring-slate-700">
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[idx] = el;
                    }}
                    className="block"
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Page {idx + 1} sur {numPages}
                </span>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3 my-auto">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="font-medium text-slate-300 text-xs">
                Aucun fichier PDF réel n’est associé à ce document.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Observation / Décision :{' '}
            <span className="font-semibold text-slate-800">
              {documentItem.remark || 'Aucune remarque consignée'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Fermer le lecteur
          </button>
        </div>
      </div>
    </div>
  );
};
