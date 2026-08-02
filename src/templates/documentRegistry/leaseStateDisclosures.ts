import type { SupportedDocumentState } from '@/config/supportedDocumentStates';

/**
 * Original Closewell draft disclosure language per state (lease).
 * Public statute-required notice text is included only where the statute itself mandates language (e.g. FL radon).
 * Not copied from association lease forms.
 */

export function leaseStateDisclosures(state: SupportedDocumentState): string {
  switch (state) {
    case 'CA':
      return [
        'California-specific disclosures (draft).',
        'Megan\'s Law notice: The California Department of Justice maintains a public database of registered sex offenders. Information about registered sex offenders may be obtained by visiting the Megan\'s Law website operated by the California Department of Justice (https://www.meganslaw.ca.gov) or by contacting local law enforcement. The parties acknowledge that this notice is provided for informational purposes and that they should verify the current statutory notice language under Civil Code section 2079.10a with counsel.',
        'Mold and environmental conditions: Landlord should disclose known mold or other environmental conditions that materially affect habitability and should provide any required state consumer information regarding mold. If such materials were delivered separately, the parties should retain proof of delivery.',
        'Asbestos: If Landlord has actual knowledge of asbestos-containing materials at the Premises, Landlord should disclose that knowledge in writing before occupancy.',
        'Security deposit: Under California Civil Code section 1950.5, Landlord generally must return any unused security deposit and provide an itemized statement of deductions within twenty-one (21) calendar days after Tenant vacates. Applicable caps on deposit amounts (commonly up to two months\' rent for unfurnished units under current statewide rules) must be observed. Local ordinances may impose additional requirements.',
        'Lead-based paint: If the Premises were built before 1978, the federal lead-based paint disclosure and pamphlet requirements apply and are addressed in a separate addendum when required by the data provided.',
      ].join('\n\n');

    case 'TX':
      return [
        'Texas-specific disclosures (draft).',
        'Owner and management identity: Landlord represents that the name and street address of the owner of the Premises, or of the management company authorized to act on the owner\'s behalf, and the person authorized to receive service of process, are as stated in the Parties section of this Agreement (Texas Property Code Chapter 92 requirements).',
        'Flooding: Landlord should disclose known information regarding flood risk as required by Texas Property Code section 92.0135. The parties should confirm the current statutory notice language with counsel and attach any required flood disclosure.',
        'Repairs and remedies: Tenant may have statutory repair and remedy rights under Texas Property Code Chapter 92. Certain notices and remedy language must appear conspicuously in the lease; the parties should confirm the current statutory wording with counsel. This draft does not replace those required conspicuous statements if additional formatting is mandated.',
        'Security deposit: Texas does not impose a statewide maximum security deposit amount. Landlord generally must refund the deposit or provide an itemized accounting within thirty (30) days after Tenant surrenders the Premises. Landlord\'s obligation to mail the refund/accounting may be delayed until Tenant provides a written forwarding address, but Tenant does not forfeit the right to a refund by failing to provide an address.',
        'Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate addendum when required.',
      ].join('\n\n');

    case 'FL':
      return [
        'Florida-specific disclosures (draft).',
        // Fla. Stat. §404.056(5) mandated notification language (public statute text):
        'RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon testing may be obtained from your county health department.',
        'Security deposit handling: Under Florida Statutes section 83.49, Landlord must hold advance rent and security deposits in accordance with statute (separate account or surety bond options) and provide written notice of how the deposit is held. Upon vacating, if Landlord makes no claim, the deposit generally must be returned within fifteen (15) days; if Landlord intends to impose a claim, Landlord generally must give written notice within thirty (30) days stating the reason for the claim.',
        'Access: Except in emergencies, Landlord\'s entry should follow Florida Statutes section 83.53, including advance notice (commonly at least twenty-four (24) hours) and entry at reasonable hours.',
        'Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate addendum when required.',
      ].join('\n\n');

    case 'NY':
      return [
        'New York-specific disclosures (draft).',
        'Security deposit: Under New York\'s Housing Stability and Tenant Protection Act framework, a security deposit for covered residential tenancies is generally limited to one month\'s rent. Deposits typically must be returned with an itemized statement within fourteen (14) days after Tenant vacates (confirm current statutory details with counsel). For buildings with six or more dwelling units, interest-bearing account rules commonly apply.',
        'Bedbugs: Especially for New York City multiple dwellings, landlords may be required to disclose bedbug infestation history and to share annual reporting materials with tenants. The parties should complete any official bedbug disclosure forms required for the Premises; this draft is not a substitute for those official forms.',
        'Rent regulation: If the Premises are rent-stabilized or otherwise rent-regulated, additional statutory riders and renewal rules apply and are not fully modeled in this draft. The parties must determine regulatory status and attach required riders.',
        'Lead-based paint: Federal requirements apply to most pre-1978 housing; New York City may impose additional local lead rules. A federal lead addendum is included when required by the data provided.',
      ].join('\n\n');

    case 'AZ':
      return [
        'Arizona-specific disclosures (draft).',
        'Security deposit: Under Arizona Revised Statutes section 33-1321, a refundable security deposit generally may not exceed one and one-half (1.5) months\' rent. After termination of the tenancy, delivery of possession, and Tenant\'s demand, Landlord generally must provide an itemized list of deductions and any amount due within fourteen (14) days, excluding Saturdays, Sundays, and legal holidays.',
        'Move-in / move-out inspection: On move-in, Landlord should furnish a signed copy of the lease, a move-in condition form noting existing damage, and written notice that Tenant may be present at the move-out inspection.',
        'Entry: Except in emergencies or as otherwise allowed by the Arizona Residential Landlord and Tenant Act, Landlord should give advance notice before entry (commonly two days) and enter at reasonable times.',
        'Lead-based paint: Federal requirements apply to most pre-1978 housing and are addressed in a separate addendum when required.',
      ].join('\n\n');

    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function leaseNoticePeriods(state: SupportedDocumentState): string {
  switch (state) {
    case 'CA':
      return 'Notices: Unless a shorter time is required by emergency or statute, Landlord should give reasonable advance notice before non-emergency entry. Month-to-month termination and rent-increase notices must follow California Civil Code requirements (including section 1946.1 where applicable) and any local rent regulations. Tenant must give notice to terminate as required by the lease type and applicable law.';
    case 'TX':
      return 'Notices: Non-emergency entry should be on reasonable notice. Termination of a month-to-month tenancy and other notices must comply with Texas Property Code Chapter 92 and the written lease. Special statutory early-termination rights (for example, certain military or family-violence situations) may apply regardless of lease language.';
    case 'FL':
      return 'Notices: Non-emergency entry generally requires at least twenty-four (24) hours\' notice and should occur at reasonable hours under Florida Statutes section 83.53. Month-to-month termination commonly requires at least thirty (30) days\' notice ending on a rental period boundary—confirm current statute and lease terms.';
    case 'NY':
      return 'Notices: Entry, termination, and rent-increase notices must comply with New York State law and, if applicable, New York City codes and rent-regulation rules. Because local overlays can be decisive, the parties should confirm notice periods with New York counsel.';
    case 'AZ':
      return 'Notices: Non-emergency entry should follow the Arizona Residential Landlord and Tenant Act (commonly two days\' advance notice). Either party generally may terminate a month-to-month tenancy with at least thirty (30) days\' written notice before the next rent due date, subject to the Act and the written lease.';
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
