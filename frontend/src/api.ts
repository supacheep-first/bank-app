import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', timeout: 10_000 }),
  endpoints: (build) => ({
    getProfile: build.query<{ name: string }, string>({
      query: (userId) => ({ url: '/auth/profile', params: { userId } }),
    }),
  }),
})

export const { useGetProfileQuery } = api
