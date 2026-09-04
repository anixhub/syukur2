import { Santri, Lembaga, Kelas } from '../types';

export function formatBigDigit(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '-') return '-';
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes('e') || trimmed.includes('E')) {
      try {
        return BigInt(Math.round(Number(trimmed))).toString();
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (typeof val === 'number') {
    try {
      return BigInt(Math.round(val)).toString();
    } catch {
      return String(val);
    }
  }
  return String(val).trim();
}

export function mergeIdField(localRaw: any, remoteRaw: any): string {
  const localVal = formatBigDigit(localRaw);
  const remoteVal = formatBigDigit(remoteRaw);
  
  const localValid = Boolean(localVal && localVal !== '-');
  const remoteValid = Boolean(remoteVal && remoteVal !== '-');

  if (localValid && remoteValid) {
    return localVal.length >= remoteVal.length ? localVal : remoteVal;
  }
  if (localValid) return localVal;
  if (remoteValid) return remoteVal;
  return localVal || remoteVal || '';
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export const PENDIDIKAN_OPTIONS = [
  'Tidak Sekolah',
  'SD/MI',
  'SMP/MTs',
  'SMA/MA/MAK',
  'D1',
  'D2',
  'D3',
  'D4',
  'S1',
  'S2',
  'S3',
  'Lainnya'
] as const;

export function normalizePendidikan(val?: string | null): string {
  if (!val || val === '-' || String(val).trim() === '') {
    return 'Tidak Sekolah';
  }

  const raw = String(val).trim();
  const lower = raw.toLowerCase();

  if (
    lower === 'tidak sekolah' ||
    lower === 'belum sekolah' ||
    lower === 'tidak/belum sekolah' ||
    lower === 'tanpa sekolah' ||
    lower === 'tidak'
  ) {
    return 'Tidak Sekolah';
  }

  // Exact option matches
  const matchedExact = PENDIDIKAN_OPTIONS.find(opt => opt.toLowerCase() === lower);
  if (matchedExact) return matchedExact;

  // SD / MI
  if (
    lower === 'sd' ||
    lower === 'mi' ||
    lower === 'sd/mi' ||
    lower === 'sd-mi' ||
    lower.includes('sekolah dasar') ||
    lower.includes('madrasah ibtidaiyah')
  ) {
    return 'SD/MI';
  }

  // SMP / MTs
  if (
    lower === 'smp' ||
    lower === 'mts' ||
    lower === 'smp/mts' ||
    lower === 'smp-mts' ||
    lower.includes('sekolah menengah pertama') ||
    lower.includes('madrasah tsanawiyah')
  ) {
    return 'SMP/MTs';
  }

  // SMA / MA / MAK / SMK / SLTA
  if (
    lower === 'sma' ||
    lower === 'ma' ||
    lower === 'mak' ||
    lower === 'smk' ||
    lower === 'slta' ||
    lower === 'aliyah' ||
    lower === 'sma/ma/mak' ||
    lower === 'sma/ma/smk' ||
    lower === 'sma/ma' ||
    lower.includes('sekolah menengah atas') ||
    lower.includes('madrasah aliyah') ||
    lower.includes('sekolah menengah kejuruan')
  ) {
    return 'SMA/MA/MAK';
  }

  // Diplomas & Degrees
  if (lower === 'd1' || lower === 'd-1' || lower === 'diploma 1') return 'D1';
  if (lower === 'd2' || lower === 'd-2' || lower === 'diploma 2') return 'D2';
  if (lower === 'd3' || lower === 'd-3' || lower === 'diploma 3') return 'D3';
  if (lower === 'd4' || lower === 'd-4' || lower === 'diploma 4') return 'D4';
  if (lower === 's1' || lower === 's-1' || lower.includes('sarjana')) return 'S1';
  if (lower === 's2' || lower === 's-2' || lower.includes('magister') || lower.includes('pascasarjana')) return 'S2';
  if (lower === 's3' || lower === 's-3' || lower.includes('doktor')) return 'S3';

  if (lower === 'lainnya' || lower === 'lain-lain' || lower === 'other') {
    return 'Lainnya';
  }

  return 'Lainnya';
}

export function formatDateDDMMYYYY(dateVal?: string | number | Date | null): string {
  if (!dateVal || dateVal === '-' || String(dateVal).trim() === '') return '-';
  const str = String(dateVal).trim();

  // If already in DD-MM-YYYY format (e.g. 25-07-2026 or 05-08-2010 or 5-8-2010)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}-${month}-${year}`;
  }

  // If in YYYY-MM-DD format (e.g. 2026-07-25)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const parts = str.split('-');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  // If in DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}-${month}-${year}`;
  }

  // If in YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const parts = str.split('/');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return str;
}

