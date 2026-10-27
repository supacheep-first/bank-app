export const PIN_LENGTH = 6

export default function PinDots({ filled }: { filled: number }) {
  return (
    <div className="pin__dots">
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <span key={i} className={i < filled ? 'pin__dot is-filled' : 'pin__dot'} />
      ))}
    </div>
  )
}
