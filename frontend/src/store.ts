import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import identity from './identity'

const USER_ID_KEY = 'userId'

function readUserId() {
  try {
    return localStorage.getItem(USER_ID_KEY)
  } catch (e) {
    console.warn('localStorage unavailable, userId will not survive a refresh', e)
    return null
  }
}

export const store = configureStore({
  reducer: { identity, [api.reducerPath]: api.reducer },
  preloadedState: { identity: { userId: readUserId(), userNotFound: false } },
  middleware: (getDefault) => getDefault().concat(api.middleware),
})

// The only place that writes userId to storage; reducers stay pure.
let saved = store.getState().identity.userId
store.subscribe(() => {
  const { userId } = store.getState().identity
  if (userId === saved) return
  saved = userId
  try {
    if (userId) localStorage.setItem(USER_ID_KEY, userId)
    else localStorage.removeItem(USER_ID_KEY)
  } catch (e) {
    console.warn('localStorage unavailable, userId will not survive a refresh', e)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
