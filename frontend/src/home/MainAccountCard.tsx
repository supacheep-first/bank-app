import type { Account } from '../api'
import { MoreMenu, type MenuState } from './AccountCard'
import { accountDetails, accountName, formatMoney } from './format'

export default function MainAccountCard({ account, ...menu }: { account: Account } & MenuState) {
  return (
    <div className="main-acc main-acc--large main-loading main-loading--order3" style={{ background: account.color }}>
      <div className="main-acc__top">
        <h2 className="main-acc__name">{accountName(account)}</h2>
        <span className="main-acc__amount">{formatMoney(account.amount, account.currency)}</span>
        {accountDetails(account).map((line, i) => (
          <span key={line} className={i === 0 ? 'main-acc__detail main-acc__detail--num' : 'main-acc__detail'}>
            {line}
          </span>
        ))}
      </div>
      <div className="main-acc__bottom">
        <div className="main-acc__ani_box">
          <div className="main-acc__ani__item">
            <span className="main-acc__ani_img1"></span>
            <span className="main-acc__ani_img2"></span>
          </div>
          <div className="main-acc__ani__item2">
            <span className="main-acc__ani_img3"></span>
          </div>
        </div>
        {/* th-bank.css paints this box green; the card colour comes from the data */}
        <div className="main-acc__link__box" style={{ background: account.color }}>
          <div className="main-acc__link__item">
            <button type="button" className="main-acc__link main-acc__link--withdrawal">
              Withdrawal
            </button>
            <button type="button" className="main-acc__link main-acc__link--qr">
              QR scan
            </button>
            <button type="button" className="main-acc__link main-acc__link--addmoney">
              Add money
            </button>
          </div>
        </div>
      </div>
      <MoreMenu items={['Set main account', 'Copy account number', 'Edit Name and Color']} {...menu} />
    </div>
  )
}
