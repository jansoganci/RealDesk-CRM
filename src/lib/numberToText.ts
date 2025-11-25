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


