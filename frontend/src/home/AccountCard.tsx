import type { Account } from '../api'
import { accountDetails, accountName, formatMoney } from './format'

// open-one-at-a-time lives in MainPage; the card only shows what it is told
export interface MenuState {
  open: boolean
  onToggle: () => void
}

// ⋮ button + its menu, shared by both card sizes. The items do nothing (DECISIONS 21).
export function MoreMenu({
  items,
  small,
  open,
  onToggle,
}: MenuState & { items: string[]; small?: boolean }) {
  return (
    <>
      <button type="button" className={small ? 'main-acc__more main-acc__more--small' : 'main-acc__more'} onClick={onToggle}>
        <span className="blind">More Action</span>
      </button>
      {/* th-bank.css hides .tooltip; the template's script switches it on, so inline display here */}
      {open && (
        <div className={small ? 'tooltip tooltip--sub-acc' : 'tooltip'} style={{ display: 'block' }}>
          {items.map((item) => (
            <button key={item} type="button" className="tooltip__btn-more">
              {item}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// The one place that picks the bottom-right corner (DECISIONS 13)
function Corner({ type, flags, progress = 0 }: Account) {
  if (type === 'goal-saving-account') {
    return (
      <div className="main-acc__circle">
        <svg className="graph-bar" width="100%" height="100%" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
          <circle
            className="gauge"
            cx="21"
            cy="21"
            r="15.91549430918954"
            fill="transparent"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDashoffset="25"
            style={{ strokeDasharray: `${progress} ${100 - progress}` }}
          />
        </svg>
        <div className="main-acc__num">
          <span className="percent">{progress}</span>
          <span className="unit">%</span>
        </div>
      </div>
    )
  }
  const [act, label] =
    type === 'saving-account' ? ['money', 'Add money'] : flags?.includes('Overdue') ? ['pay', 'Pay'] : ['disburse', 'Disburse']
  return (
    <button type="button" className={`main-acc__act main-acc__act--${act}`}>
      <span className="blind">{label}</span>
    </button>
  )
}

export default function AccountCard({ account, ...menu }: { account: Account } & MenuState) {
  return (
    <div className="main-acc is-small" style={{ background: account.color }}>
      <div className="main-acc__top">
        <h2 className="main-acc__name">{accountName(account)}</h2>
        <span className="main-acc__amount">{formatMoney(account.amount, account.currency)}</span>
        {account.flags?.map((flag) => (
          <span key={flag} className={flag === 'Disbursement' ? 'main-acc__flag main-acc__flag--lock' : 'main-acc__flag'}>
            {flag}
          </span>
        ))}
      </div>
      <div className="main-acc__bottom">
        {accountDetails(account).map((line) => (
          <span key={line} className="main-acc__detail">
            {line}
          </span>
        ))}
      </div>
      <MoreMenu items={['Copy account number', 'Edit Name and Color']} small {...menu} />
      <Corner {...account} />
    </div>
  )
}