/**
 * Formats a class string or formal education string to extract ONLY the clean class name.
 * Example:
 * - "MTs SA Miftahul Ulum - VII Tsanawiyah A" => "VII Tsanawiyah A"
 * - "MA Miftahul Ulum - Calon Peserta Didik" => "Calon Peserta Didik"
 */
export function formatClassNameOnly(rawClassOrFormal?: string | null): string {
  if (!rawClassOrFormal || rawClassOrFormal.trim() === '' || rawClassOrFormal === 'TIDAK TERDAFTAR' || rawClassOrFormal === 'Belum / Non-Formal') {
    return 'TIDAK TERDAFTAR';
  }
  const str = rawClassOrFormal.trim();
  if (str.includes(' - ')) {
    const parts = str.split(' - ');
    const clsPart = parts.slice(1).join(' - ').trim();
    if (clsPart) return clsPart;
  }
  return str;
}

/**
 * Helper to determine whether a Lembaga is Formal or Internal.
 * Recognizes PDF (Pendidikan Diniyah Formal), SPM (Satuan Pendidikan Mu'adalah),
 * MTs, MA, SMP, SMA, SMK, SD, MI as 'Formal',
 * and MDT, Madin Takmiliyah, TPQ, Tahfidz, etc. as 'Internal'.
 */
export function getLembagaJenis(l: Lembaga): 'Formal' | 'Internal' {
  if (!l) return 'Formal';
  if (l.jenis && (l.jenis === 'Formal' || l.jenis === 'Internal')) return l.jenis;
  const lower = (l.nama || '').toLowerCase();
  const kode = (l.kode || '').toLowerCase();

  // 1. Explicit Formal education keywords
  if (
    lower.includes('diniyah formal') ||
    lower.includes('pendidikan diniyah formal') ||
    lower.includes('pdf') ||
    lower.includes('spm') ||
    lower.includes('muadalah') ||
    lower.includes("mu'adalah") ||
    lower.includes('wustho') ||
    lower.includes('wushto') ||
    lower.includes('wusto') ||
    lower.includes('ulya') ||
    lower.includes('tsanawiyah') ||
    lower.includes('aliyah') ||
    lower.includes('ibtidaiyyah') ||
    lower.includes('formal') ||
    kode.includes('pdf') ||
    kode.includes('spm') ||
    kode.includes('mts') ||
    kode.includes('ma') ||
    kode.includes('smp') ||
    kode.includes('sma') ||
    kode.includes('smk') ||
    kode.includes('sd') ||
    kode.includes('mi')
  ) {
    return 'Formal';
  }

  // 2. Explicit Internal / Non-Formal pondok keywords
  if (
    lower.includes('madin') || 
    lower.includes('diniyah') || 
    lower.includes('takmiliyah') ||
    lower.includes('tpq') || 
    lower.includes('tahfidz') || 
    lower.includes('pondok') || 
    lower.includes('kitab') || 
    lower.includes('internal') ||
    kode.includes('madin') ||
    kode.includes('tahf')
  ) {
    return 'Internal';
  }

  return 'Formal';
}

/**
 * Rigorous helper to match an institution against a text string (e.g. from pendidikanFormal or pendidikanInternal prefix).
 * Guarantees strict isolation across tiers (Wustho vs Ulya vs Ula) so candidates of one tier NEVER leak into another.
 */
