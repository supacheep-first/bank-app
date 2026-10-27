import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ERROR_MESSAGE, useLazyGetProfileQuery } from '../api'
import { useAppDispatch, useAppSelector } from '../hooks'
import { identified } from '../identity'
import './IdentifyDialog.css'

interface IdentifyDialogProps {
  onClose: () => void // the ✕ or Esc, only when closable
  onIdentified: () => void // the page clears its PIN dots and message
}

// Mounted only while open and keyed by userId, so every opening starts from fresh state.
export default function IdentifyDialog({ onClose, onIdentified }: IdentifyDialogProps) {
  const dispatch = useAppDispatch()
  const { userId, userNotFound } = useAppSelector((state) => state.identity)
  const [getProfile, { isFetching }] = useLazyGetProfileQuery()
  const ref = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(userId ?? 'clare')
  // one slot: "User not found." for a 404, ERROR_MESSAGE for any other failure (not a 404 text: it would say this id does not exist)
  const [error, setError] = useState(userNotFound ? 'User not found.' : undefined)
  const closable = !!userId

  useEffect(() => ref.current!.showModal(), [])

  async function confirm(e: FormEvent) {
    e.preventDefault()
    const result = await getProfile(value)
    if (result.isSuccess) {
      dispatch(identified(value))
      onIdentified()
    } else {
      const notFound = !!result.error && 'status' in result.error && result.error.status === 404
      setError(notFound ? 'User not found.' : ERROR_MESSAGE)
    }
  }

  return (
    <dialog
      ref={ref}
      className="identify"
      aria-labelledby="identify-title"
      onCancel={(e) => {
        if (!closable) e.preventDefault()
      }}
      // Chrome skips a prevented cancel on a repeated Esc; reopen so it can never stay closed
      onClose={(e) => (closable ? onClose() : e.currentTarget.showModal())}
    >
      <form onSubmit={confirm}>
        <h2 id="identify-title" className="identify__title">
          Login with ID
        </h2>
        <label className="identify__label" htmlFor="identify-user-id">
          User ID
        </label>
        <input
          id="identify-user-id"
          className="identify__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isFetching}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {error && (
          <p className="identify__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="identify__confirm" disabled={isFetching}>
          Confirm
        </button>
      </form>
      {closable && <button type="button" className="identify__close header__cxl" aria-label="Close" onClick={onClose} />}
    </dialog>
  )
}
