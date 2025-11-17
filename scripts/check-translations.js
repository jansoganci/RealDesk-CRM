#!/usr/bin/env node

/**
 * Translation Audit Script
 * Compares English and Turkish translation files to find:
 * 1. Missing keys in either language
 * 2. Untranslated values (English text in Turkish files)
 */

const fs = require('fs');
const path = require('path');

const enDir = path.join(__dirname, '../public/locales/en');
const trDir = path.join(__dirname, '../public/locales/tr');

// Common English words that might appear in Turkish translations (false positives)
const COMMON_WORDS = new Set([
  'ok', 'no', 'yes', 'id', 'url', 'pdf', 'csv', 'api', 'ui', 'ux',
  'mb', 'gb', 'kb', 'usd', 'eur', 'try', 'tr', 'en'
]);

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

function getValueByPath(obj, path) {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}

function isLikelyEnglish(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Skip if it's a common word or very short
  if (text.length <= 2 || COMMON_WORDS.has(text.toLowerCase())) return false;
  
  // Check if it looks like English (starts with capital, contains English patterns)
  // This is a heuristic - might have false positives
  const englishPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/;
  const allCapsPattern = /^[A-Z]{2,}$/;
  
  // Skip if it's a placeholder or interpolation
  if (text.includes('{{') || text.includes('$')) return false;
  
  // Skip if it contains Turkish characters
  if (/[çğıöşüÇĞIİÖŞÜ]/.test(text)) return false;
  
  return englishPattern.test(text) || allCapsPattern.test(text);
}

function findUntranslatedValues(obj, prefix = '') {
  const untranslated = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      untranslated.push(...findUntranslatedValues(obj[key], fullKey));
    } else if (isLikelyEnglish(obj[key])) {
      untranslated.push({ key: fullKey, value: obj[key] });
    }
  }
  return untranslated;
}

function auditFile(filename) {
  const enPath = path.join(enDir, filename);
  const trPath = path.join(trDir, filename);
  
  if (!fs.existsSync(enPath)) {
    return { error: `English file not found: ${filename}` };
  }
  
  if (!fs.existsSync(trPath)) {
    return { error: `Turkish file not found: ${filename}` };
  }
  
  let enData, trData;
  try {
    enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
  } catch (e) {
    return { error: `Failed to parse ${filename}: ${e.message}` };
  }
  
  const enKeys = getAllKeys(enData);
  const trKeys = getAllKeys(trData);
  
  const missingInTr = enKeys.filter(k => !trKeys.includes(k));
  const missingInEn = trKeys.filter(k => !enKeys.includes(k));
  
  // Check for English values in Turkish file
  const untranslated = findUntranslatedValues(trData);
  
  // Also check if Turkish values match English (likely untranslated)
  const matchingValues = [];
  for (const key of enKeys) {
    if (trKeys.includes(key)) {
      const enValue = getValueByPath(enData, key);
      const trValue = getValueByPath(trData, key);
      if (enValue === trValue && typeof enValue === 'string' && enValue.length > 2) {
        matchingValues.push({ key, value: enValue });
      }
    }
  }
  
  return {
    missingInTr,
    missingInEn,
    untranslated,
    matchingValues
  };
}

// Main execution
console.log('🔍 Translation Audit Report\n');
console.log('='.repeat(60));

const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json')).sort();

let totalIssues = 0;

files.forEach(file => {
  const result = auditFile(file);
  
  if (result.error) {
    console.log(`\n❌ ${file}: ${result.error}`);
    return;
  }
  
  const issues = 
    result.missingInTr.length +
    result.missingInEn.length +
    result.untranslated.length +
    result.matchingValues.length;
  
  if (issues === 0) {
    console.log(`\n✅ ${file}: No issues found`);
    return;
  }
  
  totalIssues += issues;
  console.log(`\n📄 ${file}:`);
  
  if (result.missingInTr.length > 0) {
    console.log(`  ⚠️  Missing in TR (${result.missingInTr.length}):`);
    result.missingInTr.slice(0, 10).forEach(k => console.log(`     - ${k}`));
    if (result.missingInTr.length > 10) {
      console.log(`     ... and ${result.missingInTr.length - 10} more`);
    }
  }
  
  if (result.missingInEn.length > 0) {
    console.log(`  ⚠️  Missing in EN (${result.missingInEn.length}):`);
    result.missingInEn.slice(0, 10).forEach(k => console.log(`     - ${k}`));
    if (result.missingInEn.length > 10) {
      console.log(`     ... and ${result.missingInEn.length - 10} more`);
    }
  }
  
  if (result.untranslated.length > 0) {
    console.log(`  ⚠️  Likely English in TR (${result.untranslated.length}):`);
    result.untranslated.slice(0, 10).forEach(({ key, value }) => {
      console.log(`     - ${key}: "${value}"`);
    });
    if (result.untranslated.length > 10) {
      console.log(`     ... and ${result.untranslated.length - 10} more`);
    }
  }
  
  if (result.matchingValues.length > 0) {
    console.log(`  ⚠️  Same value in EN and TR (likely untranslated) (${result.matchingValues.length}):`);
    result.matchingValues.slice(0, 10).forEach(({ key, value }) => {
      console.log(`     - ${key}: "${value}"`);
    });
    if (result.matchingValues.length > 10) {
      console.log(`     ... and ${result.matchingValues.length - 10} more`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Total issues found: ${totalIssues}`);
console.log('\n💡 Tip: Review the output above and fix issues manually.');
console.log('   Some "likely English" detections might be false positives.');