export function isMatchLembagaStrict(l: Lembaga, text?: string | null): boolean {
  if (!text || !l) return false;
  const raw = (text || '').trim().toLowerCase();
  if (!raw || raw === 'tidak terdaftar' || raw === 'belum / non-formal' || raw === 'belum / non-madin' || raw === '-') return false;

  const normalizeSpelling = (str: string) => {
    return str
      .replace(/wushto|wusto/g, 'wustho')
      .replace(/ulia/g, 'ulya')
      .replace(/ibtidaiyah/g, 'ibtidaiyyah')
      .replace(/diniyah/g, 'diniyyah')
      .replace(/tuhfatush/g, 'tuhfatus');
  };

  const n = normalizeSpelling(raw.replace(/[-_]/g, ' ').replace(/\s+/g, ' '));
  const targetId = (l.id || '').trim().toLowerCase();
  const targetNama = normalizeSpelling((l.nama || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' '));
  const targetKode = (l.kode || '').trim().toLowerCase();
  const targetKodeNorm = normalizeSpelling(targetKode.replace(/[-_]/g, ' ').replace(/\s+/g, ' '));

  // 1. Direct exact matches
  if (raw === targetId || n === targetNama) return true;
  if (targetKode && (raw === targetKode || n === targetKodeNorm)) return true;

  // 2. Strict Academic Tier Disambiguation (Mutually exclusive levels)
  const EXCLUSIVE_TIER_GROUPS = [
    { name: 'wustho', terms: ['wustho', 'wushto', 'wusto', 'mts', 'smp', 'spmw', 'spwu', 'tsanawiyah'] },
    { name: 'ulya', terms: ['ulya', 'ulia', 'ma', 'sma', 'smk', 'spmu', 'spul', 'aliyah'] },
    { name: 'ula', terms: ['ula', 'mi', 'sd', 'spmua', 'ibtidaiyyah', 'ibtidaiyah'] },
  ];

  const findTierGroup = (str: string) => {
    const s = normalizeSpelling(str.toLowerCase());
    return EXCLUSIVE_TIER_GROUPS.find(g => 
      g.terms.some(t => {
        if (t.length <= 3) {
          // Strict word boundary for 2-3 letter abbreviations (like 'ma', 'mi', 'sd', 'mts', 'smp', 'sma')
          // so 'madrasah' does not trigger 'ma', 'miftahul' does not trigger 'mi', etc.
          const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`(^|[\\s_\\-.,/()])${escaped}([\\s_\\-.,/()]|$)`, 'i').test(s);
        }
        return s.includes(t);
      })
    );
  };

  const textTier = findTierGroup(n);
  const targetTier = findTierGroup(targetNama) || (targetKode ? findTierGroup(targetKode) : undefined);

  // If text belongs to a tier (e.g. Wustho) and target belongs to a different tier (e.g. Ulya), NEVER match
  if (textTier && targetTier && textTier.name !== targetTier.name) {
    return false;
  }
  // If target has a tier and text has a conflicting tier
  if (targetTier && textTier && textTier.name !== targetTier.name) {
    return false;
  }

  // If both have the same tier (e.g. both are Wustho), and there are no other contradictory keywords, accept match
  if (textTier && targetTier && textTier.name === targetTier.name) {
    // If text only specifies the tier e.g. "Wustho" or "SPM Wustho" and target is "SPM Wustho Putra"
    return true;
  }

  // 3. Normalized inclusion / word check
  const genericWords = new Set(['spm', 'madrasah', 'pondok', 'pesantren', 'sekolah', 'unit', 'pendidikan', 'lembaga', 'yayasan', 'al', 'ad', 'at', 'an', 'el', 'diniyyah', 'diniyah', 'putra', 'putri', 'pa', 'pi', 'sa', 'pdf']);
  const textWords = n.split(' ').filter(w => w.length > 0 && !genericWords.has(w));
  const targetWords = targetNama.split(' ').filter(w => w.length > 0 && !genericWords.has(w));

  if (textWords.length > 0) {
    const allWordsMatch = textWords.every(tw => targetWords.some(tgtW => tgtW === tw || tgtW.includes(tw) || tw.includes(tgtW)));
    if (allWordsMatch) return true;

    if (targetNama.includes(n) && textWords.length >= 1) return true;
    if (n.includes(targetNama) && targetWords.length >= 1) return true;
  }

  if (targetKode && targetKode.length >= 3 && !genericWords.has(targetKode)) {
    const codeRegex = new RegExp(`\\b${targetKode}\\b`, 'i');
    if (codeRegex.test(n)) return true;
  }

  return false;
}

