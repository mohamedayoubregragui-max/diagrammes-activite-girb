import {
  IdentityDocumentType,
  IdentityOcrExtractionResult,
  OcrExtractedField
} from '../types';

export interface OcrLineInput {
  text: string;
  confidence: number;
}

const ISO3_NATIONALITIES: Record<string, string> = {
  MAR: 'Marocaine',
  FRA: 'Française',
  TUN: 'Tunisienne',
  DZA: 'Algérienne',
  MRT: 'Mauritanienne',
  SEN: 'Sénégalaise',
  CIV: 'Ivoirienne',
  CMR: 'Camerounaise',
  MLI: 'Malienne',
  GIN: 'Guinéenne',
  NER: 'Nigérienne',
  BFA: 'Burkinabè',
  TGO: 'Togolaise',
  BEN: 'Béninoise',
  COD: 'Congolaise (RDC)',
  COG: 'Congolaise',
  GAB: 'Gabonaise',
  TUNISIA: 'Tunisienne',
  ESP: 'Espagnole',
  ITA: 'Italienne',
  DEU: 'Allemande',
  BEL: 'Belge',
  CHE: 'Suisse',
  GBR: 'Britannique',
  USA: 'Américaine',
  CAN: 'Canadienne',
  EGY: 'Égyptienne',
  JOR: 'Jordanienne',
  LBN: 'Libanaise',
  SAU: 'Saoudienne',
  TUR: 'Turque',
  CHN: 'Chinoise',
  IND: 'Indienne'
};

function emptyField(): OcrExtractedField {
  return {
    value: '',
    confidence: 0,
    uncertain: false,
    source: 'none'
  };
}

function makeField(
  value: string,
  confidence: number,
  source: OcrExtractedField['source'],
  forceUncertain: boolean = false
): OcrExtractedField {
  const cleaned = value.trim();
  if (!cleaned) return emptyField();
  const boundedConf = Math.max(1, Math.min(99, Math.round(confidence)));
  return {
    value: cleaned,
    confidence: boundedConf,
    uncertain: forceUncertain || boundedConf < 75,
    source
  };
}

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function cleanPersonName(raw: string): string {
  return raw
    .replace(/[^A-ZÀ-Ÿa-zà-ÿ\s\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function normalizeExtractedDate(raw: string): string | null {
  const cleaned = raw.trim().replace(/[./\s]+/g, '-');
  // DD-MM-YYYY
  let m = cleaned.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    return formatIsoDate(Number(m[3]), Number(m[2]), Number(m[1]));
  }
  // YYYY-MM-DD
  m = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return formatIsoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  return null;
}

function parseMrzDate(yymmdd: string, kind: 'birth' | 'expiry'): string | null {
  const digits = yymmdd.replace(/O/g, '0').replace(/[Il]/g, '1');
  if (!/^\d{6}$/.test(digits)) return null;
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const currentTwoDigitYear = new Date().getFullYear() % 100;

  let fullYear: number;
  if (kind === 'birth') {
    fullYear = yy > currentTwoDigitYear - 10 ? 1900 + yy : 2000 + yy;
  } else {
    fullYear = yy >= 70 ? 1900 + yy : 2000 + yy;
  }
  return formatIsoDate(fullYear, mm, dd);
}

export function calculateMrzCheckDigit(field: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const ch = field[i];
    let val = 0;
    if (ch >= '0' && ch <= '9') {
      val = ch.charCodeAt(0) - 48;
    } else if (ch >= 'A' && ch <= 'Z') {
      val = ch.charCodeAt(0) - 55; // A=10 .. Z=35
    } else if (ch === '<') {
      val = 0;
    }
    sum += val * weights[i % 3];
  }
  return sum % 10;
}

function normalizeMrzDigits(raw: string): string {
  return raw.replace(/O/g, '0').replace(/[Il]/g, '1');
}

function sanitizeMrzLine(line: string): string {
  return line
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[«‹]/g, '<')
    .replace(/[^A-Z0-9<]/g, '<');
}

