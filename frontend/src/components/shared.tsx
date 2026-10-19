import { useState, type FormEvent } from 'react'
import { createReport, ApiError } from '../api'
import type { ReportReason, ReportedContentType, Session } from '../types'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import ProfileAvatar from './ProfileAvatar'

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Une erreur inattendue est survenue. Réessayez.'
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

export function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export const REPORT_REASONS: Record<ReportReason, string> = {
  HARASSMENT: 'Harcèlement ou propos haineux',
  SPAM: 'Spam ou contenu trompeur',
  MISINFORMATION: 'Information potentiellement fausse',
  COPYRIGHT: 'Droits d’auteur',
  OTHER: 'Autre motif',
}

export function ReportDialog({ token, contentType, contentId, onClose }: { token: string; contentType: ReportedContentType; contentId: string; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason>('OTHER')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createReport(token, contentType, contentId, reason, details.trim())
      setSubmitted(true)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return <div className="border-t border-stone-100 bg-amber-50/70 px-5 py-4">
    {submitted ? <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-emerald-900">Merci. Le signalement a été transmis à la modération.</p><button className="text-sm font-bold text-stone-600 underline" onClick={onClose} type="button">Fermer</button></div>
      : <form className="space-y-3" onSubmit={submit}>
        <div className="flex items-center justify-between"><p className="text-sm font-bold text-stone-800">Signaler ce contenu</p><button className="text-xs font-semibold text-stone-500 hover:text-stone-900" onClick={onClose} type="button">Annuler</button></div>
        <select aria-label="Motif du signalement" className="field" onChange={(event) => setReason(event.target.value as ReportReason)} value={reason}>{Object.entries(REPORT_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <textarea aria-label="Détails facultatifs" className="field min-h-20" maxLength={1000} onChange={(event) => setDetails(event.target.value)} placeholder="Ajoutez un détail utile à l’équipe (facultatif)." value={details} />
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50" disabled={busy} type="submit">{busy ? 'Envoi…' : 'Envoyer le signalement'}</button>
      </form>}
  </div>
}

export function Header({ user, token, onSignOut }: { user?: Session['user']; token?: string; onSignOut?: () => void }) {
  return (
    <motion.header animate={{ opacity: 1, y: 0 }} className="app-header border-b border-emerald-950/10 bg-white/90" initial={{ opacity: 0, y: -8 }}>
      <nav className="header-inner mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link className="brand-link flex items-center gap-3" to="/" aria-label="CampusConnect, accueil">
          <span className="brand-mark grid size-10 place-items-center rounded-2xl text-lg font-bold text-white">C</span>
          <span>
            <span className="block font-bold tracking-tight text-emerald-950">CampusConnect</span>
            <span className="hidden text-xs text-stone-500 sm:block">Université Assane Seck de Ziguinchor</span>
          </span>
        </Link>
        {user && onSignOut && (
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ProfileAvatar avatarUrl={user.avatarUrl} attachment={user.avatarAttachment} className="size-9 text-xs" name={user.fullName} token={token} />
              <span className="hidden max-w-40 truncate text-sm font-semibold text-stone-700 sm:inline">{user.fullName}</span>
            </div>
            <button aria-label="Déconnexion" className="btn btn-ghost border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-emerald-800 hover:text-emerald-900" onClick={onSignOut} type="button"><LogOut aria-hidden="true" size={16} /><span className="hidden sm:inline">Déconnexion</span></button>
          </div>
        )}
      </nav>
    </motion.header>
  )
}

