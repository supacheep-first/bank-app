import { Navigate } from 'react-router'
import { useGetUserQuery } from '../api'
import Loader from '../common/Loader'
import Header from './Header'

// Main endpoints take no userId, so every user shares one cache key: always refetch on mount (DECISIONS 20)
const FRESH = { refetchOnMountOrArgChange: true }

// isError, not error: a refetch keeps the previous error until it settles
const unauthorized = ({ isError, error }: { isError: boolean; error?: object }) =>
  isError && !!error && 'status' in error && error.status === 401

export default function MainPage() {
  const user = useGetUserQuery(undefined, FRESH)
  // cards 06–08: give the endpoint keepUnusedDataFor: 0 in api.ts, call its query with FRESH and add it to this list
  const queries = [user]

  if (queries.some(unauthorized)) return <Navigate to="/pin" replace />
  if (queries.some((q) => q.isFetching)) return <Loader />

  return (
    <div className="wrap">
      <Header />
      <main className="container container--main">
        <div className="content_wrap">
          <div className="main-top">
            <h1 className="main-top__tit main-loading main-loading--order1">{user.data?.greetingMessage}</h1>
          </div>
          {/* order: main account (order3) · recent (order5) · debit cards (order6) · other accounts · banner · Total Balance */}
        </div>
      </main>
    </div>
  )
}
