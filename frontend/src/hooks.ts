import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetProfileQuery } from './api'
import { forgotten } from './identity'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

// Profile of the stored userId, shared by splash and the PIN page. 404 means the id is gone: forget it.
export function useProfile() {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state) => state.identity.userId)
  const { data, error, isError, isLoading } = useGetProfileQuery(userId ?? skipToken)
  const notFound = !!error && 'status' in error && error.status === 404
  useEffect(() => {
    if (notFound) dispatch(forgotten())
  }, [notFound, dispatch])
  // failed = broke without a name to show (a later failed dialog try keeps the old name and is not this page's problem)
  return { name: data?.name, isLoading, failed: isError && !notFound && !data }
}
