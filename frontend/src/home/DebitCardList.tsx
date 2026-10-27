import type { CSSProperties } from 'react'
import type { DebitCard } from '../api'

// "in-progress" → "In progress"
const statusText = (s: string) => s[0].toUpperCase() + s.slice(1).replace(/-/g, ' ')

// The template hard-codes 1595px. Content width: each card is 240 + 5px margin both sides, "See all" is 94 with no margin
// (th-bank.css adds the 20px padding on each side). Narrower than this and the last item wraps to a second row.
const stripWidth = (count: number) => count * 250 + 94

// Only the template's white card has dark text (#97999e, issuer #d3d3d2); every other colour keeps the CSS default white.
// Cards and "See all" do nothing yet, so they are buttons (DECISIONS 21); the key is the index, names repeat in the mock.
export default function DebitCardList({ cards }: { cards: DebitCard[] }) {
  return (
    <div className="debit-swipe__wrap main-loading main-loading--order6">
      <div className="debit-swipe__inner">
        <div className="debit-swipe__lst" style={{ width: stripWidth(cards.length) }}>
          {cards.map(({ name, status, issuer, color, borderColor, number }, i) => {
            const white = color === '#ffffff'
            return (
              <button
                key={i}
                type="button"
                className="debit-swipe__item"
                style={
                  {
                    textAlign: 'left',
                    backgroundColor: color,
                    ...(white && { color: '#97999e' }),
                    '--border-color': borderColor,
                  } as CSSProperties
                }
              >
                <strong className="debit-swipe__name">{name}</strong>
                {status === 'Active' ? (
                  <span className="debit-swipe__etc debit-swipe__etc--active">
                    <span className="debit-swipe__etc__num">{number}</span>
                  </span>
                ) : (
                  <span className="debit-swipe__etc">{statusText(status)}</span>
                )}
                <span className="debit-swipe__issue" style={white ? { color: '#d3d3d2' } : undefined}>
                  Issued by {issuer}
                </span>
              </button>
            )
          })}
          <button type="button" className="debit-swipe__item debit-swipe__item--all">
            See all
          </button>
        </div>
      </div>
    </div>
  )
}
