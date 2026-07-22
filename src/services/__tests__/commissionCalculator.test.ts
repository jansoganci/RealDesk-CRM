import { describe, expect, it } from 'vitest';
import { calculateCommission, type CalculateCommissionParams } from '../commissionCalculator';
import type { BrokerSettings } from '../../types';

// Baseline broker settings: no cap, no franchise fee, all per-deal fee
// defaults at zero. Individual tests override only the fields they need to
// exercise, so failures point at the field under test rather than getting
// lost in an unrelated non-zero default.
function baseBrokerSettings(overrides: Partial<BrokerSettings> = {}): BrokerSettings {
  return {
    broker_model: 'split_with_cap',
    broker_split_pct: 0,
    annual_cap_amount: null,
    cap_anniversary_date: null,
    franchise_fee_enabled: false,
    franchise_fee_pct: null,
    franchise_fee_cap: null,
    default_transaction_fee: 0,
    eo_fee_type: 'per_deal',
    eo_fee_amount: 0,
    default_tc_fee: 0,
    default_rental_commission_type: 'one_month',
    default_rental_commission_rate: null,
    default_rental_flat_fee: null,
    ...overrides,
  };
}

// Emma happy-path fixture: $750k sale, 2.5% buyer-side commission, 30%
// broker split (agent keeps 70% of post-referral GCI before the flat fees),
// a 6% franchise fee, no cap, and small fixed per-deal fees.
const happyPathBrokerSettings = baseBrokerSettings({
  broker_split_pct: 30,
  franchise_fee_enabled: true,
  franchise_fee_pct: 6,
});

const happyPathFees = {
  transactionFee: 250,
  eoFee: 50,
  tcFee: 75,
  otherFees: 25,
};

function sumFees(fees: { transactionFee: number; eoFee: number; tcFee: number; otherFees: number }): number {
  return fees.transactionFee + fees.eoFee + fees.tcFee + fees.otherFees;
}

describe('calculateCommission - percentage sale, buyer side (happy path)', () => {
  const params: CalculateCommissionParams = {
    salePrice: 750000,
    commissionRate: 2.5,
    commissionType: 'percentage',
    side: 'buyer',
    referralPct: 0,
    brokerSettings: happyPathBrokerSettings,
    perDealFees: happyPathFees,
  };

  it('computes dealGCI as salePrice * rate', () => {
    const result = calculateCommission(params);
    expect(result.dealGCI).toBe(18750);
  });

  it('computes referral, broker, franchise, and fee legs and a consistent net', () => {
    const result = calculateCommission(params);

    expect(result.referralFeeAmount).toBe(0);
    expect(result.postReferralGCI).toBe(18750);
    expect(result.brokerDollar).toBe(5625); // 18750 * 30%
    expect(result.franchiseFee).toBe(1125); // 18750 * 6%
    expect(result.transactionFee).toBe(250);
    expect(result.eoFee).toBe(50);
    expect(result.tcFee).toBe(75);
    expect(result.otherFees).toBe(25);
    expect(result.cappedAtClose).toBe(false);

    for (const value of [
      result.dealGCI,
      result.referralFeeAmount,
      result.postReferralGCI,
      result.brokerDollar,
      result.franchiseFee,
      result.netCommission,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }

    const expectedNet =
      Math.round(
        (result.dealGCI - result.referralFeeAmount - result.brokerDollar - result.franchiseFee - sumFees(result)) *
          100
      ) / 100;
    expect(result.netCommission).toBe(expectedNet);
    expect(result.netCommission).toBe(11600);
  });
});

describe('calculateCommission - referral fee applied before broker/franchise splits', () => {
  it('reduces postReferralGCI before broker and franchise percentages are taken', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 25,
      brokerSettings: happyPathBrokerSettings,
      perDealFees: { transactionFee: 0, eoFee: 0, tcFee: 0, otherFees: 0 },
    });

    expect(result.dealGCI).toBe(18750);
    expect(result.referralFeeAmount).toBe(4687.5); // 18750 * 25%
    expect(result.postReferralGCI).toBe(14062.5);
    expect(result.brokerDollar).toBe(4218.75); // 14062.5 * 30%
    expect(result.franchiseFee).toBe(843.75); // 14062.5 * 6%
    expect(result.netCommission).toBe(9000);
  });
});

describe('calculateCommission - flat fee path', () => {
  it('uses flatFeeAmount as the GCI base and ignores salePrice/commissionRate', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'flat_fee',
      flatFeeAmount: 5000,
      side: 'buyer',
      referralPct: 0,
      brokerSettings: happyPathBrokerSettings,
      perDealFees: { transactionFee: 0, eoFee: 0, tcFee: 0, otherFees: 0 },
    });

    expect(result.dealGCI).toBe(5000);
    expect(result.postReferralGCI).toBe(5000);
    expect(result.brokerDollar).toBe(1500); // 5000 * 30%
    expect(result.franchiseFee).toBe(300); // 5000 * 6%
    expect(result.netCommission).toBe(3200);
  });
});

