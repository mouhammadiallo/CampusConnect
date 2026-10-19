import { useEffect, useState } from 'react'
import { getOpenReports, resolveReport } from '../api'
import type { ModerationReport, ReportAction } from '../types'
import { errorMessage, REPORT_REASONS } from '../components/shared'

function ModerationScreen({ token }: { token: string }) {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [suspensionHours, setSuspensionHours] = useState(24)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setReports(await getOpenReports(token))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [token])

  async function decide(report: ModerationReport, action: ReportAction) {
    if (action === 'SUSPEND' && (!Number.isInteger(suspensionHours) || suspensionHours < 1 || suspensionHours > 720)) {
      setError('La suspension doit durer entre 1 et 720 heures.')
      return
    }
    setBusyId(report.id)
    setError('')
    setMessage('')
    try {
      await resolveReport(token, report.id, action, (notes[report.id] ?? '').trim(), action === 'SUSPEND' ? suspensionHours : undefined)
      setReports((current) => current.filter((item) => item.id !== report.id))
      setNotes((current) => { const next = { ...current }; delete next[report.id]; return next })
      setMessage(action === 'DISMISS' ? 'Signalement classé sans suite.' : action === 'WARN' ? 'Avertissement enregistré.' : `Compte suspendu pour ${suspensionHours} heure(s).`)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId('')
    }
  }

  return <main className="page-enter mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
    <div className="page-heading mb-6"><p className="page-kicker">Espace modérateur</p><h1 className="mt-1 text-3xl font-bold tracking-tight">File de modération</h1><p className="mt-2 text-sm leading-6 text-stone-500">Examinez les signalements et consignez une décision.</p></div>
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
    {message && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{message}</p>}
    {loading ? <p className="loading-surface rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Chargement des signalements…</p>
      : reports.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="text-lg font-bold">La file est vide</p><p className="mt-2 text-sm text-stone-500">Aucun signalement en attente.</p></div>
        : <div className="stagger-list space-y-4">{reports.map((report) => <article className="interactive-card rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={report.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{report.contentType}</span><h2 className="mt-3 text-lg font-bold text-stone-900">{REPORT_REASONS[report.reason]}</h2></div><time className="text-xs text-stone-500" dateTime={report.createdAt}>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.createdAt))}</time></div>
          <p className="mt-3 text-sm text-stone-600">Signalé par <strong>{report.reporterName}</strong> · contenu de <strong>{report.contentAuthorName}</strong></p>
          {report.details && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">{report.details}</p>}
          <p className="mt-3 text-xs text-stone-400">Référence du contenu : {report.contentId}</p>
          <div className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-[1fr_180px_auto]">
            <input aria-label={`Note de modération pour le signalement ${report.id}`} className="field" disabled={busyId !== ''} maxLength={1000} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Note interne (facultatif)" value={notes[report.id] ?? ''} />
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">Durée suspension (h)<input aria-label="Durée de suspension en heures" className="field w-20" max={720} min={1} onChange={(event) => setSuspensionHours(Number(event.target.value))} type="number" value={suspensionHours} /></label>
            <div className="flex flex-wrap gap-2"><button className="btn btn-ghost btn-sm" disabled={busyId !== ''} onClick={() => void decide(report, 'DISMISS')} type="button">Classer</button><button className="btn btn-primary btn-sm" disabled={busyId !== ''} onClick={() => void decide(report, 'WARN')} type="button">Avertir</button><button className="btn btn-error btn-sm" disabled={busyId !== ''} onClick={() => void decide(report, 'SUSPEND')} type="button">Suspendre</button></div>
          </div>
        </article>)}</div>}
  </main>
}


export default ModerationScreen
