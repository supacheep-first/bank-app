interface KeypadProps {
  disabled: boolean
  onDigit: (digit: string) => void
  onDelete: () => void
}

export default function Keypad({ disabled, onDigit, onDelete }: KeypadProps) {
  const key = (digit: string) => (
    <button key={digit} type="button" className="pin__key" disabled={disabled} onClick={() => onDigit(digit)}>
      {digit}
    </button>
  )
  return (
    <div className="pin__keys">
      {[...'123456789'].map(key)}
      <span className="pin__key pin__key--space" />
      {key('0')}
      <button type="button" className="pin__key pin__key--del" disabled={disabled} onClick={onDelete}>
        <span className="blind">Delete</span>
      </button>
    </div>
  )
}