interface MrzParsedData {
  format: 'TD3' | 'TD1';
  lastName?: OcrExtractedField;
  firstName?: OcrExtractedField;
  documentNumber?: OcrExtractedField;
  nationality?: OcrExtractedField;
  birthDate?: OcrExtractedField;
  expiryDate?: OcrExtractedField;
  warnings: string[];
}

function tryParseMrz(lines: OcrLineInput[]): MrzParsedData | null {
  const candidates = lines
    .map((l) => ({
      raw: l.text,
      sanitized: sanitizeMrzLine(l.text),
      confidence: l.confidence
    }))
    .filter((c) => c.sanitized.length >= 26 && (c.sanitized.includes('<') || /^[PIAC][A-Z0-9<]{25,}$/.test(c.sanitized)));

  if (candidates.length < 2) return null;

  // 1. Try TD3 Passport (2 lines of ~44 chars, line1 starts with P)
  for (let i = 0; i < candidates.length - 1; i++) {
    const l1 = candidates[i];
    const l2 = candidates[i + 1];
    if (l1.sanitized.startsWith('P') && l1.sanitized.length >= 34 && l2.sanitized.length >= 34) {
      const avgConf = Math.round((l1.confidence + l2.confidence) / 2) || 80;
      const warnings: string[] = [];

      // Parse names: P<CCC SURNAME<<GIVEN<NAMES
      const nameSection = l1.sanitized.slice(5);
      const [rawLast = '', rawFirst = ''] = nameSection.split('<<');
      const lastNameStr = rawLast.replace(/<+/g, ' ').trim();
      const firstNameStr = rawFirst.replace(/<+/g, ' ').trim();

      // Line 2 positions
      const docNumRaw = l2.sanitized.slice(0, 9);
      const docNumCheck = normalizeMrzDigits(l2.sanitized.slice(9, 10));
      const natRaw = l2.sanitized.slice(10, 13).replace(/</g, '');
      const dobRaw = normalizeMrzDigits(l2.sanitized.slice(13, 19));
      const dobCheck = normalizeMrzDigits(l2.sanitized.slice(19, 20));
      const expRaw = normalizeMrzDigits(l2.sanitized.slice(21, 27));
      const expCheck = normalizeMrzDigits(l2.sanitized.slice(27, 28));

      const docCheckOk = /^\d$/.test(docNumCheck) && calculateMrzCheckDigit(docNumRaw) === Number(docNumCheck);
      const dobCheckOk = /^\d$/.test(dobCheck) && calculateMrzCheckDigit(dobRaw) === Number(dobCheck);
      const expCheckOk = /^\d$/.test(expCheck) && calculateMrzCheckDigit(expRaw) === Number(expCheck);

      if (!docCheckOk || !dobCheckOk || !expCheckOk) {
        warnings.push('Certains caractères de la zone MRZ présentent un contrôle de cohérence incertain : merci de vérifier les champs.');
      }

      const docNumClean = docNumRaw.replace(/<+$/g, '').trim();
      const dobIso = parseMrzDate(dobRaw, 'birth');
      const expIso = parseMrzDate(expRaw, 'expiry');
      const natLabel = ISO3_NATIONALITIES[natRaw] || (natRaw.length === 3 ? natRaw : '');

      return {
        format: 'TD3',
        lastName: lastNameStr ? makeField(lastNameStr, avgConf, 'mrz') : undefined,
        firstName: firstNameStr ? makeField(firstNameStr, avgConf, 'mrz') : undefined,
        documentNumber: docNumClean
          ? makeField(docNumClean, docCheckOk ? Math.max(avgConf, 86) : Math.min(avgConf, 65), 'mrz', !docCheckOk)
          : undefined,
        nationality: natLabel ? makeField(natLabel, avgConf, 'mrz') : undefined,
        birthDate: dobIso
          ? makeField(dobIso, dobCheckOk ? Math.max(avgConf, 86) : Math.min(avgConf, 65), 'mrz', !dobCheckOk)
          : undefined,
        expiryDate: expIso
          ? makeField(expIso, expCheckOk ? Math.max(avgConf, 86) : Math.min(avgConf, 65), 'mrz', !expCheckOk)
          : undefined,
        warnings
      };
    }
  }

  // 2. Try TD1 ID Card (3 lines x ~30 chars)
  for (let i = 0; i < candidates.length - 2; i++) {
    const l1 = candidates[i];
    const l2 = candidates[i + 1];
    const l3 = candidates[i + 2];
    if (/^[IAC]/.test(l1.sanitized) && l1.sanitized.length >= 26 && l2.sanitized.length >= 26 && l3.sanitized.includes('<<')) {
      const avgConf = Math.round((l1.confidence + l2.confidence + l3.confidence) / 3) || 78;
      const warnings: string[] = [];

      const docNumRaw = l1.sanitized.slice(5, 14);
      const docNumCheck = normalizeMrzDigits(l1.sanitized.slice(14, 15));
      const optionalBlock = l1.sanitized.slice(15).replace(/<+/g, ' ').trim();

      const dobRaw = normalizeMrzDigits(l2.sanitized.slice(0, 6));
      const dobCheck = normalizeMrzDigits(l2.sanitized.slice(6, 7));
      const expRaw = normalizeMrzDigits(l2.sanitized.slice(8, 14));
      const expCheck = normalizeMrzDigits(l2.sanitized.slice(14, 15));
      const natRaw = l2.sanitized.slice(15, 18).replace(/</g, '');

      const [rawLast = '', rawFirst = ''] = l3.sanitized.split('<<');
      const lastNameStr = rawLast.replace(/<+/g, ' ').trim();
      const firstNameStr = rawFirst.replace(/<+/g, ' ').trim();

      const docCheckOk = /^\d$/.test(docNumCheck) && calculateMrzCheckDigit(docNumRaw) === Number(docNumCheck);
      const dobCheckOk = /^\d$/.test(dobCheck) && calculateMrzCheckDigit(dobRaw) === Number(dobCheck);
      const expCheckOk = /^\d$/.test(expCheck) && calculateMrzCheckDigit(expRaw) === Number(expCheck);

      if (!dobCheckOk || !expCheckOk) {
        warnings.push('Certains chiffres de la bande optique sont incertains : vérifiez les dates extraites.');
      }

      // On Moroccan CNIE TD1, CIN number may appear in docNumRaw or optionalBlock
      const cinMatch = optionalBlock.match(/\b([A-Z]{1,2}\d{4,7})\b/);
      const docNumClean = cinMatch ? cinMatch[1] : docNumRaw.replace(/<+$/g, '').trim();

      const dobIso = parseMrzDate(dobRaw, 'birth');
      const expIso = parseMrzDate(expRaw, 'expiry');
      const natLabel = ISO3_NATIONALITIES[natRaw] || (natRaw.length === 3 ? natRaw : '');

      return {
        format: 'TD1',
        lastName: lastNameStr ? makeField(lastNameStr, avgConf, 'mrz') : undefined,
        firstName: firstNameStr ? makeField(firstNameStr, avgConf, 'mrz') : undefined,
        documentNumber: docNumClean
          ? makeField(docNumClean, docCheckOk || cinMatch ? avgConf : Math.min(avgConf, 65), 'mrz', !docCheckOk && !cinMatch)
          : undefined,
        nationality: natLabel ? makeField(natLabel, avgConf, 'mrz') : undefined,
        birthDate: dobIso
          ? makeField(dobIso, dobCheckOk ? Math.max(avgConf, 84) : Math.min(avgConf, 65), 'mrz', !dobCheckOk)
          : undefined,
        expiryDate: expIso
          ? makeField(expIso, expCheckOk ? Math.max(avgConf, 84) : Math.min(avgConf, 65), 'mrz', !expCheckOk)
          : undefined,
        warnings
      };
    }
  }

  return null;
}

