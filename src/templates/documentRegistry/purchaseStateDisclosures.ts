import type { SupportedDocumentState } from '@/config/supportedDocumentStates';

/**
 * Original RealDesk draft disclosure language per state (purchase).
 * Not copied from C.A.R., TREC, Florida Realtors, NY board, or AAR forms.
 */

export function purchaseStateDisclosures(state: SupportedDocumentState): string {
  switch (state) {
    case 'CA':
      return [
        'California-specific disclosures (draft).',
        'Transfer Disclosure Statement (TDS): For most sales of one-to-four unit residential property, Seller must complete and deliver a statutory Transfer Disclosure Statement under Civil Code sections 1102 and following. This RealDesk draft is not the TDS.',
        'Natural Hazard Disclosure (NHD): Seller must provide required natural hazard disclosures under Civil Code sections 1103 and following. Delivery is often handled through a third-party report. This draft is not the NHD.',
        'Megan\'s Law: Information about registered sex offenders is available from the California Department of Justice Megan\'s Law website (https://www.meganslaw.ca.gov). The parties should confirm the current Civil Code section 2079.10a notice language with counsel.',
        'Agency, HOA, Mello-Roos, and compliance certificates: Separate disclosures and certifications (smoke/CO detectors, water heater bracing, water-conserving plumbing, HOA documents, and community tax assessments) may be required and are not fully collected in this draft.',
        'Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate addendum when required by the data provided.',
      ].join('\n\n');

    case 'TX':
      return [
        'Texas-specific disclosures (draft).',
        'Seller\'s Disclosure of Property Condition: Under Texas Property Code section 5.008, most sellers of residential property comprising not more than one dwelling unit must give the purchaser a written seller\'s disclosure notice on or before the effective date of the contract. If the notice is delivered late, Purchaser may have a statutory right to terminate within seven (7) days after receiving the notice. This RealDesk draft is not the section 5.008 notice.',
        'HOA / public improvement districts: If the Property is subject to mandatory association membership or public improvement district assessments, additional statutory notices may be required.',
        'Option period (contractual practice): Texas residential contracts often include a negotiated option period during which Purchaser may terminate for any reason in exchange for an option fee. This draft may describe inspection and termination timing using the parties\' negotiated fields; it is not a TREC promulgated contract and does not copy TREC option-period language.',
        'Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate addendum when required.',
      ].join('\n\n');

    case 'FL':
      return [
        'Florida-specific disclosures (draft).',
        // Fla. Stat. §404.056(5) mandated notification language (public statute text):
        'RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon testing may be obtained from your county health department.',
        'Material latent defects: Under Florida case law (including Johnson v. Davis), Seller must disclose known facts that materially affect the value of the property and are not readily observable. Selling "as is" does not eliminate that duty.',
        'Flood, HOA, condominium, and coastal disclosures: Florida law may require flood disclosures, homeowners\' association disclosure summaries, condominium document packages with rescission rights, and coastal construction control line notices when applicable. Those packages are not fully collected in this RealDesk draft and must be handled separately when required.',
        'Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate addendum when required.',
      ].join('\n\n');

    case 'NY':
      return [
        'New York-specific disclosures (draft).',
        'ATTORNEY INVOLVEMENT (IMPORTANT): New York residential purchase practice is commonly attorney-driven. Contracts are often negotiated by counsel before they become binding. This RealDesk draft is not a substitute for a New York attorney-prepared contract. Each party should have a New York-licensed real estate attorney review and, if appropriate, revise these terms before relying on them.',
        'Property Condition Disclosure Statement (PCDS): For covered one-to-four family residential property, Seller generally must deliver a Property Condition Disclosure Statement under Real Property Law section 462 before Purchaser signs a binding contract. This draft is not the PCDS. Condominium and cooperative transactions may follow different rules.',
        'Down payment escrow: Earnest money / down payments in New York are frequently held in escrow by Seller\'s attorney or another agreed escrow agent. The parties should confirm the escrow holder and release conditions with counsel.',
        'Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate addendum when required.',
      ].join('\n\n');

    case 'AZ':
      return [
        'Arizona-specific disclosures (draft).',
        'Material facts: Seller must disclose known material facts about the Property. Market practice often uses a Seller\'s Property Disclosure Statement; this RealDesk draft is not an Arizona Association of REALTORS® SPDS or purchase contract.',
        'Affidavit of Disclosure: For certain transfers of five or fewer parcels (other than subdivided land) in an unincorporated area of a county, Arizona Revised Statutes section 33-422 may require a statutory Affidavit of Disclosure with a buyer rescission window. The parties must determine whether that statute applies.',
        'Inspection and loan contingencies: Timing is contractual. Use the inspection, appraisal, and financing fields completed in the wizard; confirm customary Arizona escrow practices with the title/escrow company and counsel.',
        'Lead-based paint: Federal requirements for most pre-1978 housing apply and are addressed in a separate addendum when required.',
      ].join('\n\n');

    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function purchaseContingencyGuidance(state: SupportedDocumentState): string {
  switch (state) {
    case 'CA':
      return 'Contingency periods in California transactions are negotiated. Widely used association forms often default around seventeen (17) days for investigation, but that figure is market practice—not a statute. The periods stated in this draft control only as private contract terms between the parties.';
    case 'TX':
      return 'In Texas practice, Purchaser\'s primary flexibility window is often a negotiated option/termination period paired with earnest money deposited with the escrow agent. Financing and appraisal protections, if any, are contractual. Confirm timelines with Texas counsel; this draft is not a TREC form.';
    case 'FL':
      return 'Florida contingency and escrow release rules are primarily contractual, layered on top of statutory disclosures. Inspection and financing deadlines in this draft reflect the parties\' negotiated fields.';
    case 'NY':
      return 'In New York, inspection, mortgage, and title contingencies are commonly negotiated by attorneys as riders before the contract is fully executed and delivered. Treat the contingency fields below as draft business terms pending attorney revision.';
    case 'AZ':
      return 'Arizona residential contracts commonly include an inspection period and loan contingency negotiated by the parties and handled through escrow. The deadlines below reflect wizard inputs and are not copied from any association form.';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
