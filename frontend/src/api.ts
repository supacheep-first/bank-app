import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Account {
  type: 'saving-account' | 'credit-loan' | 'goal-saving-account'
  amount: number
  currency: string
  accountNumber: string
  issuer: string
  color: string
  isMainAccount: boolean
  name?: string
  progress?: number
  flags?: string[]
}

export interface RecentItem {
  name: string
  image: string
  isBank: boolean
}

export interface BannerItem {
  title: string
  description: string
  image: string
}

// number arrives already masked by Go
export interface DebitCard {
  name: string
  status: string
  issuer: string
  color: string
  borderColor?: string
  number?: string
}

// The one text for every failure without its own answer: 500 · FETCH_ERROR · TIMEOUT_ERROR · PARSING_ERROR · 400.
// Never error.message from Go.
export const ERROR_MESSAGE = 'Something went wrong. Please try again.'

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', timeout: 10_000 }),
  endpoints: (build) => ({
    getProfile: build.query<{ name: string }, string>({
      query: (userId) => ({ url: '/auth/profile', params: { userId } }),
    }),
    // No userId: Go knows the user from the session cookie. keepUnusedDataFor: 0 stops the first render of a later
    // visit (another user, or after a 401) from showing the old result.
    getUser: build.query<{ name?: string; greetingMessage?: string }, void>({ query: () => '/user', keepUnusedDataFor: 0 }),
    getAccounts: build.query<Account[], void>({ query: () => '/accounts', keepUnusedDataFor: 0 }),
    getRecent: build.query<RecentItem[], void>({ query: () => '/transactions/recent', keepUnusedDataFor: 0 }),
    getDebitCards: build.query<DebitCard[], void>({ query: () => '/debit-cards', keepUnusedDataFor: 0 }),
    getBanners: build.query<BannerItem[], void>({ query: () => '/banners', keepUnusedDataFor: 0 }),
    // 204 → data is null; the session cookie is httpOnly, JS never sees it
    submitPin: build.mutation<null, { userId: string; pin: string }>({
      query: (body) => ({ url: '/auth/pin', method: 'POST', body }),
    }),
  }),
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetUserQuery,
  useGetAccountsQuery,
  useGetRecentQuery,
  useGetDebitCardsQuery,
  useGetBannersQuery,
  useSubmitPinMutation,
} = api
