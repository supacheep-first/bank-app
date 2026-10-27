import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', timeout: 10_000 }),
  endpoints: (build) => ({
    getProfile: build.query<{ name: string }, string>({
      query: (userId) => ({ url: '/auth/profile', params: { userId } }),
    }),
    // 204 → data is null; the session cookie is httpOnly, JS never sees it
    submitPin: build.mutation<null, { userId: string; pin: string }>({
      query: (body) => ({ url: '/auth/pin', method: 'POST', body }),
    }),
  }),
})

export const { useGetProfileQuery, useSubmitPinMutation } = api
