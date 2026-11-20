import {
  ApplicationDossier,
  AuthenticatedUser,
  JustificatifDocument
} from '../types';
import { hasAnyRole, hasPrivilege } from './storage';

const IDB_NAME = 'gcd_pdf_storage_v1';
const IDB_VERSION = 1;
const IDB_STORE = 'pdf_files';

// In-memory cache for immediate access across role switches within the session
const memoryPdfCache = new Map<string, Uint8Array>();

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB est indisponible dans cet environnement navigateur.'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Impossible d’ouvrir le stockage documentaire IndexedDB.'));
  });
}

/**
 * Persists a real uploaded File/Blob/ArrayBuffer in IndexedDB and in memory.
 */
export async function savePdfBinary(
  storageKey: string,
  source: File | Blob | ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  let bytes: Uint8Array;
  if (source instanceof Uint8Array) {
    bytes = source;
  } else if (source instanceof ArrayBuffer) {
    bytes = new Uint8Array(source);
  } else {
    const buffer = await source.arrayBuffer();
    bytes = new Uint8Array(buffer);
  }

  memoryPdfCache.set(storageKey, bytes);

  try {
    const db = await openPdfDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      // Store a clean ArrayBuffer copy in IndexedDB
      const copyBuffer = bytes.slice().buffer;
      store.put(copyBuffer, storageKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Échec de l’écriture IndexedDB.'));
    });
  } catch (err) {
    console.warn('IndexedDB fallback to in-memory cache:', err);
  }

  return bytes;
}

async function readPdfFromIndexedDB(storageKey: string): Promise<Uint8Array | null> {
  if (memoryPdfCache.has(storageKey)) {
    return memoryPdfCache.get(storageKey)!;
  }
  try {
    const db = await openPdfDatabase();
    const buffer = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(storageKey);
      req.onsuccess = () => resolve(req.result as ArrayBuffer | undefined);
      req.onerror = () => reject(req.error);
    });
    if (buffer && buffer.byteLength > 0) {
      const bytes = new Uint8Array(buffer);
      memoryPdfCache.set(storageKey, bytes);
      return bytes;
    }
    return null;
  } catch (err) {
    console.warn('Failed reading PDF from IndexedDB:', err);
    return null;
  }
}

export async function clearStoredUploadedPdfs(): Promise<void> {
  memoryPdfCache.clear();
  try {
    const db = await openPdfDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore if unavailable
  }
}

function decodeBase64DataUrl(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d    // -
  );
}

/**
 * Resolves the real binary bytes of a JustificatifDocument from IndexedDB,
 * memory cache, base64 Data URL, or static HTTP URL (/demo-pdfs/...).
 */
export async function loadDocumentPdfBytes(
  doc: Pick<JustificatifDocument, 'id' | 'fileName' | 'storageKey' | 'fileData' | 'fileUrl'>
): Promise<{ bytes: Uint8Array; source: 'indexeddb' | 'dataurl' | 'url' }> {
  // 1. Try IndexedDB / memory cache if storageKey is present
  if (doc.storageKey) {
    const idbBytes = await readPdfFromIndexedDB(doc.storageKey);
    if (idbBytes && idbBytes.length > 0) {
      if (!hasPdfSignature(idbBytes)) {
        throw new Error(
          `Le fichier enregistré pour « ${doc.fileName || doc.id} » est corrompu (en-tête %PDF- absent).`
        );
      }
      return { bytes: idbBytes, source: 'indexeddb' };
    }
  }

  // 2. Try inline Data URL if present
  if (doc.fileData) {
    const bytes = decodeBase64DataUrl(doc.fileData);
    if (bytes.length > 0 && hasPdfSignature(bytes)) {
      return { bytes, source: 'dataurl' };
    }
    throw new Error(
      `Les données encodées du fichier « ${doc.fileName || doc.id} » ne correspondent pas à un PDF valide.`
    );
  }

  // 3. Try HTTP fetch for static demo PDFs (/demo-pdfs/...)
  if (doc.fileUrl) {
    const response = await fetch(doc.fileUrl, {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
      cache: 'no-cache'
    });
    if (!response.ok) {
      throw new Error(
        `Impossible d’accéder au fichier PDF (HTTP ${response.status} sur ${doc.fileUrl}).`
      );
    }
    const contentType = response.headers.get('content-type') || '';
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!hasPdfSignature(bytes)) {
      throw new Error(
        `La ressource retournée par ${doc.fileUrl} (Content-Type: ${contentType || 'inconnu'}) n’est pas un fichier PDF valide.`
      );
    }
    return { bytes, source: 'url' };
  }

  throw new Error(
    `Aucun fichier PDF réel n’est disponible dans le stockage pour ce document. Veuillez le déposer à nouveau.`
  );
}

/**
 * Creates a Blob object URL (application/pdf) from resolved document bytes.
 * Caller is responsible for revoking the URL with URL.revokeObjectURL.
 */
export async function createDocumentBlobUrl(
  doc: Pick<JustificatifDocument, 'id' | 'fileName' | 'storageKey' | 'fileData' | 'fileUrl'>
): Promise<string> {
  const { bytes } = await loadDocumentPdfBytes(doc);
  const blob = new Blob([bytes.slice().buffer], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * Triggers a clean browser download of the genuine PDF file.
 */
export async function downloadDocumentPdf(doc: JustificatifDocument): Promise<void> {
  const blobUrl = await createDocumentBlobUrl(doc);
  const targetName = doc.fileName || doc.label || 'document-gcd.pdf';
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = targetName.toLowerCase().endsWith('.pdf') ? targetName : `${targetName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

/**
 * Role-based access verification for reading/downloading dossier PDFs:
 * - Candidat: only own dossier
 * - Directeur / Encadrant: only assigned dossiers
 * - Directeur CEDoc / Admin (supervise_cedoc): all dossiers
 */
export function canUserAccessDossierDocuments(
  user: AuthenticatedUser | null,
  dossier?: ApplicationDossier | null
): boolean {
  if (!user) return false;
  if (!dossier) return true;

  if (hasPrivilege(user, 'supervise_cedoc')) {
    return true;
  }

  if (
    hasAnyRole(user, [
      'directeur',
      'directeur_structure',
      'co_encadrant',
      'enseignant'
    ])
  ) {
    const lastNameLower = user.lastName.toLowerCase();
    return dossier.selectedTopics.some((t) =>
      t.director.toLowerCase().includes(lastNameLower)
    );
  }

  if (hasAnyRole(user, ['candidat'])) {
    return (
      dossier.student.academicEmail.toLowerCase() === user.email.toLowerCase() ||
      Boolean(
        dossier.student.cin &&
          user.cin &&
          dossier.student.cin.toUpperCase() === user.cin.toUpperCase()
      ) ||
      Boolean(
        dossier.student.cne &&
          user.cne &&
          dossier.student.cne.toUpperCase() === user.cne.toUpperCase()
      )
    );
  }

  return false;
}
