/**
 * English number / dollar wording for US legal documents (leases, purchase agreements).
 * Integer wording follows conventional American English (e.g. lease rent spelled out).
 */

const ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const SCALE = ['', 'thousand', 'million', 'billion', 'trillion'];

function underThousand(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rest = n % 10;
    return rest ? `${TENS[ten]}-${ONES[rest]}` : TENS[ten];
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES[hundreds]} hundred`;
  if (!rest) return head;
  return `${head} ${underThousand(rest)}`;
}

/**
 * Non-negative integer to lowercase English words (no "dollars" suffix).
 * @param n Integer in [0, 1e15)
 */
export function integerToEnglishWords(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
    return '';
  }
  const num = Math.floor(n);
  if (num === 0) return 'zero';

  const parts: string[] = [];
  let remaining = num;
  let scaleIndex = 0;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk !== 0) {
      const chunkWords = underThousand(chunk);
      const scale = SCALE[scaleIndex];
      parts.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return parts.join(' ');
}

/**
 * Non-negative number to UPPERCASE legal-style words.
 * - Whole numbers: "TWO HUNDRED FIFTY THOUSAND"
 * - With cents: "TWO HUNDRED FIFTY THOUSAND AND 50/100"
 */
export function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  const whole = Math.floor(abs + 1e-9);
  const cents = Math.min(99, Math.round((abs - whole) * 100 + 1e-9));
  const wholeWords = integerToEnglishWords(whole).toUpperCase();
  if (cents > 0) {
    return `${wholeWords} AND ${String(cents).padStart(2, '0')}/100`;
  }
  return wholeWords;
}

/**
 * Purchase-agreement legal amount line.
 * Example: "TWO HUNDRED FIFTY THOUSAND US DOLLARS ($250,000)"
 */
export function formatLegalAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '';
  const abs = Math.abs(amount);
  const whole = Math.floor(abs + 1e-9);
  const cents = Math.min(99, Math.round((abs - whole) * 100 + 1e-9));
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: cents > 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${numberToWords(abs).toUpperCase()} US DOLLARS ($${numeric})`;
}

function toTitleCaseWords(lowercasePhrase: string): string {
  return lowercasePhrase
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join('-'),
    )
    .join(' ');
}

/**
 * Spell a USD amount in words for legal lines, e.g.
 * "One Thousand Two Hundred Thirty-Four and 56/100 Dollars"
 */
export function dollarsToLegalWords(amount: number, currencyLabel: string = 'Dollars'): string {
  if (!Number.isFinite(amount)) return '';
  const abs = Math.abs(amount);
  const dollars = Math.floor(abs + 1e-9);
  const cents = Math.min(99, Math.round((abs - dollars) * 100 + 1e-9));
  const dollarWords = toTitleCaseWords(integerToEnglishWords(dollars));
  const centStr = cents.toString().padStart(2, '0');
  return `${dollarWords} and ${centStr}/100 ${currencyLabel}`.trim();
}

/**
 * Convenience: rent / flat amounts often shown as whole dollars only.
 */
export function dollarsWholeToLegalWords(amount: number, currencyLabel: string = 'Dollars'): string {
  if (!Number.isFinite(amount)) return '';
  const dollars = Math.round(Math.abs(amount));
  const dollarWords = toTitleCaseWords(integerToEnglishWords(dollars));
  return `${dollarWords} ${currencyLabel}`.trim();
}
