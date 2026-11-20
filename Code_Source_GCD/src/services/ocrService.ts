import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker, OEM, PSM, setLogging } from 'tesseract.js';
import type { Block } from 'tesseract.js';
import { IdentityDocumentType, IdentityOcrExtractionResult } from '../types';
import { OcrLineInput, parseIdentityOcrText } from './ocrParser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Disable internal Tesseract logging to prevent sensitive data from ever entering browser logs
setLogging(false);

export const OCR_MAX_FILE_SIZE_MB = 15;
export const OCR_MAX_FILE_SIZE_BYTES = OCR_MAX_FILE_SIZE_MB * 1024 * 1024;
export const OCR_ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

export interface OcrFileValidationResult {
  valid: boolean;
  kind?: 'image' | 'pdf';
  errorMessage?: string;
}

export interface OcrProgressUpdate {
  percent: number;
  stageLabel: string;
}

export interface OcrRunOutput {
  extraction: IdentityOcrExtractionResult;
  previewObjectUrl: string | null;
  fileKind: 'image' | 'pdf';
  pageCount: number;
}

function getFileExtension(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.');
  return dotIdx >= 0 ? fileName.slice(dotIdx).toLowerCase() : '';
}

export async function validateIdentityDocumentFile(
  file: File
): Promise<OcrFileValidationResult> {
  const ext = getFileExtension(file.name);
  const mime = (file.type || '').toLowerCase();

  const isAllowedExt = OCR_ACCEPTED_EXTENSIONS.includes(ext);
  const isImageMime = mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png';
  const isPdfMime = mime === 'application/pdf';

  if (!isAllowedExt && !isImageMime && !isPdfMime) {
    return {
      valid: false,
      errorMessage:
        'Format non accepté. Veuillez déposer un fichier au format JPG, JPEG, PNG ou PDF.'
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      errorMessage: 'Le fichier sélectionné est vide (0 octet). Veuillez choisir un document valide.'
    };
  }

  if (file.size > OCR_MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorMessage: `Le fichier dépasse la taille maximale autorisée (${OCR_MAX_FILE_SIZE_MB} Mo).`
    };
  }

  // Verify magic bytes so renamed/corrupted files are rejected immediately
  const headerSlice = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(headerSlice);

  const isPdfHeader =
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d; // -

  const isPngHeader =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  const isJpegHeader =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  if (ext === '.pdf' || isPdfMime) {
    if (!isPdfHeader) {
      return {
        valid: false,
        errorMessage:
          'Le fichier PDF sélectionné est invalide ou corrompu (signature %PDF- manquante).'
      };
    }
    return { valid: true, kind: 'pdf' };
  }

  if (!isPngHeader && !isJpegHeader) {
    return {
      valid: false,
      errorMessage:
        'Le fichier image semble corrompu ou ne correspond pas à un format JPG / PNG authentique.'
    };
  }

  return { valid: true, kind: 'image' };
}

interface QualityDiagnostic {
  warnings: string[];
  isLikelyBlankOrUnreadable: boolean;
}

/**
 * Evaluates image sharpness (Laplacian edge variance), brightness, and contrast
 * locally in memory to detect blurry, dark, overexposed, or blank captures.
 */
function analyzeCanvasQuality(canvas: HTMLCanvasElement): QualityDiagnostic {
  const warnings: string[] = [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return {
      warnings: ['Impossible d’analyser la résolution de l’image.'],
      isLikelyBlankOrUnreadable: true
    };
  }

  if (canvas.width < 320 || canvas.height < 180) {
    warnings.push(
      'Résolution faible détectée : utilisez une image plus nette et en pleine taille pour améliorer la lecture.'
    );
  }

  // Downsample up to 400px wide for fast luminance & edge analysis
  const sampleW = Math.min(400, canvas.width);
  const sampleH = Math.max(1, Math.round((canvas.height / canvas.width) * sampleW));
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sCtx) {
    return { warnings, isLikelyBlankOrUnreadable: false };
  }

  sCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
  const imgData = sCtx.getImageData(0, 0, sampleW, sampleH).data;
  const n = sampleW * sampleH;
  const gray = new Float32Array(n);
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
    gray[i] = lum;
    sum += lum;
  }

  const meanLum = sum / n;
  let varianceSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = gray[i] - meanLum;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / n);

  // Laplacian variance for blur / sharpness estimation
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const idx = y * sampleW + x;
      const lap =
        gray[idx - sampleW] +
        gray[idx + sampleW] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount++;
    }
  }
  const lapMean = lapCount > 0 ? lapSum / lapCount : 0;
  const lapVariance = lapCount > 0 ? lapSqSum / lapCount - lapMean * lapMean : 0;

  // Wipe sample canvas buffer immediately
  sampleCanvas.width = 0;
  sampleCanvas.height = 0;

  let isLikelyBlankOrUnreadable = false;

  if (stdDev < 8) {
    warnings.push('Document presque uniforme ou page blanche détectée : aucun texte exploitable visible.');
    isLikelyBlankOrUnreadable = true;
  } else {
    if (meanLum < 55) {
      warnings.push('Image trop sombre : éclairez davantage le document sans créer de reflet.');
    } else if (meanLum > 242 && stdDev < 24) {
      warnings.push('Image surexposée ou contenant un fort reflet blanc.');
    }
    if (lapVariance < 45) {
      warnings.push('Image potentiellement floue : veillez à ce que le texte soit parfaitement net.');
    }
  }

  return { warnings, isLikelyBlankOrUnreadable };
}

