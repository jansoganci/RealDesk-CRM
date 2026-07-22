/**
 * Converts a number to uppercase English words for contract PDFs.
 * Example: 15000 → "FIFTEEN THOUSAND"
 */
export function numberToEnglishText(num: number): string {
  const value = Math.floor(Math.abs(num));
  if (value === 0) return 'ZERO';

  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
  ];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const belowThousand = (n: number): string => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} HUNDRED`);
      n %= 100;
    }
    if (n >= 20) {
      const rest = n % 10;
      parts.push(rest > 0 ? `${tens[Math.floor(n / 10)]}-${ones[rest]}` : tens[Math.floor(n / 10)]);
    } else if (n > 0) {
      parts.push(ones[n]);
    }
    return parts.join(' ');
  };

  const scales: Array<[number, string]> = [
    [1_000_000_000, 'BILLION'],
    [1_000_000, 'MILLION'],
    [1_000, 'THOUSAND'],
  ];

  const parts: string[] = [];
  let remainder = value;
  for (const [scale, label] of scales) {
    if (remainder >= scale) {
      parts.push(`${belowThousand(Math.floor(remainder / scale))} ${label}`);
      remainder %= scale;
    }
  }
  if (remainder > 0) {
    parts.push(belowThousand(remainder));
  }

  return parts.join(' ');
}

/**
 * Sayıyı Türkçe yazıya çevirir (legacy — Turkish contracts only)
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


