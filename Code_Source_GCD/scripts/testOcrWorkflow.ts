import { jsPDF } from 'jspdf';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createWorker, OEM, PSM, setLogging } from 'tesseract.js';
import {
  calculateMrzCheckDigit,
  parseIdentityOcrText,
  OcrLineInput
} from '../src/services/ocrParser';
import type { Block } from 'tesseract.js';

setLogging(false);

const TMP_DIR = '/tmp/gcd-ocr-tests';
fs.mkdirSync(TMP_DIR, { recursive: true });

const SANS_TTF_B64 = fs
  .readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
  .toString('base64');
const SANS_BOLD_TTF_B64 = fs
  .readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
  .toString('base64');
const MONO_BOLD_TTF_B64 = fs
  .readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf')
  .toString('base64');

function registerEmbeddedFonts(doc: jsPDF) {
  doc.addFileToVFS('DejaVuSans.ttf', SANS_TTF_B64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', SANS_BOLD_TTF_B64);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
  doc.addFileToVFS('DejaVuSansMono-Bold.ttf', MONO_BOLD_TTF_B64);
  doc.addFont('DejaVuSansMono-Bold.ttf', 'DejaVuSansMono', 'bold');
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function collectLines(blocks: Block[] | null | undefined): OcrLineInput[] {
  const out: OcrLineInput[] = [];
  if (!blocks) return out;
  for (const b of blocks) {
    for (const p of b.paragraphs || []) {
      for (const l of p.lines || []) {
        const text = (l.text || '').trim();
        if (text) {
          out.push({
            text,
            confidence: typeof l.confidence === 'number' ? l.confidence : b.confidence || 75
          });
        }
      }
    }
  }
  return out;
}

function createFictitiousCinPdf(outPath: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [160, 100] });
  registerEmbeddedFonts(doc);

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 160, 100, 'F');
  doc.setDrawColor(16, 27, 53);
  doc.rect(3, 3, 154, 94);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(16, 27, 53);
  doc.text('ROYAUME DU MAROC', 8, 13);
  doc.setFontSize(10.5);
  doc.text("CARTE NATIONALE D'IDENTITE ELECTRONIQUE", 8, 20);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(11);
  doc.text('Nom : EL MANSOURI', 8, 33);
  doc.text('Prenom : YASSINE', 8, 42);
  doc.text('Ne le : 14/05/1998', 8, 51);
  doc.text('Lieu de naissance : RABAT', 8, 60);
  doc.text("Valable jusqu'au : 20/08/2031", 8, 69);

  doc.setFont('DejaVuSansMono', 'bold');
  doc.setFontSize(12.5);
  doc.text('N° CIN : AB123456', 8, 83);

  const bytes = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, bytes);
}

function createFictitiousPassportPdf(outPath: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [190, 130] });
  registerEmbeddedFonts(doc);

  doc.setFillColor(250, 251, 253);
  doc.rect(0, 0, 190, 130, 'F');
  doc.setDrawColor(16, 27, 53);
  doc.rect(3, 3, 184, 124);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 27, 53);
  doc.text('PASSEPORT / PASSPORT', 8, 15);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(11);
  doc.text('Nom : DIALLO', 8, 29);
  doc.text('Prenom : AMINATA', 8, 38);
  doc.text('Nationalite : Senegalaise', 8, 47);
  doc.text('Date de naissance : 03/11/1999', 8, 56);
  doc.text('Lieu de naissance : DAKAR', 8, 65);
  doc.text('Passeport N° : SN9081723', 8, 74);
  doc.text("Date d'expiration : 15/06/2030", 8, 83);

  // Build valid ICAO TD3 MRZ lines with genuine check digits
  const mrz1 = 'P<SENDIALLO<<AMINATA<<<<<<<<<<<<<<<<<<<<<<<<';
  const docNumField = 'SN9081723';
  const docCheck = calculateMrzCheckDigit(docNumField);
  const dobField = '991103';
  const dobCheck = calculateMrzCheckDigit(dobField);
  const expField = '300615';
  const expCheck = calculateMrzCheckDigit(expField);
  const optField = '<<<<<<<<<<<<<<0';
  const compositeCheck = calculateMrzCheckDigit(
    `${docNumField}${docCheck}${dobField}${dobCheck}${expField}${expCheck}${optField}`
  );
  const mrz2 = `${docNumField}${docCheck}SEN${dobField}${dobCheck}F${expField}${expCheck}${optField}${compositeCheck}`;

  doc.setFont('DejaVuSansMono', 'bold');
  doc.setFontSize(10.5);
  doc.text(mrz1, 7, 105);
  doc.text(mrz2, 7, 114);

  const bytes = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outPath, bytes);
}

