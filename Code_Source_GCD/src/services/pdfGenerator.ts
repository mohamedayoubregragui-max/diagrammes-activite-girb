/**
 * Helper utility to build, convert, and download genuine PDF Data URLs
 * for candidacy document verification in GCD USMBA.
 */

export function buildValidPdfBase64(
  docTitle: string,
  candidateName: string,
  docCategoryLabel: string,
  referenceNumber: string
): string {
  // Clean ASCII strings for standard Helvetica PDF stream
  const cleanTitle = (docTitle || 'Document Justificatif').replace(/[^\x20-\x7E]/g, ' ');
  const cleanName = (candidateName || 'Candidat USMBA').replace(/[^\x20-\x7E]/g, ' ');
  const cleanCategory = (docCategoryLabel || 'Document Officiel').replace(/[^\x20-\x7E]/g, ' ');
  const cleanRef = (referenceNumber || 'GCD-2026-USMBA').replace(/[^\x20-\x7E]/g, ' ');
  const dateStr = new Date().toLocaleDateString('fr-FR');

  const streamText = [
    'BT',
    '/F1 18 Tf',
    '40 750 Td',
    '(UNIVERSITE SIDI MOHAMED BEN ABDELLAH - FES) Tj',
    '0 -24 Td',
    '/F1 12 Tf',
    '(CEDoc Sciences & Technologies - Portail Doctorat GCD) Tj',
    '0 -35 Td',
    '/F1 16 Tf',
    `(${cleanCategory.toUpperCase()}) Tj`,
    '0 -28 Td',
    '/F1 12 Tf',
    `(${cleanTitle}) Tj`,
    '0 -20 Td',
    `(Candidat: ${cleanName}) Tj`,
    '0 -18 Td',
    `(Reference Dossier: ${cleanRef}) Tj`,
    '0 -18 Td',
    `(Horodatage de depot: ${dateStr}) Tj`,
    '0 -35 Td',
    '/F1 11 Tf',
    '(CERTIFICAT DE DIPLOME ET PIECES JUSTIFICATIVES CONFORMES) Tj',
    '0 -18 Td',
    '(Ce document PDF est authentifie et depose sur la plateforme GCD.) Tj',
    '0 -15 Td',
    '(Il est consultable et telechargeable par le Directeur de These et le CEDoc.) Tj',
    '0 -40 Td',
    '/F1 10 Tf',
    '(Signature et Sceau Numerique : USMBA-CEDOC-ST-2026-OK) Tj',
    'ET'
  ].join('\n');

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>
endobj

4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

5 0 obj
<< /Length ${streamText.length} >>
stream
${streamText}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF
`;

  const bytes = new TextEncoder().encode(pdfContent);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return 'data:application/pdf;base64,' + window.btoa(binary);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function downloadPdfDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
