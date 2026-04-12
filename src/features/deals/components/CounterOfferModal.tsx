/**
 * Sprint 6B T13 — Counter-offer entry (price, closing date, notes). Uses the same sheet UI as the first-offer flow.
 */

import type { OfferRound } from '@/types';

import { OfferRoundSheet, type OfferRoundSheetProps } from './OfferRoundSheet';

export type CounterOfferModalProps = Omit<OfferRoundSheetProps, 'mode' | 'priorRound'> & {
  priorRound: OfferRound;
};

export function CounterOfferModal({ priorRound, ...rest }: CounterOfferModalProps) {
  return <OfferRoundSheet {...rest} mode="counter" priorRound={priorRound} />;
}
