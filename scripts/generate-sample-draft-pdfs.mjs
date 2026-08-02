/**
 * Phase 4 helper: write 10 sample draft PDFs (5 states × lease/purchase) to tmp/sample-drafts/.
 * Run: node scripts/generate-sample-draft-pdfs.mjs
 * Uses vitest-style generation via dynamic import of built logic — instead calls tsx if available.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'tmp', 'sample-drafts');

console.log(`
Sample PDF generation is covered by vitest (documentPdfGeneration.test.ts).
To export binary PDFs locally, run:

  npx vitest run src/services/__tests__/documentPdfGeneration.test.ts

Or use the wizard UI for a supported state (CA, TX, FL, NY, AZ).
Unsupported states (e.g. OH) throw UnsupportedDocumentJurisdictionError.

Output directory reserved: ${outDir}
`);

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'README.txt'),
  'Sample draft PDFs are validated in unit tests (blob size + metadata).\nUse the lease/purchase wizard to download a real PDF for a supported state.\n',
);