/**
 * Produces an OCR-optimized offscreen canvas (upscaled, grayscale, contrast-stretched)
 * without altering the preview image shown to the user.
 */
function preprocessCanvasForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const targetWidth =
    source.width < 1400
      ? Math.min(2000, Math.round(source.width * Math.min(2.2, 1600 / Math.max(1, source.width))))
      : Math.min(2400, source.width);
  const scale = targetWidth / Math.max(1, source.width);
  const targetHeight = Math.max(1, Math.round(source.height * scale));

  const out = document.createElement('canvas');
  out.width = targetWidth;
  out.height = targetHeight;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return out;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;

  // Compute luminance histogram to stretch contrast cleanly (2nd to 98th percentile)
  const hist = new Uint32Array(256);
  const totalPixels = targetWidth * targetHeight;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[lum]++;
  }

  let lowClip = 0;
  let highClip = 255;
  let acc = 0;
  const lowThresh = totalPixels * 0.02;
  const highThresh = totalPixels * 0.98;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= lowThresh) {
      lowClip = v;
      break;
    }
  }
  acc = 0;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc >= totalPixels - highThresh) {
      highClip = v;
      break;
    }
  }

  const range = Math.max(20, highClip - lowClip);
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const stretched = Math.max(0, Math.min(255, Math.round(((lum - lowClip) * 255) / range)));
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}

async function decodeImageFileToCanvas(
  file: File
): Promise<{ canvas: HTMLCanvasElement; previewUrl: string }> {
  const previewUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Impossible de décoder ce fichier image.'));
      img.src = previewUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Contexte graphique indisponible pour analyser l’image.');
    }
    ctx.drawImage(img, 0, 0);
    return { canvas, previewUrl };
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    throw err;
  }
}

async function renderPdfToCanvases(
  file: File,
  maxPages: number = 2
): Promise<{
  canvases: HTMLCanvasElement[];
  previewUrl: string | null;
  totalPages: number;
}> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    standardFontDataUrl: '/pdfjs/standard_fonts/'
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    await loadingTask.destroy();
    throw new Error('Le document PDF ne contient aucune page exploitable.');
  }

  const pagesToRender = Math.min(totalPages, maxPages);
  const canvases: HTMLCanvasElement[] = [];
  let previewUrl: string | null = null;

  try {
    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        page.cleanup();
        throw new Error('Contexte graphique indisponible lors du rendu PDF.');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        canvas,
        viewport
      }).promise;

      page.cleanup();
      canvases.push(canvas);

      if (pageNum === 1) {
        previewUrl = await new Promise<string | null>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob ? URL.createObjectURL(blob) : null);
            },
            'image/png',
            0.9
          );
        });
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return { canvases, previewUrl, totalPages };
}

function collectLinesFromBlocks(blocks: Block[] | null | undefined): OcrLineInput[] {
  if (!blocks) return [];
  const collected: OcrLineInput[] = [];
  for (const block of blocks) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const clean = (line.text || '').trim();
        if (clean) {
          collected.push({
            text: clean,
            confidence: typeof line.confidence === 'number' ? line.confidence : block.confidence || 70
          });
        }
      }
    }
  }
  return collected;
}

/**
 * Executes privacy-first local OCR (Tesseract.js WASM) directly inside the browser.
 * Sensitive identity files are never transmitted externally and temporary buffers
 * are cleared immediately after extraction.
 */