export interface SantriFormalEducationInfo {
  lembaga: Lembaga | null;
  kelas: Kelas | null;
  display: string; // "VII Tsanawiyah A", "Calon Peserta Didik", or "TIDAK TERDAFTAR"
  filterDisplay?: string; // "WST - VII Tsanawiyah A" ("kode singkatan lembaga - kelas")
  fullDisplay: string; // "SPM Wustho - VII Tsanawiyah A" or "TIDAK TERDAFTAR"
  isFormal: boolean;
}

/**
 * Single source of truth for resolving a Santri's Pendidikan Formal.
 * Guarantees that internal / non-formal pondok classes (Madin, TPQ, Tahfidz)
 * are NEVER returned as formal education.
 */
export function getSantriFormalEducationInfo(
  s: Santri,
  lembagasList?: Lembaga[],
  kelasList?: Kelas[]
): SantriFormalEducationInfo {
  let lems = lembagasList;
  if (!lems || lems.length === 0) {
    try {
      const lStr = typeof window !== 'undefined' ? localStorage.getItem('smartsantri_lembagas') : null;
      if (lStr) lems = JSON.parse(lStr);
    } catch {}
  }
  lems = lems || [];

  let kls = kelasList;
  if (!kls || kls.length === 0) {
    try {
      const kStr = typeof window !== 'undefined' ? localStorage.getItem('smartsantri_kelas') : null;
      if (kStr) kls = JSON.parse(kStr);
    } catch {}
  }
  kls = kls || [];

  const formalLembagas = lems.filter(l => getLembagaJenis(l) === 'Formal');

  let currentDisplay = 'TIDAK TERDAFTAR';
  let currentFormalLembaga: Lembaga | null = null;
  let currentFormalClass: Kelas | null = null;

  const sClasses = s.kelas ? s.kelas.split(',').map(x => x.trim()).filter(Boolean) : [];

  // 1. Check s.pendidikanFormal FIRST (exact institution & class)
  if (
    s.pendidikanFormal &&
    s.pendidikanFormal.trim() !== '' &&
    s.pendidikanFormal !== 'TIDAK TERDAFTAR' &&
    s.pendidikanFormal !== 'Belum / Non-Formal' &&
    s.pendidikanFormal !== '-'
  ) {
    const rawFormal = s.pendidikanFormal.trim();
    // Split by comma in case multiple formal entries exist
    const formalEntries = rawFormal.split(',').map(x => x.trim()).filter(Boolean);

    for (const entry of formalEntries) {
      if (currentFormalLembaga) break;

      let lemName = '';
      let clsName = '';

      if (entry.includes(' - ')) {
        const parts = entry.split(' - ');
        lemName = parts[0]?.trim() || '';
        clsName = parts.slice(1).join(' - ').trim();
      } else if (entry.includes('-')) {
        const parts = entry.split('-');
        lemName = parts[0]?.trim() || '';
        clsName = parts.slice(1).join('-').trim();
      } else {
        lemName = entry.trim();
      }

      if (lemName) {
        const matchLem = formalLembagas.find(fl => {
          const flNama = fl.nama.toLowerCase();
          const flKode = fl.kode ? fl.kode.toLowerCase() : '';
          const lNameLower = lemName.toLowerCase();
          return (
            flNama === lNameLower ||
            (flKode && flKode === lNameLower) ||
            String(fl.id) === lNameLower ||
            isMatchLembagaStrict(fl, lemName) ||
            (flNama.length >= 3 && (lNameLower.includes(flNama) || flNama.includes(lNameLower))) ||
            (flKode && flKode.length >= 2 && (lNameLower.includes(flKode) || flKode.includes(lNameLower)))
          );
        });

        if (matchLem) {
          currentFormalLembaga = matchLem;
          const classesOfFl = kls.filter(k => String(k.lembagaId || (k as any).lembaga_id) === String(matchLem.id));
          const matchCls = classesOfFl.find(k => k.nama && (
            k.nama.trim().toLowerCase() === clsName.toLowerCase() ||
            k.nama.trim().toLowerCase().replace(/\s+/g, '') === clsName.toLowerCase().replace(/\s+/g, '')
          ));

          if (matchCls) {
            currentFormalClass = matchCls;
            currentDisplay = matchCls.nama;
          } else if (
            clsName &&
            clsName.toLowerCase() !== 'calon peserta didik' &&
            clsName.toLowerCase() !== 'calon pelajar' &&
            clsName.toLowerCase() !== 'tanpa kelas' &&
            clsName !== '-'
          ) {
            currentDisplay = clsName;
          } else {
            currentDisplay = 'Calon Peserta Didik';
          }
        }
      }
    }
  }

  // 2. Fallback: Check if any class in s.kelas matches a formal class
  if (!currentFormalLembaga && sClasses.length > 0) {
    for (const fl of formalLembagas) {
      const classesOfFl = kls.filter(k => String(k.lembagaId || (k as any).lembaga_id) === String(fl.id));
      const matchedClass = classesOfFl.find(k => k.nama && sClasses.some(sc => sc.toLowerCase() === k.nama.trim().toLowerCase()));
      if (matchedClass) {
        currentFormalLembaga = fl;
        currentFormalClass = matchedClass;
        currentDisplay = matchedClass.nama;
        break;
      }
    }
  }

  // 3. Secondary fallback: Check if s.kelas contains formal institution name/code (candidate status)
  if (!currentFormalLembaga && sClasses.length > 0) {
    for (const fl of formalLembagas) {
      if (sClasses.some(sc => sc.toLowerCase().includes(fl.nama.toLowerCase()) || (fl.kode && sc.toLowerCase().includes(fl.kode.toLowerCase())) || isMatchLembagaStrict(fl, sc))) {
        currentFormalLembaga = fl;
        currentDisplay = 'Calon Peserta Didik';
        break;
      }
    }
  }

  // 4. Tertiary fallback: indukWustho / indukUlya matching formal tiers
  if (!currentFormalLembaga) {
    if (s.indukWustho && s.indukWustho.trim() !== '' && s.indukWustho !== '-') {
      const wusthoLem = formalLembagas.find(l => (l.nama || '').toLowerCase().includes('wustho') || (l.kode || '').toLowerCase().includes('wustho'));
      if (wusthoLem) {
        currentFormalLembaga = wusthoLem;
        currentDisplay = 'Calon Peserta Didik';
      }
    } else if (s.indukUlya && s.indukUlya.trim() !== '' && s.indukUlya !== '-') {
      const ulyaLem = formalLembagas.find(l => (l.nama || '').toLowerCase().includes('ulya') || (l.kode || '').toLowerCase().includes('ulya'));
      if (ulyaLem) {
        currentFormalLembaga = ulyaLem;
        currentDisplay = 'Calon Peserta Didik';
      }
    }
  }

  const isFormal = !!currentFormalLembaga;
  const fullDisplay = isFormal
    ? `${currentFormalLembaga!.nama} - ${currentDisplay}`
    : 'TIDAK TERDAFTAR';

  const lemKode = currentFormalLembaga
    ? ((currentFormalLembaga.kode && currentFormalLembaga.kode.trim()) || currentFormalLembaga.nama.trim())
    : '';

  const filterDisplay = isFormal
    ? (currentDisplay === 'TIDAK TERDAFTAR'
        ? 'TIDAK TERDAFTAR'
        : (lemKode ? `${lemKode} - ${currentDisplay}` : currentDisplay))
    : 'TIDAK TERDAFTAR';

  return {
    lembaga: currentFormalLembaga,
    kelas: currentFormalClass,
    display: isFormal ? currentDisplay : 'TIDAK TERDAFTAR',
    filterDisplay,
    fullDisplay,
    isFormal
  };
}