function rasterizePdf(pdfPath: string, outPath: string, device: 'png16m' | 'jpeg') {
  execFileSync('gs', [
    '-dSAFER',
    '-dBATCH',
    '-dNOPAUSE',
    '-r200',
    `-sDEVICE=${device}`,
    `-sOutputFile=${outPath}`,
    pdfPath
  ]);
}

async function main() {
  console.log('=== GCD OCR TEST SUITE (FICTITIOUS DOCUMENTS ONLY) ===\n');

  const cinPdf = path.join(TMP_DIR, 'fictitious_cin.pdf');
  const cinPng = path.join(TMP_DIR, 'fictitious_cin.png');
  const cinJpg = path.join(TMP_DIR, 'fictitious_cin.jpg');

  const passPdf = path.join(TMP_DIR, 'fictitious_passport.pdf');
  const passPng = path.join(TMP_DIR, 'fictitious_passport.png');
  const passJpg = path.join(TMP_DIR, 'fictitious_passport.jpg');

  const blankPng = path.join(TMP_DIR, 'blank_unreadable.png');

  createFictitiousCinPdf(cinPdf);
  rasterizePdf(cinPdf, cinPng, 'png16m');
  rasterizePdf(cinPdf, cinJpg, 'jpeg');

  createFictitiousPassportPdf(passPdf);
  rasterizePdf(passPdf, passPng, 'png16m');
  rasterizePdf(passPdf, passJpg, 'jpeg');

  // Create blank unreadable PDF -> PNG
  const blankDoc = new jsPDF({ unit: 'mm', format: [85, 54] });
  blankDoc.setFillColor(255, 255, 255);
  blankDoc.rect(0, 0, 85, 54, 'F');
  const blankPdf = path.join(TMP_DIR, 'blank.pdf');
  fs.writeFileSync(blankPdf, Buffer.from(blankDoc.output('arraybuffer')));
  rasterizePdf(blankPdf, blankPng, 'png16m');

  const langDir = path.resolve('public/tesseract/lang');
  const worker = await createWorker(['fra', 'eng'], OEM.LSTM_ONLY, {
    langPath: langDir,
    cacheMethod: 'none'
  });
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1'
  });

  try {
    // 1. Test CIN PNG
    console.log('[TEST 1] CIN Marocaine Fictive (PNG)...');
    const resCinPng = await worker.recognize(cinPng, {}, { text: true, blocks: true });
    const parsedCinPng = parseIdentityOcrText(
      resCinPng.data.text,
      'cin_maroc',
      collectLines(resCinPng.data.blocks)
    );
    assert(
      parsedCinPng.fields.lastName.value.includes('MANSOURI'),
      `CIN PNG lastName mismatch: "${parsedCinPng.fields.lastName.value}" (raw:\n${resCinPng.data.text})`
    );
    assert(
      parsedCinPng.fields.firstName.value.includes('YASSINE'),
      `CIN PNG firstName mismatch: "${parsedCinPng.fields.firstName.value}"`
    );
    assert(
      parsedCinPng.fields.birthDate.value === '1998-05-14',
      `CIN PNG birthDate mismatch: "${parsedCinPng.fields.birthDate.value}"`
    );
    assert(
      parsedCinPng.fields.birthPlace.value.toUpperCase().includes('RABAT'),
      `CIN PNG birthPlace mismatch: "${parsedCinPng.fields.birthPlace.value}"`
    );
    assert(
      parsedCinPng.fields.documentNumber.value === 'AB123456',
      `CIN PNG docNumber mismatch: "${parsedCinPng.fields.documentNumber.value}"`
    );
    assert(
      parsedCinPng.fields.nationality.value === 'Marocaine',
      `CIN PNG nationality mismatch: "${parsedCinPng.fields.nationality.value}"`
    );
    assert(
      parsedCinPng.fields.expiryDate.value === '2031-08-20',
      `CIN PNG expiryDate mismatch: "${parsedCinPng.fields.expiryDate.value}"`
    );
    console.log('  OK -> 7/7 fields extracted accurately (avg conf:', parsedCinPng.overallConfidence + '%)');

    // 2. Test CIN JPG
    console.log('[TEST 2] CIN Marocaine Fictive (JPG)...');
    const resCinJpg = await worker.recognize(cinJpg, {}, { text: true, blocks: true });
    const parsedCinJpg = parseIdentityOcrText(
      resCinJpg.data.text,
      'cin_maroc',
      collectLines(resCinJpg.data.blocks)
    );
    assert(
      parsedCinJpg.fields.documentNumber.value === 'AB123456',
      `CIN JPG docNumber mismatch: "${parsedCinJpg.fields.documentNumber.value}"`
    );
    assert(
      parsedCinJpg.fields.birthDate.value === '1998-05-14',
      `CIN JPG birthDate mismatch: "${parsedCinJpg.fields.birthDate.value}"`
    );
    console.log('  OK -> JPG extraction verified (avg conf:', parsedCinJpg.overallConfidence + '%)');

    // 3. Test Passport PNG (with MRZ)
    console.log('[TEST 3] Passeport Fictif avec MRZ (PNG)...');
    const resPassPng = await worker.recognize(passPng, {}, { text: true, blocks: true });
    const parsedPassPng = parseIdentityOcrText(
      resPassPng.data.text,
      'passeport',
      collectLines(resPassPng.data.blocks)
    );
    assert(
      parsedPassPng.fields.lastName.value === 'DIALLO',
      `Passport PNG lastName mismatch: "${parsedPassPng.fields.lastName.value}" (raw:\n${resPassPng.data.text})`
    );
    assert(
      parsedPassPng.fields.firstName.value === 'AMINATA',
      `Passport PNG firstName mismatch: "${parsedPassPng.fields.firstName.value}"`
    );
    assert(
      parsedPassPng.fields.documentNumber.value === 'SN9081723',
      `Passport PNG docNum mismatch: "${parsedPassPng.fields.documentNumber.value}"`
    );
    assert(
      parsedPassPng.fields.birthDate.value === '1999-11-03',
      `Passport PNG birthDate mismatch: "${parsedPassPng.fields.birthDate.value}"`
    );
    assert(
      parsedPassPng.fields.expiryDate.value === '2030-06-15',
      `Passport PNG expiryDate mismatch: "${parsedPassPng.fields.expiryDate.value}"`
    );
    assert(
      parsedPassPng.fields.nationality.value === 'Sénégalaise',
      `Passport PNG nationality mismatch: "${parsedPassPng.fields.nationality.value}"`
    );
    assert(
      parsedPassPng.fields.birthPlace.value.toUpperCase().includes('DAKAR'),
      `Passport PNG birthPlace mismatch: "${parsedPassPng.fields.birthPlace.value}"`
    );
    console.log('  OK -> 7/7 Passport MRZ+Visual fields extracted accurately (avg conf:', parsedPassPng.overallConfidence + '%)');

    // 4. Test Passport JPG
    console.log('[TEST 4] Passeport Fictif avec MRZ (JPG)...');
    const resPassJpg = await worker.recognize(passJpg, {}, { text: true, blocks: true });
    const parsedPassJpg = parseIdentityOcrText(
      resPassJpg.data.text,
      'passeport',
      collectLines(resPassJpg.data.blocks)
    );
    assert(
      parsedPassJpg.fields.documentNumber.value === 'SN9081723',
      `Passport JPG docNum mismatch: "${parsedPassJpg.fields.documentNumber.value}"`
    );
    assert(
      parsedPassJpg.fields.lastName.value === 'DIALLO',
      `Passport JPG lastName mismatch: "${parsedPassJpg.fields.lastName.value}"`
    );
    console.log('  OK -> Passport JPG verified (avg conf:', parsedPassJpg.overallConfidence + '%)');

    // 5. Test Blank / Unreadable document -> Zero hallucinated fields!
    console.log('[TEST 5] Document illisible / vierge (Anti-invention)...');
    const resBlank = await worker.recognize(blankPng, {}, { text: true, blocks: true });
    const parsedBlank = parseIdentityOcrText(
      resBlank.data.text,
      'cin_maroc',
      collectLines(resBlank.data.blocks),
      ['Page blanche détectée']
    );
    assert(
      parsedBlank.extractedFieldCount === 0,
      `Blank doc must extract 0 fields, got ${parsedBlank.extractedFieldCount}`
    );
    assert(parsedBlank.fields.lastName.value === '', 'Blank doc must not invent lastName');
    assert(parsedBlank.fields.documentNumber.value === '', 'Blank doc must not invent documentNumber');
    assert(parsedBlank.inconsistencyWarnings.length > 0, 'Blank doc must emit actionable warning');
    console.log('  OK -> 0 fields invented; explicit warning returned');

    // 6. Test Uncertain / Low-confidence & Inconsistent dates & Type mismatch
    console.log('[TEST 6] Détection incertitude, incohérences de dates & erreur de type...');
    const blurryLines: OcrLineInput[] = [
      { text: 'PASSEPORT', confidence: 85 },
      { text: 'Nom : TESTEUR', confidence: 58 },
      { text: 'Date de naissance : 12/05/2025', confidence: 62 },
      { text: "Date d'expiration : 01/01/2020", confidence: 60 }
    ];
    const parsedWarn = parseIdentityOcrText(
      blurryLines.map((l) => l.text).join('\n'),
      'cin_maroc',
      blurryLines
    );
    assert(parsedWarn.fields.lastName.uncertain === true, 'Low confidence lastName must be marked uncertain');
    assert(parsedWarn.fields.birthDate.uncertain === true, 'Too-young birthDate must be marked uncertain');
    assert(parsedWarn.fields.expiryDate.uncertain === true, 'Inconsistent expiryDate must be marked uncertain');
    assert(parsedWarn.inconsistencyWarnings.length >= 2, 'Expected mismatch + date inconsistency warnings');
    console.log('  OK -> Uncertain flags and inconsistency warnings triggered accurately');

    // 7. Verify PDF artifacts exist and have valid %PDF- magic header
    console.log('[TEST 7] Vérification des fichiers PDF générés (%PDF-)...');
    const cinPdfHeader = fs.readFileSync(cinPdf).subarray(0, 5).toString('ascii');
    const passPdfHeader = fs.readFileSync(passPdf).subarray(0, 5).toString('ascii');
    assert(cinPdfHeader === '%PDF-' && passPdfHeader === '%PDF-', 'Invalid PDF header');
    console.log('  OK -> PDFs valid and rasterized seamlessly');
  } finally {
    await worker.terminate();
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }

  console.log('\nALL 7 OCR INTEGRATION TESTS PASSED SUCCESSFULLY.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
