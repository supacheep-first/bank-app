import type { Account } from '../api'

// narrowSymbol: THB → ฿ (the default en-US symbol is "THB ")
export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(amount)

// label: card title when the account has no name · detail: prefix of the number line (DECISIONS 13, 21)
const TYPES = {
  'saving-account': { label: 'Saving Account', detail: 'Smart account', powered: true },
  'credit-loan': { label: 'Credit Loan', detail: 'Credit Loan', powered: false },
  'goal-saving-account': { label: 'Goal Saving Account', detail: 'Goal driven savings', powered: true },
}

export const accountName = ({ name, type }: Account) => name ?? TYPES[type].label

export const accountDetails = ({ type, accountNumber, issuer }: Account) => [
  `${TYPES[type].detail} ${accountNumber}`,
  ...(TYPES[type].powered ? [`Powered by ${issuer}`] : []),
]
