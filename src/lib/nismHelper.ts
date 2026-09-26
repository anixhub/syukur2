import { Santri, Lembaga } from '../types';

/**
 * Determine which property of Santri stores NISM for the given Lembaga:
 * - SPM Wustho (nama contains 'wustho' / 'wustha') -> 'indukWustho'
 * - SPM Ulya (nama contains 'ulya') -> 'indukUlya'
 * - MHD / Madrasah Diniyyah (nama contains 'mhd' / 'diniyyah') -> 'indukMhd'
 * - Other / Default -> 'nism'
 */
export const getNismFieldKeyForLembaga = (lembaga?: Lembaga | null): 'indukWustho' | 'indukUlya' | 'indukMhd' | 'nism' => {
  const lemName = (lembaga?.nama || '').toLowerCase();
  if (lemName.includes('wustho') || lemName.includes('wustha')) {
    return 'indukWustho';
  }
  if (lemName.includes('ulya')) {
    return 'indukUlya';
  }
  if (lemName.includes('mhd') || lemName.includes('diniyyah')) {
    return 'indukMhd';
  }
  return 'nism';
};

/**
 * Retrieve NISM value for a Santri based on current Lembaga.
 */
export const getSantriNismForLembaga = (santri: Santri, lembaga?: Lembaga | null): string => {
  if (!santri) return '';
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  const val = santri[fieldKey];
  if (val && String(val).trim() !== '') return String(val).trim();
  // Fallback to nism or any filled induk field if primary is empty
  return santri.nism || santri.indukWustho || santri.indukUlya || santri.indukMhd || '';
};

/**
 * Extract 4-digit Year from either tanggalMasuk (DD/MM/YYYY or YYYY-MM-DD) or tahunMasuk.
 */
export const parseTanggalMasukToYear = (dateOrYear?: string): string => {
  if (!dateOrYear) return '2024';
  const str = String(dateOrYear).trim();
  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (dmyMatch) {
    return dmyMatch[3];
  }
  // If YYYY-MM-DD
  const ymdMatch = str.match(/\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/);
  if (ymdMatch) {
    return ymdMatch[1];
  }
  // If only 4 digits e.g. "2024"
  const yrMatch = str.match(/\b(19\d\d|20\d\d)\b/);
  if (yrMatch) {
    return yrMatch[1];
  }
  // Try Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getFullYear()) && parsed.getFullYear() > 1980 && parsed.getFullYear() < 2100) {
    return String(parsed.getFullYear());
  }
  return '2024';
};

/**
 * Format tanggalMasuk to clean DD/MM/YYYY format for UI display and inputs.
 */
export const formatTanggalMasukDMY = (dateStr?: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  const str = dateStr.trim();
  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  // If YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  // If DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${d}/${m}/${y}`;
  }
  // If only 4-digit year e.g. "2024", return "01/07/2024"
  if (/^\d{4}$/.test(str)) {
    return `01/07/${str}`;
  }
  return str;
};

/**
 * Convert user input (DD/MM/YYYY or YYYY-MM-DD) to ISO format (YYYY-MM-DD) for Sekretaris.
 */
export const normalizeToISODate = (inputDate?: string): string => {
  if (!inputDate || inputDate.trim() === '') return '';
  const str = inputDate.trim();
  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // If only year
  if (/^\d{4}$/.test(str)) {
    return `${str}-07-01`;
  }
  return str;
};

/**
 * Get Tahun Masuk Lembaga (4-digit string, e.g. "2024") for a Santri,
 * checking tanggalMasukLembaga first, then tahunMasukLembaga, then current year.
 * NOTE: This is independent from Sekretaris tanggalMasuk.
 */
export const getSantriTahunMasukLembaga = (santri: Santri): string => {
  if (santri.tanggalMasukLembaga && String(santri.tanggalMasukLembaga).trim()) {
    return parseTanggalMasukToYear(santri.tanggalMasukLembaga);
  }
  if (santri.tahunMasukLembaga && String(santri.tahunMasukLembaga).trim()) {
    return parseTanggalMasukToYear(santri.tahunMasukLembaga);
  }
  return String(new Date().getFullYear());
};

