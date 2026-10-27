import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// name · progress · flags come only when the account has them (api-specs 2, DECISIONS 13)
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

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', timeout: 10_000 }),
  endpoints: (build) => ({
    getProfile: build.query<{ name: string }, string>({
      query: (userId) => ({ url: '/auth/profile', params: { userId } }),
    }),
    // Main page endpoints: no userId, Go knows the user from the session cookie (DECISIONS 20).
    // keepUnusedDataFor: 0 drops the cache when MainPage unmounts, so the next visit (maybe another user,
    // maybe after a 401) starts empty and shows the loader instead of the old result.
    getUser: build.query<{ name?: string; greetingMessage?: string }, void>({ query: () => '/user', keepUnusedDataFor: 0 }),
    getAccounts: build.query<Account[], void>({ query: () => '/accounts', keepUnusedDataFor: 0 }),
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
  useSubmitPinMutation,
} = api