export async function extractIdentityFromDocument(
  file: File,
  documentType: IdentityDocumentType,
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<OcrRunOutput> {
  onProgress?.({ percent: 5, stageLabel: 'Validation sécurisée du format de fichier...' });

  const validation = await validateIdentityDocumentFile(file);
  if (!validation.valid || !validation.kind) {
    throw new Error(validation.errorMessage || 'Format de document invalide.');
  }

  const rawCanvases: HTMLCanvasElement[] = [];
  const processedCanvases: HTMLCanvasElement[] = [];
  let previewObjectUrl: string | null = null;
  let totalPages = 1;
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    if (validation.kind === 'pdf') {
      onProgress?.({ percent: 15, stageLabel: 'Conversion sécurisée des pages PDF en image...' });
      const pdfRendered = await renderPdfToCanvases(file, 2);
      rawCanvases.push(...pdfRendered.canvases);
      previewObjectUrl = pdfRendered.previewUrl;
      totalPages = pdfRendered.totalPages;
    } else {
      onProgress?.({ percent: 15, stageLabel: 'Chargement local de l’image...' });
      const imgDecoded = await decodeImageFileToCanvas(file);
      rawCanvases.push(imgDecoded.canvas);
      previewObjectUrl = imgDecoded.previewUrl;
    }

    onProgress?.({ percent: 25, stageLabel: 'Analyse de la netteté et préparation optique...' });
    const allQualityWarnings: string[] = [];
    let allBlank = true;

    for (const rawCanvas of rawCanvases) {
      const diag = analyzeCanvasQuality(rawCanvas);
      for (const w of diag.warnings) {
        if (!allQualityWarnings.includes(w)) allQualityWarnings.push(w);
      }
      if (!diag.isLikelyBlankOrUnreadable) {
        allBlank = false;
      }
      processedCanvases.push(preprocessCanvasForOcr(rawCanvas));
    }

    if (allBlank) {
      const emptyExtraction = parseIdentityOcrText('', documentType, [], allQualityWarnings);
      return {
        extraction: emptyExtraction,
        previewObjectUrl,
        fileKind: validation.kind,
        pageCount: totalPages
      };
    }

    onProgress?.({ percent: 35, stageLabel: 'Initialisation du moteur OCR local (Tesseract)...' });

    worker = await createWorker(['fra', 'eng'], OEM.LSTM_ONLY, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract',
      langPath: '/tesseract/lang',
      cacheMethod: 'none',
      logger: (msg) => {
        if (msg.status === 'recognizing text' && typeof msg.progress === 'number') {
          const pct = Math.min(92, Math.round(45 + msg.progress * 47));
          onProgress?.({
            percent: pct,
            stageLabel: 'Extraction optique des informations en cours...'
          });
        }
      },
      errorHandler: () => {
        // Handled via promise rejection without leaking file contents to console
      }
    });

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1'
    });

    const combinedLines: OcrLineInput[] = [];
    const combinedTexts: string[] = [];

    for (let idx = 0; idx < processedCanvases.length; idx++) {
      onProgress?.({
        percent: 45 + Math.round((idx / processedCanvases.length) * 40),
        stageLabel:
          processedCanvases.length > 1
            ? `Lecture OCR de la page ${idx + 1}/${processedCanvases.length}...`
            : 'Reconnaissance optique des caractères (OCR)...'
      });

      const ocrPromise = worker.recognize(
        processedCanvases[idx],
        { rotateAuto: true },
        { text: true, blocks: true }
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Le traitement OCR a expiré. Veuillez réessayer avec une image plus nette ou saisir manuellement.'));
        }, 45000);
      });

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      if (result?.data?.text) {
        combinedTexts.push(result.data.text);
      }
      const lines = collectLinesFromBlocks(result?.data?.blocks);
      if (lines.length > 0) {
        combinedLines.push(...lines);
      } else if (result?.data?.text) {
        const fallbackConf = typeof result.data.confidence === 'number' ? result.data.confidence : 65;
        result.data.text.split(/\r?\n/).forEach((t) => {
          const clean = t.trim();
          if (clean) combinedLines.push({ text: clean, confidence: fallbackConf });
        });
      }
    }

    onProgress?.({ percent: 96, stageLabel: 'Structuration et vérification de cohérence...' });

    const extraction = parseIdentityOcrText(
      combinedTexts.join('\n'),
      documentType,
      combinedLines,
      allQualityWarnings
    );

    onProgress?.({ percent: 100, stageLabel: 'Analyse terminée.' });

    return {
      extraction,
      previewObjectUrl,
      fileKind: validation.kind,
      pageCount: totalPages
    };
  } catch (err) {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
    throw err;
  } finally {
    // Immediate cleanup of temporary canvas image buffers & worker
    for (const c of rawCanvases) {
      c.width = 0;
      c.height = 0;
    }
    for (const c of processedCanvases) {
      c.width = 0;
      c.height = 0;
    }
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore termination failure
      }
    }
  }
}
