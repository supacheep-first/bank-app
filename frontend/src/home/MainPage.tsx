import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import {
  useGetAccountsQuery,
  useGetBannersQuery,
  useGetDebitCardsQuery,
  useGetRecentQuery,
  useGetUserQuery,
} from '../api'
import Loader from '../common/Loader'
import AccountCard from './AccountCard'
import Banner from './Banner'
import DebitCardList from './DebitCardList'
import Header from './Header'
import LoadError from './LoadError'
import MainAccountCard from './MainAccountCard'
import RecentList from './RecentList'

// Main endpoints take no userId, so every user shares one cache key: always refetch on mount
const FRESH = { refetchOnMountOrArgChange: true }

// isError, not error: a refetch keeps the previous error until it settles
const unauthorized = ({ isError, error }: { isError: boolean; error?: object }) =>
  isError && !!error && 'status' in error && error.status === 401

export default function MainPage() {
  const user = useGetUserQuery(undefined, FRESH)
  const accounts = useGetAccountsQuery(undefined, FRESH)
  const recent = useGetRecentQuery(undefined, FRESH)
  const debitCards = useGetDebitCardsQuery(undefined, FRESH)
  const banners = useGetBannersQuery(undefined, FRESH)
  const queries = [user, accounts, recent, debitCards, banners]
  // index (in the accounts array) of the card whose ⋮ menu is open: one state = one menu at a time.
  // Not accountNumber: the mock repeats a number within one user's accounts.
  const [menu, setMenu] = useState<number>()

  // a click outside every ⋮ button and menu closes the open one (the buttons toggle themselves)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.main-acc__more, .tooltip')) setMenu(undefined)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  if (queries.some(unauthorized)) return <Navigate to="/pin" replace />
  // wait for every query so a 401 still arrives before the error box
  if (queries.some((q) => q.isFetching)) return <Loader />
  // whole-page box, never a page with parts missing; Try again refetches only the ones that failed
  if (queries.some((q) => q.isError)) {
    return <LoadError onRetry={() => queries.filter((q) => q.isError).forEach((q) => q.refetch())} />
  }

  const menuState = (i: number) => ({
    open: menu === i,
    onToggle: () => setMenu(menu === i ? undefined : i),
  })
  const mainIndex = accounts.data?.findIndex((a) => a.isMainAccount) ?? -1

  return (
    <div className="wrap">
      <Header />
      <main className="container container--main">
        <div className="content_wrap">
          <div className="main-top">
            <h1 className="main-top__tit main-loading main-loading--order1">{user.data?.greetingMessage}</h1>
          </div>
          {mainIndex >= 0 && <MainAccountCard account={accounts.data![mainIndex]} {...menuState(mainIndex)} />}
          {recent.data && <RecentList items={recent.data} />}
          {debitCards.data && <DebitCardList cards={debitCards.data} />}
          {accounts.data?.map((a, i) => !a.isMainAccount && <AccountCard key={i} account={a} {...menuState(i)} />)}
          {banners.data?.map((b, i) => <Banner key={i} {...b} />)}
          <div className="main-tb">
            <button type="button" className="link-to">
              Total Balance
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
