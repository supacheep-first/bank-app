import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLazyGetProfileQuery } from '../api'
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
  const [getProfile] = useLazyGetProfileQuery()
  const ref = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(userId ?? 'clare')
  const [notFound, setNotFound] = useState(userNotFound)
  const closable = !!userId

  useEffect(() => ref.current!.showModal(), [])

  async function confirm(e: FormEvent) {
    e.preventDefault()
    const result = await getProfile(value)
    if (result.isSuccess) {
      dispatch(identified(value))
      onIdentified()
    } else {
      // 500 / timeout show nothing yet (DECISIONS 24)
      setNotFound(!!result.error && 'status' in result.error && result.error.status === 404)
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
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {notFound && (
          <p className="identify__error" role="alert">
            User not found.
          </p>
        )}
        <button type="submit" className="identify__confirm">
          Confirm
        </button>
      </form>
      {closable && <button type="button" className="identify__close header__cxl" aria-label="Close" onClick={onClose} />}
    </dialog>
  )
}