/**
 * Backward compatibility fallback
 */
export const getSantriTahunMasuk = (santri: Santri): string => {
  return getSantriTahunMasukLembaga(santri);
};

/**
 * Extract 12-digit Nomor Statistik from Lembaga.
 */
export const get12DigitNomorStatistik = (lembaga?: Lembaga | null): string => {
  if (!lembaga) return '000000000000';
  const raw = (lembaga.nomorStatistik || lembaga.nomor_statistik || lembaga.kode || '').replace(/\D/g, '');
  if (raw.length >= 12) {
    return raw.slice(0, 12);
  }
  if (raw.length > 0) {
    return raw.padEnd(12, '0');
  }
  // Default sensible prefix if empty based on lembaga type
  const lemName = (lembaga.nama || '').toLowerCase();
  if (lemName.includes('wustho') || lemName.includes('wustha')) {
    return '511235070001';
  }
  if (lemName.includes('ulya')) {
    return '521235070001';
  }
  return '121235070001';
};

/**
 * Backward compatibility alias
 */
export const get16DigitNomorStatistik = get12DigitNomorStatistik;

/**
 * Generate 18-digit NISM for a single santri:
 * [12 digit Nomor Statistik] + [2 digit akhir Tahun Masuk Lembaga] + [4 digit nomor urut]
 */
export const generate18DigitNism = (
  santri: Santri,
  lembaga: Lembaga | null | undefined,
  sequenceIndex: number,
  customTahunMasukLembaga?: string
): string => {
  const ns12 = get12DigitNomorStatistik(lembaga);
  const yearStr = customTahunMasukLembaga || getSantriTahunMasukLembaga(santri);
  const year2Digit = yearStr.slice(-2).padStart(2, '0');
  const seq4 = String(sequenceIndex).padStart(4, '0');
  return `${ns12}${year2Digit}${seq4}`;
};

/**
 * Backward compatibility alias
 */
export const generate22DigitNism = generate18DigitNism;

/**
 * Update Santri's NISM and/or Tanggal Masuk Lembaga.
 * Stores ONLY to tanggalMasukLembaga and tahunMasukLembaga.
 * NEVER modifies Sekretaris tanggalMasuk!
 */
export const updateSantriNismAndTahunMasuk = (
  santri: Santri,
  nismValue?: string,
  tahunMasukLembagaValue?: string,
  lembaga?: Lembaga | null,
  tanggalMasukLembagaValue?: string
): Santri => {
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  const updated: Santri = { ...santri };

  if (nismValue !== undefined) {
    const cleanNism = nismValue.trim();
    updated[fieldKey] = cleanNism;
    // Keep primary nism in sync if empty
    if (!updated.nism) {
      updated.nism = cleanNism;
    }
  }

  if (tanggalMasukLembagaValue !== undefined && tanggalMasukLembagaValue.trim() !== '') {
    const normalizedIso = normalizeToISODate(tanggalMasukLembagaValue);
    updated.tanggalMasukLembaga = normalizedIso;
    updated.tahunMasukLembaga = parseTanggalMasukToYear(normalizedIso);
  } else if (tahunMasukLembagaValue !== undefined && tahunMasukLembagaValue.trim() !== '') {
    const cleanYear = parseTanggalMasukToYear(tahunMasukLembagaValue.trim());
    updated.tahunMasukLembaga = cleanYear;
    if (!updated.tanggalMasukLembaga || updated.tanggalMasukLembaga.trim() === '') {
      updated.tanggalMasukLembaga = `${cleanYear}-07-01`;
    }
  }

  return updated;
};

/**
 * Calculate the next sequence number for a given student within its cohort/year in a list of students.
 */