export function demoteSantriToCalonPesertaDidik(
  santri: Santri,
  lembagasList?: Lembaga[],
  kelasList?: Kelas[]
): Santri {
  const currentClasses = santri.kelas
    ? santri.kelas.split(',').map(x => x.trim()).filter(Boolean)
    : [];

  // Identify formal lembagas
  const formalLembagaIds: string[] = [];
  let formalLembagas: Lembaga[] = [];
  if (lembagasList) {
    formalLembagas = lembagasList.filter(l => getLembagaJenis(l) === 'Formal');
    formalLembagaIds.push(...formalLembagas.map(l => String(l.id)));
  }

  // Identify formal class names
  const formalClassNamesSet = new Set<string>();
  if (kelasList && formalLembagaIds.length > 0) {
    kelasList.forEach(k => {
      const lemId = String(k.lembagaId || (k as any).lembaga_id || '');
      if (formalLembagaIds.includes(lemId) && k.nama) {
        formalClassNamesSet.add(k.nama.trim().toLowerCase());
      }
    });
  }

  // Filter out formal classes & old default labels from currentClasses
  const nonFormalClasses = currentClasses.filter(c => {
    const lower = c.toLowerCase();
    if (lower === 'tanpa kelas' || lower === 'calon peserta didik' || lower === 'calon pelajar') {
      return false;
    }
    if (formalClassNamesSet.has(lower)) {
      return false;
    }
    return true;
  });

  // Combine 'Calon Peserta Didik' + non-formal classes
  const newClasses = Array.from(new Set(['Calon Peserta Didik', ...nonFormalClasses]));
  const finalKelasString = newClasses.join(', ');

  // Update pendidikanFormal
  let newFormal = santri.pendidikanFormal;
  if (santri.pendidikanFormal && santri.pendidikanFormal.trim() !== '') {
    const parts = santri.pendidikanFormal.split(' - ');
    const lemName = parts[0].trim();
    if (lemName && lemName.toLowerCase() !== 'calon peserta didik' && lemName.toLowerCase() !== 'calon pelajar') {
      newFormal = `${lemName} - Calon Peserta Didik`;
    } else {
      newFormal = 'Calon Peserta Didik';
    }
  } else if (formalLembagas.length > 0) {
    let matchedLem: Lembaga | undefined;
    if (kelasList && currentClasses.length > 0) {
      for (const cName of currentClasses) {
        const foundCls = kelasList.find(k => k.nama.trim().toLowerCase() === cName.toLowerCase());
        if (foundCls) {
          const lemId = String(foundCls.lembagaId || (foundCls as any).lembaga_id || '');
          matchedLem = formalLembagas.find(l => String(l.id) === lemId);
          if (matchedLem) break;
        }
      }
    }
    if (!matchedLem && santri.indukWustho) {
      matchedLem = formalLembagas.find(l => (l.nama || '').toLowerCase().includes('wustho'));
    }
    if (!matchedLem && santri.indukUlya) {
      matchedLem = formalLembagas.find(l => (l.nama || '').toLowerCase().includes('ulya'));
    }
    if (matchedLem) {
      newFormal = `${matchedLem.nama} - Calon Peserta Didik`;
    }
  }

  return {
    ...santri,
    statusEmis: 'Belum',
    kelas: finalKelasString,
    pendidikanFormal: newFormal || '',
  };
}