describe('calculateCommission - annual cap context reduces broker dollar', () => {
  it('caps brokerDollar at the remaining room under the annual cap', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({
        broker_split_pct: 30,
        annual_cap_amount: 6000,
      }),
      capContext: { ytdCompanyDollar: 5000 },
    });

    // Uncapped broker dollar would be 18750 * 30% = 5625, but only $1000
    // of cap room remains ($6000 cap - $5000 already collected this year).
    expect(result.brokerDollar).toBe(1000);
    expect(result.cappedAtClose).toBe(true);
  });

  it('zeroes brokerDollar once the cap has already been met', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({
        broker_split_pct: 30,
        annual_cap_amount: 6000,
      }),
      capContext: { ytdCompanyDollar: 6000 },
    });

    expect(result.brokerDollar).toBe(0);
    expect(result.cappedAtClose).toBe(true);
  });

  it('caps franchiseFee at the remaining room under the franchise royalty cap', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({
        franchise_fee_enabled: true,
        franchise_fee_pct: 6,
        franchise_fee_cap: 1000,
      }),
      capContext: { ytdCompanyDollar: 0, ytdRoyaltyDollar: 800 },
    });

    // Uncapped franchise fee would be 18750 * 6% = 1125, but only $200 of
    // royalty cap room remains ($1000 cap - $800 already paid this year).
    expect(result.franchiseFee).toBe(200);
  });
});

describe('calculateCommission - missing or invalid sale inputs', () => {
  it('returns safe zeros when salePrice and commissionRate are missing', () => {
    const result = calculateCommission({
      salePrice: null,
      commissionRate: null,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: null,
      brokerSettings: baseBrokerSettings(),
    });

    expect(result.dealGCI).toBe(0);
    expect(result.referralFeeAmount).toBe(0);
    expect(result.postReferralGCI).toBe(0);
    expect(result.brokerDollar).toBe(0);
    expect(result.franchiseFee).toBe(0);
    expect(result.netCommission).toBe(0);
    expect(result.cappedAtClose).toBe(false);
  });

  it('clamps negative salePrice and commissionRate to zero rather than producing a negative GCI', () => {
    // Documented current behavior: resolveDealGCI() applies Math.max(x, 0)
    // to both salePrice and commissionRate independently, so negative
    // inputs are treated as zero, not as a sign flip.
    const result = calculateCommission({
      salePrice: -750000,
      commissionRate: -2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings(),
    });

    expect(result.dealGCI).toBe(0);
    expect(result.netCommission).toBe(0);
  });
});

describe('calculateCommission - per-deal fee fallback to broker defaults', () => {
  it('falls back to broker default fees when perDealFees is omitted', () => {
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({
        default_transaction_fee: 40,
        eo_fee_type: 'per_deal',
        eo_fee_amount: 20,
        default_tc_fee: 10,
      }),
    });

    expect(result.transactionFee).toBe(40);
    expect(result.eoFee).toBe(20);
    expect(result.tcFee).toBe(10);
    expect(result.otherFees).toBe(0); // no broker default exists for otherFees
  });

  it('forces eoFee to zero when eo_fee_type is not per_deal, even if perDealFees.eoFee is set', () => {
    // Documented current behavior: only 'per_deal' reads eoFee at all;
    // 'monthly' / 'annual_excluded' are billed outside the per-deal split.
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({ eo_fee_type: 'monthly', eo_fee_amount: 20 }),
      perDealFees: { eoFee: 999 },
    });

    expect(result.eoFee).toBe(0);
  });

  it('falls back to the broker default when a per-deal fee is explicitly zero', () => {
    // Documented current behavior: transactionFee/eoFee/tcFee are computed
    // as `Math.max(perDeal, 0) || Math.max(default, 0)`. Since 0 is falsy
    // in JS, an explicit 0 per-deal fee does NOT override a non-zero
    // broker default — the default wins. This is existing calculator
    // behavior, not something this test suite changes.
    const result = calculateCommission({
      salePrice: 750000,
      commissionRate: 2.5,
      commissionType: 'percentage',
      side: 'buyer',
      referralPct: 0,
      brokerSettings: baseBrokerSettings({ default_transaction_fee: 40 }),
      perDealFees: { transactionFee: 0 },
    });

    expect(result.transactionFee).toBe(40);
  });
});
