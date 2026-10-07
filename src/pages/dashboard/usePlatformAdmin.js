import { useEffect, useState } from 'react'
import { sessionApi } from '../../utils/omniApi'

/** Capability controls navigation only; privileged APIs enforce authorization. */
export default function usePlatformAdmin(isAuthenticated, userId) {
  const [session, setSession] = useState(null)
  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined
    let current = true
    sessionApi.capabilities().then((data) => {
      if (current) setSession({ userId, allowed: data?.platformAdmin === true })
    }).catch(() => {
      if (current) setSession({ userId, allowed: false })
    })
    return () => { current = false }
  }, [isAuthenticated, userId])
  return Boolean(isAuthenticated && userId && session?.userId === userId && session.allowed)
}
