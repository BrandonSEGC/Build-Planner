// SEGC Affordability & Construction Loan engine — pure TS.

export interface AffordabilityState {
  annualIncome: number
  monthlyDebts: number
  credit: string
  cash: number
  landValue: number
  loanType: string
  termYears: number
  rate: number
}

// *** ALL PRICING LIVES HERE — SWAP FOR SEGC'S REAL NUMBERS *** // PLACEHOLDER
export const AFFORDABILITY_CONFIG = {
  dtiCaps: { ctp: 0.43, va: 0.45, fha: 0.43, conventional: 0.43 } as Record<string, number>,
  housingCaps: { ctp: 0.31, va: 0.34, fha: 0.31, conventional: 0.3 } as Record<string, number>,
  taxesInsuranceRate: 0.014, // PLACEHOLDER
  closingReservePct: 0.03, // PLACEHOLDER
  rangeSpread: 0.06,
}

export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const months = Math.max(1, years * 12)
  const rate = annualRate / 100 / 12
  if (rate === 0) return principal / months
  return (principal * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1)
}

export function principalFromPayment(payment: number, annualRate: number, years: number): number {
  const months = Math.max(1, years * 12)
  const rate = annualRate / 100 / 12
  if (rate === 0) return payment * months
  return payment * (((1 + rate) ** months - 1) / (rate * (1 + rate) ** months))
}

export function computeAffordability(state: AffordabilityState, config = AFFORDABILITY_CONFIG) {
  const grossMonthly = state.annualIncome / 12
  const dtiCap = config.dtiCaps[state.loanType] ?? 0.43
  const housingCap = config.housingCaps[state.loanType] ?? 0.31
  const housingByDti = Math.max(0, grossMonthly * dtiCap - state.monthlyDebts)
  const comfortPayment = Math.max(0, Math.min(housingByDti, grossMonthly * housingCap))
  const piPayment = comfortPayment * 0.86
  const financed = principalFromPayment(piPayment, state.rate, state.termYears)
  const usableCash = state.cash * (1 - config.closingReservePct)
  const buildBudget = financed + usableCash + state.landValue
  const low = buildBudget * (1 - config.rangeSpread)
  const high = buildBudget * (1 + config.rangeSpread)
  const dti = grossMonthly ? ((comfortPayment + state.monthlyDebts) / grossMonthly) * 100 : 0
  const sqftLow = low / 350
  const sqftHigh = high / 225
  return { grossMonthly, comfortPayment, piPayment, financed, buildBudget, low, high, dti, sqftLow, sqftHigh }
}
