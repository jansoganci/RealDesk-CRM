import type { BrokerSettings, CommissionCalculationResult } from '../types';

export type CommissionInputType = 'percentage' | 'flat_fee';
export type CommissionSide = 'listing' | 'buyer' | 'dual' | 'rental_listing' | 'rental_tenant';
export type RentalCommissionType = 'one_month' | 'annual_pct' | 'flat_fee';

export interface CapContext {
  ytdCompanyDollar: number;
  ytdRoyaltyDollar?: number;
}

export interface CommissionFeeInput {
  transactionFee?: number | null;
  eoFee?: number | null;
  tcFee?: number | null;
  otherFees?: number | null;
}

export interface CalculateCommissionParams {
  salePrice?: number | null;
  commissionRate?: number | null;
  commissionType: CommissionInputType;
  side: CommissionSide;
  referralPct?: number | null;
  brokerSettings: BrokerSettings;
  perDealFees?: CommissionFeeInput;
  capContext?: CapContext;
  flatFeeAmount?: number | null;
}

export interface CalculateRentalCommissionParams {
  monthlyRent: number;
  rentalCommissionType: RentalCommissionType;
  annualRatePct?: number | null;
  flatFeeAmount?: number | null;
  splitWithCoAgent?: boolean;
  side: Extract<CommissionSide, 'rental_listing' | 'rental_tenant'>;
  referralPct?: number | null;
  brokerSettings: BrokerSettings;
  perDealFees?: CommissionFeeInput;
  capContext?: CapContext;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

const numberOrZero = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

function calculateBrokerDollar(
  postReferralGCI: number,
  brokerSplitPct: number,
  annualCapAmount: number | null,
  ytdCompanyDollar: number
): { brokerDollar: number; cappedAtClose: boolean } {
  if (brokerSplitPct <= 0 || postReferralGCI <= 0) {
    return { brokerDollar: 0, cappedAtClose: annualCapAmount !== null && ytdCompanyDollar >= annualCapAmount };
  }

  const uncappedBrokerDollar = round2(postReferralGCI * (brokerSplitPct / 100));

  if (annualCapAmount === null) {
    return { brokerDollar: uncappedBrokerDollar, cappedAtClose: false };
  }

  if (ytdCompanyDollar >= annualCapAmount) {
    return { brokerDollar: 0, cappedAtClose: true };
  }

  const remainingCap = round2(Math.max(annualCapAmount - ytdCompanyDollar, 0));
  if (remainingCap <= 0) {
    return { brokerDollar: 0, cappedAtClose: true };
  }

  if (uncappedBrokerDollar >= remainingCap) {
    return { brokerDollar: remainingCap, cappedAtClose: true };
  }

  return { brokerDollar: uncappedBrokerDollar, cappedAtClose: false };
}

function calculateFranchiseFee(
  postReferralGCI: number,
  brokerSettings: BrokerSettings,
  ytdRoyaltyDollar: number
): number {
  if (!brokerSettings.franchise_fee_enabled) return 0;

  const franchisePct = numberOrZero(brokerSettings.franchise_fee_pct);
  if (franchisePct <= 0 || postReferralGCI <= 0) return 0;

  const uncapped = round2(postReferralGCI * (franchisePct / 100));
  const royaltyCap = brokerSettings.franchise_fee_cap;

  if (royaltyCap === null) return uncapped;
  if (ytdRoyaltyDollar >= royaltyCap) return 0;

  const remainingRoyaltyCap = round2(Math.max(royaltyCap - ytdRoyaltyDollar, 0));
  return round2(Math.min(uncapped, remainingRoyaltyCap));
}

function resolveDealGCI(params: CalculateCommissionParams): number {
  if (params.commissionType === 'flat_fee') {
    return round2(Math.max(numberOrZero(params.flatFeeAmount), 0));
  }

  const salePrice = numberOrZero(params.salePrice);
  const commissionRate = numberOrZero(params.commissionRate);
  return round2(Math.max(salePrice, 0) * Math.max(commissionRate, 0) / 100);
}

export function calculateCommission(params: CalculateCommissionParams): CommissionCalculationResult {
  const dealGCI = resolveDealGCI(params);
  const referralPct = Math.max(numberOrZero(params.referralPct), 0);
  const referralFeeAmount = round2(dealGCI * (referralPct / 100));
  const postReferralGCI = round2(Math.max(dealGCI - referralFeeAmount, 0));

  const ytdCompanyDollar = numberOrZero(params.capContext?.ytdCompanyDollar);
  const ytdRoyaltyDollar = numberOrZero(params.capContext?.ytdRoyaltyDollar);

  const { brokerDollar, cappedAtClose } = calculateBrokerDollar(
    postReferralGCI,
    numberOrZero(params.brokerSettings.broker_split_pct),
    params.brokerSettings.annual_cap_amount,
    ytdCompanyDollar
  );

  const franchiseFee = calculateFranchiseFee(postReferralGCI, params.brokerSettings, ytdRoyaltyDollar);

  const transactionFee = round2(
    Math.max(numberOrZero(params.perDealFees?.transactionFee), 0) ||
      Math.max(numberOrZero(params.brokerSettings.default_transaction_fee), 0)
  );

  const eoFee =
    params.brokerSettings.eo_fee_type === 'per_deal'
      ? round2(
          Math.max(numberOrZero(params.perDealFees?.eoFee), 0) ||
            Math.max(numberOrZero(params.brokerSettings.eo_fee_amount), 0)
        )
      : 0;

  const tcFee = round2(
    Math.max(numberOrZero(params.perDealFees?.tcFee), 0) ||
      Math.max(numberOrZero(params.brokerSettings.default_tc_fee), 0)
  );

  const otherFees = round2(Math.max(numberOrZero(params.perDealFees?.otherFees), 0));

  const netCommission = round2(
    postReferralGCI - brokerDollar - franchiseFee - transactionFee - eoFee - tcFee - otherFees
  );

  return {
    dealGCI,
    referralFeeAmount,
    postReferralGCI,
    brokerDollar,
    franchiseFee,
    transactionFee,
    eoFee,
    tcFee,
    otherFees,
    netCommission,
    cappedAtClose,
  };
}

export function calculateRentalDealGCI(params: CalculateRentalCommissionParams): number {
  const monthlyRent = Math.max(numberOrZero(params.monthlyRent), 0);
  const splitFactor = params.splitWithCoAgent ? 0.5 : 1;

  if (params.rentalCommissionType === 'one_month') {
    return round2(monthlyRent * splitFactor);
  }

  if (params.rentalCommissionType === 'annual_pct') {
    const annualRatePct = Math.max(numberOrZero(params.annualRatePct), 0);
    return round2(monthlyRent * 12 * (annualRatePct / 100));
  }

  return round2(Math.max(numberOrZero(params.flatFeeAmount), 0));
}

export function calculateRentalCommission(params: CalculateRentalCommissionParams): CommissionCalculationResult {
  const rentalGCI = calculateRentalDealGCI(params);

  return calculateCommission({
    salePrice: rentalGCI,
    commissionRate: 100,
    commissionType: 'percentage',
    side: params.side,
    referralPct: params.referralPct,
    brokerSettings: params.brokerSettings,
    perDealFees: params.perDealFees,
    capContext: params.capContext,
  });
}
