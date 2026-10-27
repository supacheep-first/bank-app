import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface IdentityState {
  userId: string | null
  userNotFound: boolean
}

const slice = createSlice({
  name: 'identity',
  initialState: { userId: null, userNotFound: false } as IdentityState,
  reducers: {
    identified: (_state, action: PayloadAction<string>) => ({ userId: action.payload, userNotFound: false }),
    forgotten: () => ({ userId: null, userNotFound: true }),
  },
})

export const { identified, forgotten } = slice.actions
export default slice.reducer