// Smart file reader & image processor for documents and photos
// Threshold: 5 MB (5 * 1024 * 1024 bytes)
const FIVE_MB = 5 * 1024 * 1024;

export function processUploadedFile(file: File): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    // Non-image files (like PDF)
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        resolve({ originalUrl: url, thumbnailUrl: url });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const rawBase64 = event.target?.result as string;

        // 1. Generate Thumbnail (always optimized for fast browser profile loading, e.g. max 400x400)
        const thumbCanvas = document.createElement('canvas');
        let tW = img.width;
        let tH = img.height;
        const maxThumb = 400;
        if (tW > tH) {
          if (tW > maxThumb) {
            tH = Math.round((tH * maxThumb) / tW);
            tW = maxThumb;
          }
        } else {
          if (tH > maxThumb) {
            tW = Math.round((tW * maxThumb) / tH);
            tH = maxThumb;
          }
        }
        thumbCanvas.width = tW;
        thumbCanvas.height = tH;
        const tCtx = thumbCanvas.getContext('2d');
        let thumbnailUrl = rawBase64;
        if (tCtx) {
          tCtx.drawImage(img, 0, 0, tW, tH);
          thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.80);
        }

        // 2. Generate Original file URL (No compression if < 5MB, light compression if >= 5MB)
        if (file.size < FIVE_MB) {
          // Keep raw original without quality degradation
          resolve({ originalUrl: rawBase64, thumbnailUrl });
        } else {
          // Light compression so file becomes < 5MB while preserving full clarity
          const origCanvas = document.createElement('canvas');
          let oW = img.width;
          let oH = img.height;
          const maxOrigDimension = 3840; // 4K max ceiling
          if (oW > maxOrigDimension || oH > maxOrigDimension) {
            if (oW > oH) {
              oH = Math.round((oH * maxOrigDimension) / oW);
              oW = maxOrigDimension;
            } else {
              oW = Math.round((oW * maxOrigDimension) / oH);
              oH = maxOrigDimension;
            }
          }
          origCanvas.width = oW;
          origCanvas.height = oH;
          const oCtx = origCanvas.getContext('2d');
          if (oCtx) {
            oCtx.drawImage(img, 0, 0, oW, oH);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const compressedOriginal = origCanvas.toDataURL(mime, 0.92); // Light high-quality compression
            resolve({ originalUrl: compressedOriginal, thumbnailUrl });
          } else {
            resolve({ originalUrl: rawBase64, thumbnailUrl });
          }
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function compressImage(file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    processUploadedFile(file)
      .then((res) => resolve(res.thumbnailUrl || res.originalUrl))
      .catch((err) => reject(err));
  });
}