function findLabeledValue(
  lines: OcrLineInput[],
  labelRegex: RegExp,
  cleaner: (val: string) => string = (v) => v.trim()
): { value: string; confidence: number } | null {
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].text.trim();
    const normLine = stripDiacritics(rawLine);
    const match = normLine.match(labelRegex);
    if (match) {
      const inlinePart = (match[1] || '').trim();
      if (inlinePart && inlinePart.length >= 2) {
        const cleaned = cleaner(inlinePart);
        if (cleaned) {
          return { value: cleaned, confidence: lines[i].confidence };
        }
      }
      // Fallback: label on line i, value on line i+1
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].text.trim();
        if (nextLine && !/^(nom|prenom|date|lieu|nationalit|valable|expire|cin|cnie|passeport|passport|surname|given)/i.test(stripDiacritics(nextLine))) {
          const cleaned = cleaner(nextLine);
          if (cleaned) {
            return { value: cleaned, confidence: Math.min(lines[i].confidence, lines[i + 1].confidence) };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Pure identity text parser: extracts only verifiable, readable information
 * from Tesseract OCR output without ever inventing missing fields.
 */
export function parseIdentityOcrText(
  rawText: string,
  documentType: IdentityDocumentType,
  lineInputs?: OcrLineInput[],
  qualityWarnings: string[] = []
): IdentityOcrExtractionResult {
  const lines: OcrLineInput[] =
    lineInputs && lineInputs.length > 0
      ? lineInputs
          .map((l) => ({ text: l.text.trim(), confidence: l.confidence }))
          .filter((l) => l.text.length > 0)
      : rawText
          .split(/\r?\n/)
          .map((t) => ({ text: t.trim(), confidence: 78 }))
          .filter((l) => l.text.length > 0);

  const overallConfidence =
    lines.length > 0
      ? Math.round(lines.reduce((acc, l) => acc + l.confidence, 0) / lines.length)
      : 0;

  const fullNormalized = stripDiacritics(lines.map((l) => l.text).join('\n'));
  const inconsistencyWarnings: string[] = [];

  // Document type mismatch detection
  const looksLikePassport = /\b(PASSEPORT|PASSPORT)\b/i.test(fullNormalized) || /^P<[A-Z]{3}/m.test(fullNormalized);
  const looksLikeCin = /\b(CARTE NATIONALE|CNIE|IDENTITE ELECTRONIQUE|ROYAUME DU MAROC)\b/i.test(fullNormalized);
  if (documentType === 'cin_maroc' && looksLikePassport && !looksLikeCin) {
    inconsistencyWarnings.push(
      'Le document semble être un passeport alors que l’option CIN marocaine est sélectionnée. Vérifiez attentivement les champs.'
    );
  } else if (documentType === 'passeport' && looksLikeCin && !looksLikePassport) {
    inconsistencyWarnings.push(
      'Le document semble être une CIN marocaine alors que l’option Passeport est sélectionnée. Vérifiez attentivement les champs.'
    );
  }

  let lastName = emptyField();
  let firstName = emptyField();
  let birthDate = emptyField();
  let birthPlace = emptyField();
  let documentNumber = emptyField();
  let nationality = emptyField();
  let expiryDate = emptyField();

  // Step 1: Parse MRZ if available (high-precision structured zone)
  const mrz = tryParseMrz(lines);
  if (mrz) {
    if (mrz.lastName) lastName = mrz.lastName;
    if (mrz.firstName) firstName = mrz.firstName;
    if (mrz.documentNumber) documentNumber = mrz.documentNumber;
    if (mrz.nationality) nationality = mrz.nationality;
    if (mrz.birthDate) birthDate = mrz.birthDate;
    if (mrz.expiryDate) expiryDate = mrz.expiryDate;
    inconsistencyWarnings.push(...mrz.warnings);
  }

  // Step 2: Visual-zone extraction (fills missing fields or provides CIN fields)
  if (!lastName.value) {
    const found = findLabeledValue(
      lines,
      /^(?:nom(?:\s+de\s+famille)?|surname|last\s*name|family\s*name)(?:\s*\/\s*[a-z\s]+)?\s*[:\-]?\s*(.*)$/i,
      cleanPersonName
    );
    if (found) {
      lastName = makeField(found.value.toUpperCase(), found.confidence, 'ocr');
    }
  }

  if (!firstName.value) {
    const found = findLabeledValue(
      lines,
      /^(?:prenoms?|given\s*names?|first\s*name)(?:\s*\/\s*[a-z\s]+)?\s*[:\-]?\s*(.*)$/i,
      cleanPersonName
    );
    if (found) {
      firstName = makeField(found.value, found.confidence, 'ocr');
    }
  }

  if (!documentNumber.value) {
    if (documentType === 'cin_maroc') {
      // Look first for explicit CIN/CNIE label
      const labeledCin = findLabeledValue(
        lines,
        /(?:n[°o]?\s*(?:de\s*)?(?:cin|cnie|carte)|cin|cnie)\s*[:\-]?\s*([A-Z]{1,2}\s*\d{4,7})\b/i,
        (v) => v.replace(/\s+/g, '').toUpperCase()
      );
      if (labeledCin) {
        documentNumber = makeField(labeledCin.value, labeledCin.confidence, 'ocr');
      } else {
        // Search standalone Moroccan CIN format (1-2 letters followed by 4-7 digits)
        for (const line of lines) {
          const norm = stripDiacritics(line.text).toUpperCase();
          const m = norm.match(/\b([A-Z]{1,2}\s?\d{4,7})\b/);
          if (m) {
            const candidate = m[1].replace(/\s+/g, '');
            // Avoid common false positives like N0123 or date-like tokens
            if (!/^(NO|ID|DU|LE|AU)\d+$/.test(candidate)) {
              documentNumber = makeField(candidate, line.confidence, 'ocr', line.confidence < 75);
              break;
            }
          }
        }
      }
    } else {
      // Passport visual number fallback
      const labeledPass = findLabeledValue(
        lines,
        /(?:passeport\s*n[°o]?|passport\s*no\.?|n[°o]\s*(?:du\s*)?passeport)\s*[:\-]?\s*([A-Z0-9]{6,12})\b/i,
        (v) => v.replace(/\s+/g, '').toUpperCase()
      );
      if (labeledPass) {
        documentNumber = makeField(labeledPass.value, labeledPass.confidence, 'ocr');
      }
    }
  }

  // Birth date
  if (!birthDate.value) {
    for (const line of lines) {
      const norm = stripDiacritics(line.text);
      const m = norm.match(
        /(?:ne(?:\(?e\)?)?\s*le|date\s*de\s*naissance|date\s*of\s*birth|dob)\s*[:\-]?\s*(\d{2}[./\-\s]\d{2}[./\-\s]\d{4}|\d{4}[./\-]\d{2}[./\-]\d{2})/i
      );
      if (m) {
        const iso = normalizeExtractedDate(m[1]);
        if (iso) {
          birthDate = makeField(iso, line.confidence, 'ocr');
          break;
        }
      }
    }
  }

  // Birth place
  if (!birthPlace.value) {
    for (let i = 0; i < lines.length; i++) {
      const norm = stripDiacritics(lines[i].text);
      // Case A: explicit label "Lieu de naissance : Fès" or "Place of birth : ..."
      const mLabel = norm.match(
        /(?:lieu\s*de\s*naissance|place\s*of\s*birth)(?:\s*\/\s*[a-z\s]+)?\s*[:\-]\s*([A-Za-z0-9\s\-'(),]{2,45})$/i
      );
      if (mLabel && mLabel[1].trim().length >= 2) {
        const cleaned = cleanPersonName(mLabel[1]);
        if (cleaned) {
          birthPlace = makeField(cleaned, lines[i].confidence, 'ocr');
          break;
        }
      }
      // Case B: "Né(e) le 14/05/1999 à Fès"
      const mInlineAt = norm.match(
        /ne(?:\(?e\)?)?\s*le\s*\d{2}[./\-]\d{2}[./\-]\d{4}\s+[a]\s+([A-Za-z\s\-']{2,35})$/i
      );
      if (mInlineAt && mInlineAt[1].trim().length >= 2) {
        const cleaned = cleanPersonName(mInlineAt[1]);
        if (cleaned) {
          birthPlace = makeField(cleaned, lines[i].confidence, 'ocr');
          break;
        }
      }
      // Case C: "à Fès" right after birth date line
      const mStandaloneAt = norm.match(/^\s*a\s+([A-Z][A-Za-z\s\-']{2,35})$/i);
      if (mStandaloneAt && i > 0 && /ne|naissance|birth|\d{4}/i.test(stripDiacritics(lines[i - 1].text))) {
        const cleaned = cleanPersonName(mStandaloneAt[1]);
        if (cleaned) {
          birthPlace = makeField(cleaned, lines[i].confidence, 'ocr');
          break;
        }
      }
    }
  }

  // Expiry date
  if (!expiryDate.value) {
    for (const line of lines) {
      const norm = stripDiacritics(line.text);
      const m = norm.match(
        /(?:valable\s*jusqu['’\s]?au|expire\s*le|date\s*d['’]?expiration|expiration|date\s*of\s*expiry|valid\s*until)\s*[:\-]?\s*(\d{2}[./\-\s]\d{2}[./\-\s]\d{4}|\d{4}[./\-]\d{2}[./\-]\d{2})/i
      );
      if (m) {
        const iso = normalizeExtractedDate(m[1]);
        if (iso) {
          expiryDate = makeField(iso, line.confidence, 'ocr');
          break;
        }
      }
    }
  }

  // Nationality
  if (!nationality.value) {
    const labeledNat = findLabeledValue(
      lines,
      /^(?:nationalite|nationality)(?:\s*\/\s*[a-z\s]+)?\s*[:\-]\s*(.+)$/i,
      cleanPersonName
    );
    if (labeledNat) {
      const upperCode = labeledNat.value.toUpperCase();
      const mapped = ISO3_NATIONALITIES[upperCode] || labeledNat.value;
      nationality = makeField(mapped, labeledNat.confidence, 'ocr');
    } else if (
      documentType === 'cin_maroc' &&
      /\b(ROYAUME DU MAROC|CARTE NATIONALE D['’ ]IDENTITE)\b/i.test(fullNormalized)
    ) {
      nationality = makeField('Marocaine', Math.min(overallConfidence || 75, 82), 'ocr');
    }
  }

  // Step 3: Logical & chronological consistency verification
  const todayIso = new Date().toISOString().slice(0, 10);
  if (birthDate.value) {
    const birthYear = Number(birthDate.value.slice(0, 4));
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (birthDate.value >= todayIso || age < 15 || age > 105) {
      inconsistencyWarnings.push(
        `La date de naissance extraite (${birthDate.value}) semble incohérente pour une inscription doctorale : veuillez la vérifier.`
      );
      birthDate = { ...birthDate, uncertain: true };
    }
  }

  if (expiryDate.value) {
    if (birthDate.value && expiryDate.value <= birthDate.value) {
      inconsistencyWarnings.push(
        'Incohérence détectée : la date d’expiration est antérieure ou égale à la date de naissance.'
      );
      expiryDate = { ...expiryDate, uncertain: true };
    } else if (expiryDate.value < todayIso) {
      inconsistencyWarnings.push(
        `Attention : le document semble expiré depuis le ${expiryDate.value}. Vérifiez la date extraite.`
      );
      expiryDate = { ...expiryDate, uncertain: true };
    }
  }

  const allFields = [lastName, firstName, birthDate, birthPlace, documentNumber, nationality, expiryDate];
  const extractedFieldCount = allFields.filter((f) => Boolean(f.value)).length;

  if (extractedFieldCount === 0) {
    inconsistencyWarnings.push(
      'Aucune donnée exploitable n’a pu être extraite automatiquement. Vérifiez la netteté du document ou complétez les champs manuellement.'
    );
  } else if (extractedFieldCount < 3) {
    inconsistencyWarnings.push(
      'Extraction partielle : certaines informations n’étaient pas lisibles. Merci de compléter les champs manquants.'
    );
  }

  return {
    documentType,
    overallConfidence,
    qualityWarnings,
    inconsistencyWarnings,
    rawLineCount: lines.length,
    extractedFieldCount,
    fields: {
      lastName,
      firstName,
      birthDate,
      birthPlace,
      documentNumber,
      nationality,
      expiryDate
    }
  };
}
