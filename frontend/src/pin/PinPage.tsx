import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ERROR_MESSAGE, useSubmitPinMutation } from '../api'
import { useAppDispatch, useAppSelector, useProfile } from '../hooks'
import { forgotten } from '../identity'
import IdentifyDialog from './IdentifyDialog'
import Keypad from './Keypad'
import PinDots, { PIN_LENGTH } from './PinDots'

// Go's error body; the page builds its own text from these fields
interface PinErrorData {
  error?: { attemptsLeft?: number; retryAfterSec?: number }
}

export default function PinPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { name, failed: profileFailed } = useProfile()
  const userId = useAppSelector((state) => state.identity.userId)
  const [submitPin, { isLoading }] = useSubmitPinMutation()
  const [pin, setPin] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState<number>()
  const [secondsLeft, setSecondsLeft] = useState(0)
  // undefined until the first submit, so the profile's own error shows; after that only a failed submit does
  const [pinFailed, setPinFailed] = useState<boolean>()
  const [linkOpen, setLinkOpen] = useState(false)
  const dialogOpen = !userId || linkOpen
  const locked = secondsLeft > 0
  const disabled = isLoading || locked
  const showMessage = locked || attemptsLeft !== undefined || (pinFailed ?? profileFailed)

  // decrements per timeout, so it can run late (e.g. a background tab); the server stays the judge
  useEffect(() => {
    if (!locked) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function submit(id: string, code: string) {
    setAttemptsLeft(undefined) // the 401 text stays until this next submit
    setPinFailed(false) // so does the general error text, profile's included
    const { error } = await submitPin({ userId: id, pin: code })
    if (!error) {
      navigate('/main', { replace: true })
      return
    }
    setPin('')
    const status = 'status' in error ? error.status : undefined
    const body = 'data' in error ? (error.data as PinErrorData | undefined)?.error : undefined
    if (status === 401) setAttemptsLeft(body?.attemptsLeft)
    else if (status === 429) setSecondsLeft(body?.retryAfterSec ?? 0)
    else if (status === 404) dispatch(forgotten()) // same as a profile 404: the non-closable dialog opens
    else setPinFailed(true) // 500 · network · timeout · 400; no auto-resend, a timeout may already have counted
  }

  function press(digit: string) {
    if (!userId || disabled) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) submit(userId, next)
  }

  function remove() {
    if (!disabled) setPin(pin.slice(0, -1))
  }

  // the lock belongs to the previous user, so a new identity starts clean
  function onIdentified() {
    setLinkOpen(false)
    setPin('')
    setAttemptsLeft(undefined)
    setSecondsLeft(0)
    setPinFailed(false)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (dialogOpen || e.ctrlKey || e.metaKey || e.altKey) return
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') remove()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="wrap">
      <main className="container container--pin-type">
        <div className="pin">
          <div className="pin__top">
            <span className="pin__photo" />
            {/* the template pulls .pin__dsc up over the name, so the message takes the name's place */}
            <h1 className="pin__name" style={{ visibility: showMessage ? 'hidden' : undefined }}>
              {name}
            </h1>
            {showMessage && (
              <p className="pin__dsc">
                {locked ? (
                  `Too many attempts. Try again in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}.`
                ) : attemptsLeft !== undefined ? (
                  <>
                    Invalid PIN Code. <br />
                    {`You have ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`}
                  </>
                ) : (
                  ERROR_MESSAGE
                )}
              </p>
            )}
            <PinDots filled={pin.length} />
          </div>
          <div className="pin__btm">
            <button type="button" className="pin__login" onClick={() => setLinkOpen(true)}>
              Login with ID / Password
            </button>
            <span className="pin__kb">Powered by TestLab</span>
            <Keypad disabled={disabled} onDigit={press} onDelete={remove} />
          </div>
        </div>
      </main>
      {dialogOpen && (
        <IdentifyDialog key={userId ?? ''} onClose={() => setLinkOpen(false)} onIdentified={onIdentified} />
      )}
    </div>
  )
}
