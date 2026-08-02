# Document template registry (Item 4 — V1 drafts)

Structured, original RealDesk draft clause packs for **CA, TX, FL, NY, AZ**.

- Templates are assembled in `buildLeaseTemplate.ts` / `buildPurchaseTemplate.ts`.
- State-specific disclosure prose lives in `leaseStateDisclosures.ts` / `purchaseStateDisclosures.ts`.
- Wizard field mapping uses `leaseFormContext.ts` / `purchaseFormContext.ts`.
- Rendering is jsPDF via `src/services/documentPdfRenderer.service.ts`.

**Not** official association forms. Every PDF includes the attorney-disclaimer from `disclaimer.ts`.

Counsel can edit disclosure modules without rewriting the PDF engine.
