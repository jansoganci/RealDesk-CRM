#!/usr/bin/env node

/**
 * Hardcoded-color guard — src/**\/*.tsx and src/**\/*.css only.
 * Flags raw hex literals (inline styles, CSS values, Tailwind arbitrary
 * values like bg-[#...]) and bare old-palette Tailwind color-scale
 * classes (blue/slate/gray/emerald/orange-50..950) that the Closewell
 * rebrand replaced with semantic tokens (bg-primary, text-foreground, …).
 *
 * Files in ALLOWLIST are known, reviewed exceptions (landing-page
 * illustration palettes) and are skipped entirely.
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const ALLOWLIST = [
  'src/components/landing/Hero.css',
  'src/components/landing/landing-shared.css',
];

const SCAN_EXTENSIONS = ['.tsx', '.css'];

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

const OLD_PALETTE_COLORS = ['blue', 'slate', 'gray', 'emerald', 'orange'];
const OLD_PALETTE_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const UTILITY_PREFIXES = [
  'bg', 'text', 'border', 'from', 'via', 'to', 'ring', 'divide',
  'placeholder', 'fill', 'stroke', 'outline', 'decoration', 'caret', 'shadow',
];
const OLD_PALETTE_PATTERN = new RegExp(
  `\\b(?:${UTILITY_PREFIXES.join('|')})-(?:${OLD_PALETTE_COLORS.join('|')})-(?:${OLD_PALETTE_SHADES.join('|')})\\b`,
  'g'
);

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function toRepoRelative(fullPath) {
  return path.relative(path.join(__dirname, '..'), fullPath).split(path.sep).join('/');
}

console.log('Hardcoded-color audit (src/**/*.tsx, src/**/*.css)\n');
console.log('='.repeat(60));

if (!fs.existsSync(srcDir)) {
  console.error(`Missing directory: ${srcDir}`);
  process.exit(1);
}

const allFiles = getAllFiles(srcDir);
let totalIssues = 0;
let filesWithIssues = 0;

allFiles.forEach((fullPath) => {
  const relPath = toRepoRelative(fullPath);
  if (ALLOWLIST.includes(relPath)) return;

  const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
  const hits = [];

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;

    const hexMatches = line.match(HEX_PATTERN) || [];
    hexMatches.forEach((match) => hits.push({ line: lineNumber, match }));

    const paletteMatches = line.match(OLD_PALETTE_PATTERN) || [];
    paletteMatches.forEach((match) => hits.push({ line: lineNumber, match }));
  });

  if (hits.length === 0) return;

  filesWithIssues += 1;
  totalIssues += hits.length;
  console.log(`\n📄 ${relPath}:`);
  hits.forEach(({ line, match }) => console.log(`  ⚠️  L${line}: ${match}`));
});

console.log('\n' + '='.repeat(60));
if (totalIssues === 0) {
  console.log('\n✅ No hardcoded colors found outside the allowlist.');
} else {
  console.log(`\n📊 Total issues: ${totalIssues} (${filesWithIssues} file${filesWithIssues === 1 ? '' : 's'})`);
}
process.exit(totalIssues > 0 ? 1 : 0);