export function hasValidRoom(kamarStr?: string | null): boolean {
  if (!kamarStr) return false;
  const clean = kamarStr.trim().toLowerCase();
  if (
    clean === '' ||
    clean === '-' ||
    clean === '--' ||
    clean === 'tanpa kamar' ||
    clean === 'belum kamar' ||
    clean === 'belum ada' ||
    clean === 'belum ada kamar' ||
    clean === 'belum dapat' ||
    clean === 'belum dapat kamar' ||
    clean === 'belum diatur' ||
    clean === 'belum diatur kamar' ||
    clean === 'belum ditempatkan' ||
    clean === 'belum ditentukan' ||
    clean === 'belum diisi' ||
    clean === 'tidak ada' ||
    clean === 'tidak ada kamar' ||
    clean === 'non-asrama' ||
    clean === 'tanpa asrama' ||
    clean === 'belum' ||
    clean === '0' ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return false;
  }
  return true;
}

export function parseCatatanInvalidParts(catatan?: string): { prefixNote: string; invalidReason: string; suffixNote: string } {
  if (!catatan || !catatan.trim()) {
    return { prefixNote: '', invalidReason: 'Emis Invalid: Status EMIS Invalid', suffixNote: '' };
  }

  const str = catatan.trim();
  const parts = str.split('|').map(p => p.trim());
  
  // Find index of part that starts with "emis invalid:"
  const invalidIdx = parts.findIndex(p => p.toLowerCase().startsWith('emis invalid:'));

  if (invalidIdx !== -1) {
    const prefixNote = parts.slice(0, invalidIdx).filter(Boolean).join(' | ');
    const invalidReason = parts[invalidIdx];
    const suffixNote = parts.slice(invalidIdx + 1).filter(Boolean).join(' | ');
    return { prefixNote, invalidReason, suffixNote };
  }

  // If entire string doesn't have "emis invalid:", return default invalid reason and put rest in suffix
  if (str.toLowerCase().startsWith('emis invalid:')) {
    return { prefixNote: '', invalidReason: str, suffixNote: '' };
  }

  return {
    prefixNote: '',
    invalidReason: `Emis Invalid: ${str}`,
    suffixNote: ''
  };
}

export function formatCatatanParts(prefixNote: string, invalidReason: string, suffixNote: string): string {
  let inv = invalidReason.trim();
  if (!inv) {
    inv = 'Emis Invalid: Status EMIS Invalid';
  } else if (!inv.toLowerCase().startsWith('emis invalid:')) {
    inv = `Emis Invalid: ${inv}`;
  }

  const parts = [prefixNote.trim(), inv, suffixNote.trim()].filter(Boolean);
  return parts.join(' | ');
}

export function parseCatatanInvalid(catatan?: string): { invalidReason: string; extraNote: string } {
  const { prefixNote, invalidReason, suffixNote } = parseCatatanInvalidParts(catatan);
  const extraNote = [prefixNote, suffixNote].filter(Boolean).join(' | ');
  return { invalidReason, extraNote };
}

export function formatCatatanWithInvalid(invalidReason: string, extraNote?: string): string {
  return formatCatatanParts('', invalidReason, extraNote || '');
}

export function cleanWaliKelas(val?: string | null): string {
  if (!val || typeof val !== 'string') return '-';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '--') return '-';
  const cleaned = trimmed
    .replace(/\[KELAS_META:.*?\]/gi, '')
    .replace(/\[KELAS_META:.*$/gi, '')
    .trim();
  return cleaned || '-';
}
