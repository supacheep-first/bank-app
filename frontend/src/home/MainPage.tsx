import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useGetAccountsQuery, useGetUserQuery } from '../api'
import Loader from '../common/Loader'
import AccountCard from './AccountCard'
import Header from './Header'
import MainAccountCard from './MainAccountCard'

// Main endpoints take no userId, so every user shares one cache key: always refetch on mount (DECISIONS 20)
const FRESH = { refetchOnMountOrArgChange: true }

// isError, not error: a refetch keeps the previous error until it settles
const unauthorized = ({ isError, error }: { isError: boolean; error?: object }) =>
  isError && !!error && 'status' in error && error.status === 401

export default function MainPage() {
  const user = useGetUserQuery(undefined, FRESH)
  const accounts = useGetAccountsQuery(undefined, FRESH)
  // cards 07–08: give the endpoint keepUnusedDataFor: 0 in api.ts, call its query with FRESH and add it to this list
  const queries = [user, accounts]
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
  if (queries.some((q) => q.isFetching)) return <Loader />

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
          {/* order: main account (order3) · recent (order5) · debit cards (order6) · other accounts · banner · Total Balance */}
          {accounts.data?.map((a, i) => !a.isMainAccount && <AccountCard key={i} account={a} {...menuState(i)} />)}
        </div>
      </main>
    </div>
  )
}
