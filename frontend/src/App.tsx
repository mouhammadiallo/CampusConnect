import { useEffect, useState } from 'react'
import { SESSION_EXPIRED_EVENT } from './api'
import type { Session } from './types'
import FeedPage from './pages/FeedPage'
import AuthPage from './pages/AuthPage'
import type { UserProfile } from './types'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'

const SESSION_KEY = 'campusconnect.session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) { localStorage.removeItem(SESSION_KEY); return null }
    const session = value as Partial<Session>
    const user = session.user
    const validUser = typeof user === 'object' && user !== null && typeof user.id === 'string'
      && typeof user.fullName === 'string' && typeof user.role === 'string'
    if (typeof session.accessToken === 'string' && session.accessToken.length > 0 && validUser) return session as Session
    localStorage.removeItem(SESSION_KEY)
    return null
  } catch {
    try { localStorage.removeItem(SESSION_KEY) } catch { /* Storage may be unavailable in private browsing. */ }
    return null
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [sessionNotice, setSessionNotice] = useState('')

  useEffect(() => {
    function expireSession() {
      try { localStorage.removeItem(SESSION_KEY) } catch { /* The in-memory session still ends. */ }
      setSessionNotice('Votre session a expiré. Reconnectez-vous pour continuer.')
      setSession(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession)
  }, [])

  function authenticateSession(nextSession: Session) {
    setSessionNotice('')
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)) } catch { /* Keep the session for this browser tab. */ }
    setSession(nextSession)
  }

  function signOut() {
    try { localStorage.removeItem(SESSION_KEY) } catch { /* The in-memory session still ends. */ }
    setSessionNotice('')
    setSession(null)
  }

  function updateUser(user: UserProfile) {
    setSession((current) => {
      if (!current) return current
      const updated = { ...current, user }
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(updated)) } catch { /* Keep updated profile data in memory. */ }
      return updated
    })
  }

  return <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: 'easeOut' }}><AnimatePresence initial={false} mode="wait"><motion.div animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[var(--color-canvas)] text-stone-900" exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: 8 }} key={session ? 'authenticated' : 'anonymous'}>{session ? <FeedPage onSignOut={signOut} onUserUpdated={updateUser} session={session} /> : <AuthPage notice={sessionNotice} onAuthenticated={authenticateSession} />}</motion.div></AnimatePresence></MotionConfig>
}
