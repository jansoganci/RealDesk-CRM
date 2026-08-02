/**
 * Writes 10 sample draft PDFs under tmp/sample-drafts/.
 * Run: npx tsx scripts/generate-sample-draft-pdfs.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { getLeaseAgreementFormDefaults } from '../src/features/contracts/leaseWizard/leaseAgreementFormDefaults';
import { getPurchaseAgreementFormDefaults } from '../src/features/contracts/purchaseWizard/purchaseAgreementFormDefaults';
import { leaseAgreementPdfService } from '../src/services/leaseAgreementPdf.service';
import { purchaseAgreementPdfService } from '../src/services/purchaseAgreementPdf.service';
import { UnsupportedDocumentJurisdictionError } from '../src/config/supportedDocumentStates';

const STATES = ['CA', 'TX', 'FL', 'NY', 'AZ'] as const;
const outDir = join(process.cwd(), 'tmp', 'sample-drafts');

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  const ab = await blob.arrayBuffer();
  return Buffer.from(ab);
}

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const manifest: string[] = [];

  for (const state of STATES) {
    const leaseForm = {
      ...getLeaseAgreementFormDefaults(),
      property_state: state,
      landlord_name: 'Alex Landlord',
      tenant_name: 'Taylor Tenant',
      property_street: '100 Main St',
      property_city: 'Sample City',
      property_zip: '85001',
      year_built: 1990,
      lead_paint_disclosure_required: false,
    };
    const lease = leaseAgreementPdfService.generateDocument({ form: leaseForm });
    const leasePath = join(outDir, `lease-${state}.pdf`);
    writeFileSync(leasePath, await blobToBuffer(lease.blob));
    manifest.push(
      `${leasePath} :: ${lease.meta.template_id} @ ${lease.meta.template_version} :: ${lease.meta.jurisdiction}`,
    );

    const purchaseForm = {
      ...getPurchaseAgreementFormDefaults(),
      property_state: state,
      governing_law_state: state as 'CA' | 'TX' | 'FL' | 'NY' | 'AZ',
      buyer_name: 'Blake Buyer',
      seller_name: 'Sam Seller',
      property_street: '200 Oak Ave',
      property_city: 'Sample City',
      property_zip: '85001',
      year_built: 2005,
      lead_paint_disclosure_required: false,
    };
    const purchase = purchaseAgreementPdfService.generateDocument({ form: purchaseForm });
    const purchasePath = join(outDir, `purchase-${state}.pdf`);
    writeFileSync(purchasePath, await blobToBuffer(purchase.blob));
    manifest.push(
      `${purchasePath} :: ${purchase.meta.template_id} @ ${purchase.meta.template_version} :: ${purchase.meta.jurisdiction}`,
    );
  }

  try {
    leaseAgreementPdfService.generateBlob({
      form: { ...getLeaseAgreementFormDefaults(), property_state: 'OH' },
    });
    throw new Error('Expected OH rejection');
  } catch (err) {
    if (!(err instanceof UnsupportedDocumentJurisdictionError)) throw err;
    manifest.push('OH rejection: OK');
  }

  writeFileSync(join(outDir, 'manifest.txt'), `${manifest.join('\n')}\n`);
  console.log(manifest.join('\n'));
  console.log(`\nWrote ${STATES.length * 2} PDFs to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
