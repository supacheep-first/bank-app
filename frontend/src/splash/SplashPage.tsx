import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import Loader from '../common/Loader'
import { useProfile } from '../hooks'

export default function SplashPage() {
  const { isLoading } = useProfile()
  const [minTimePassed, setMinTimePassed] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (minTimePassed && !isLoading) return <Navigate to="/pin" replace />
  return <Loader />
}
