/**
 * Sayıyı Türkçe yazıya çevirir
 * Örnek: 15000 → "ONBEŞBİN"
 */
export function numberToTurkishText(num: number): string {
  if (num === 0) return 'SIFIR';
  
  const birler = ['', 'BİR', 'İKİ', 'ÜÇ', 'DÖRT', 'BEŞ', 'ALTI', 'YEDİ', 'SEKİZ', 'DOKUZ'];
  const onlar = ['', 'ON', 'YİRMİ', 'OTUZ', 'KIRK', 'ELLİ', 'ALTMIŞ', 'YETMİŞ', 'SEKSEN', 'DOKSAN'];
  
  const sayi = Math.floor(num);
  let result = '';
  
  // Milyonlar
  if (sayi >= 1000000) {
    const milyon = Math.floor(sayi / 1000000);
    result += (milyon === 1 ? 'BİR' : numberToTurkishText(milyon)) + 'MİLYON';
  }
  
  // Binler
  const binKalan = sayi % 1000000;
  if (binKalan >= 1000) {
    const bin = Math.floor(binKalan / 1000);
    if (bin === 1) {
      result += 'BİN';
    } else {
      result += numberToTurkishText(bin) + 'BİN';
    }
  }
  
  // Yüzler
  const yuzKalan = binKalan % 1000;
  if (yuzKalan >= 100) {
    const yuz = Math.floor(yuzKalan / 100);
    result += (yuz === 1 ? 'YÜZ' : birler[yuz] + 'YÜZ');
  }
  
  // Onlar ve birler
  const onKalan = yuzKalan % 100;
  if (onKalan >= 10) {
    result += onlar[Math.floor(onKalan / 10)];
  }
  const birKalan = onKalan % 10;
  if (birKalan > 0) {
    result += birler[birKalan];
  }
  
  return result || 'SIFIR';
}

const EN_UNITS = [
  '',
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
];

const EN_TEENS = [
  'TEN',
  'ELEVEN',
  'TWELVE',
  'THIRTEEN',
  'FOURTEEN',
  'FIFTEEN',
  'SIXTEEN',
  'SEVENTEEN',
  'EIGHTEEN',
  'NINETEEN',
];

const EN_TENS = [
  '',
  '',
  'TWENTY',
  'THIRTY',
  'FORTY',
  'FIFTY',
  'SIXTY',
  'SEVENTY',
  'EIGHTY',
  'NINETY',
];

function englishUnder1000(n: number): string {
  let x = n;
  const parts: string[] = [];
  if (x >= 100) {
    const h = Math.floor(x / 100);
    parts.push(`${h === 1 ? 'ONE' : EN_UNITS[h]} HUNDRED`);
    x %= 100;
  }
  if (x >= 20) {
    const t = Math.floor(x / 10);
    const u = x % 10;
    parts.push(u ? `${EN_TENS[t]}-${EN_UNITS[u]}` : EN_TENS[t]);
  } else if (x >= 10) {
    parts.push(EN_TEENS[x - 10]);
  } else if (x > 0) {
    parts.push(EN_UNITS[x]);
  }
  return parts.join(' ');
}

/**
 * Approximate spoken English for lease PDF (integer dollars-style; no decimals).
 */
export function numberToEnglishText(num: number): string {
  if (!Number.isFinite(num)) return '';
  let n = Math.floor(Math.abs(num));
  if (n === 0) return 'ZERO';

  const chunks: string[] = [];
  let scaleIdx = 0;
  const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];

  while (n > 0) {
    const chunk = n % 1000;
    if (chunk !== 0) {
      const head = englishUnder1000(chunk).trim();
      const scale = scales[scaleIdx];
      chunks.unshift(scale ? `${head} ${scale}`.trim() : head);
    }
    n = Math.floor(n / 1000);
    scaleIdx += 1;
  }

  return chunks.join(' ').trim();
}