export const getNextSequenceForSantri = (
  targetSantri: Santri,
  allStudents: Santri[],
  lembaga?: Lembaga | null,
  targetYear?: string
): number => {
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  const year = targetYear || getSantriTahunMasukLembaga(targetSantri);
  
  // Find all students with this year
  const sameYearStudents = allStudents.filter(
    (s) => getSantriTahunMasukLembaga(s) === year
  );

  let maxSeq = 0;
  sameYearStudents.forEach((s) => {
    if (s.id === targetSantri.id) return;
    const existingNism = s[fieldKey];
    if (existingNism && existingNism.length >= 16) {
      const seqPart = parseInt(existingNism.slice(-4), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  });

  if (maxSeq > 0) {
    return maxSeq + 1;
  }

  // If no existing sequences, use 1-based index in the cohort
  const indexInCohort = sameYearStudents.findIndex((s) => s.id === targetSantri.id);
  return indexInCohort >= 0 ? indexInCohort + 1 : 1;
};

/**
 * Clear NISM for a single student in a Lembaga.
 */
export const clearSantriNismForLembaga = (
  santri: Santri,
  lembaga: Lembaga | null | undefined
): Santri => {
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  const updated: Santri = { ...santri };
  const currentVal = santri[fieldKey];
  updated[fieldKey] = '';
  if (updated.nism === currentVal) {
    updated.nism = '';
  }
  return updated;
};

/**
 * Clear NISM for all given students in a Lembaga.
 */
export const clearNismForStudents = (
  students: Santri[],
  lembaga: Lembaga | null | undefined
): { updatedStudents: Santri[]; countCleared: number } => {
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  let countCleared = 0;
  const updatedStudents = students.map((s) => {
    const currentVal = s[fieldKey];
    if (currentVal && currentVal.trim() !== '') {
      countCleared++;
    }
    const updated = { ...s };
    updated[fieldKey] = '';
    if (updated.nism === currentVal) {
      updated.nism = '';
    }
    return updated;
  });
  return { updatedStudents, countCleared };
};

/**
 * Batch generate 18-digit NISM for a list of students in a Lembaga.
 * If overwriteExisting is false, only generates for students without NISM in this field.
 * Optionally applies a custom default admission date/year if provided to tanggalMasukLembaga.
 */
export const batchGenerateNismForStudents = (
  students: Santri[],
  lembaga: Lembaga | null | undefined,
  overwriteExisting = false,
  customTanggalMasukLembaga?: string,
  applyDateToAll = false
): { updatedStudents: Santri[]; countGenerated: number } => {
  const fieldKey = getNismFieldKeyForLembaga(lembaga);
  const yearCounters: Record<string, number> = {};

  const defaultYear = customTanggalMasukLembaga ? parseTanggalMasukToYear(customTanggalMasukLembaga) : undefined;

  // Find max existing sequences per year if not overwriting
  students.forEach((s) => {
    const existingNism = s[fieldKey];
    const thn = (applyDateToAll && defaultYear) ? defaultYear : getSantriTahunMasukLembaga(s);
    if (!overwriteExisting && existingNism && existingNism.length >= 16) {
      const seqPart = parseInt(existingNism.slice(-4), 10);
      if (!isNaN(seqPart) && seqPart > (yearCounters[thn] || 0)) {
        yearCounters[thn] = seqPart;
      }
    }
  });

  let countGenerated = 0;
  const updatedStudents = students.map((s) => {
    const existingNism = s[fieldKey];
    if (!overwriteExisting && existingNism && existingNism.trim() !== '') {
      return s;
    }

    let thn = getSantriTahunMasukLembaga(s);
    let tglToApply = s.tanggalMasukLembaga;

    if (customTanggalMasukLembaga && (applyDateToAll || !s.tanggalMasukLembaga || s.tanggalMasukLembaga.trim() === '')) {
      tglToApply = normalizeToISODate(customTanggalMasukLembaga);
      thn = parseTanggalMasukToYear(customTanggalMasukLembaga);
    }

    const nextSeq = (yearCounters[thn] || 0) + 1;
    yearCounters[thn] = nextSeq;

    const newNism = generate18DigitNism(s, lembaga, nextSeq, thn);
    countGenerated++;
    return updateSantriNismAndTahunMasuk(s, newNism, thn, lembaga, tglToApply);
  });

  return { updatedStudents, countGenerated };
};
