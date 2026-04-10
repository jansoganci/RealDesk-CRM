#!/usr/bin/env node

/**
 * Translation audit — English locale only (public/locales/en).
 * For each JSON file: valid JSON and empty string values.
 */

const fs = require('fs');
const path = require('path');

const enDir = path.join(__dirname, '../public/locales/en');

function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function findEmptyStrings(obj, prefix = '') {
  const empty = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      empty.push(...findEmptyStrings(obj[key], fullKey));
    } else if (obj[key] === '') {
      empty.push(fullKey);
    }
  }
  return empty;
}

console.log('Translation audit (public/locales/en only)\n');
console.log('='.repeat(60));

if (!fs.existsSync(enDir)) {
  console.error(`Missing directory: ${enDir}`);
  process.exit(1);
}

const files = fs.readdirSync(enDir).filter((f) => f.endsWith('.json')).sort();
let totalIssues = 0;

files.forEach((file) => {
  const enPath = path.join(enDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  } catch (e) {
    console.log(`\n❌ ${file}: ${e.message}`);
    totalIssues += 1;
    return;
  }

  const keys = getAllKeys(data);
  const empty = findEmptyStrings(data);

  const issues = empty.length;
  if (issues === 0) {
    console.log(`\n✅ ${file}: OK (${keys.length} keys)`);
    return;
  }

  totalIssues += issues;
  console.log(`\n📄 ${file}:`);
  if (empty.length > 0) {
    console.log(`  ⚠️  Empty string values (${empty.length}):`);
    empty.slice(0, 20).forEach((k) => console.log(`     - ${k}`));
    if (empty.length > 20) console.log(`     ... and ${empty.length - 20} more`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total issues: ${totalIssues}`);
process.exit(totalIssues > 0 ? 1 : 0);
