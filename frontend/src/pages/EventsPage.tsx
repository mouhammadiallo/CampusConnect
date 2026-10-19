import { useEffect, useState, type FormEvent } from 'react'
import { createEvent, getEvents, setEventRsvp } from '../api'
import type { CampusEvent } from '../types'
import { errorMessage, ReportDialog } from '../components/shared'
import { MapPin } from 'lucide-react'

function EventCard({ campusEvent, busy, token, userId, onRsvp }: { campusEvent: CampusEvent; busy: boolean; token: string; userId: string; onRsvp: () => void }) {
  const [reporting, setReporting] = useState(false)
  const eventDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(campusEvent.startsAt))
  return <article className="interactive-card overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="p-5">
      <time className="text-xs font-bold uppercase tracking-wide text-emerald-800" dateTime={campusEvent.startsAt}>{eventDate}</time>
      <h2 className="mt-2 text-xl font-bold text-stone-900">{campusEvent.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">{campusEvent.description}</p>
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-stone-700"><MapPin aria-hidden="true" className="text-emerald-700" size={16} />{campusEvent.location}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3"><span className="text-xs text-stone-500">{campusEvent.attendeesCount} participant{campusEvent.attendeesCount === 1 ? '' : 's'}</span><div className="flex items-center gap-3"><button aria-pressed={campusEvent.attending} className={`rsvp-button rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 ${campusEvent.attending ? 'border border-emerald-900 text-emerald-900 hover:bg-emerald-50' : 'button-primary bg-emerald-900 text-white hover:bg-emerald-800'}`} disabled={busy} onClick={onRsvp} type="button">{busy ? 'Un instant…' : campusEvent.attending ? 'Je ne participe plus' : 'Je participe'}</button>{campusEvent.authorId !== userId && <button className="text-xs font-semibold text-stone-500 hover:text-amber-900" onClick={() => setReporting((value) => !value)} type="button">Signaler</button>}</div></div>
      <p className="mt-3 text-xs text-stone-400">Proposé par {campusEvent.authorName}</p>
    </div>
    {reporting && <ReportDialog contentId={campusEvent.id} contentType="EVENT" onClose={() => setReporting(false)} token={token} />}
  </article>
}

function EventsScreen({ token, userId }: { token: string; userId: string }) {
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function loadEvents() {
    setLoading(true)
    setError('')
    try {
      setEvents(await getEvents(token))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadEvents() }, [token])

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const dateValue = String(form.get('startsAt') ?? '')
    const startsAt = new Date(dateValue)
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      setError('Choisissez une date et une heure dans le futur.')
      return
    }
    setBusyId('new')
    try {
      const created = await createEvent(token, {
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        location: String(form.get('location') ?? ''),
        startsAt: startsAt.toISOString(),
      })
      setEvents((current) => [...current, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
      setShowForm(false)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId('')
    }
  }

  async function updateRsvp(current: CampusEvent) {
    setBusyId(current.id)
    setError('')
    try {
      const updated = await setEventRsvp(token, current.id, !current.attending)
      setEvents((items) => items.map((item) => item.id === updated.id ? updated : item))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="page-enter mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="page-heading mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="page-kicker">À vivre ensemble</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Événements campus</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Découvrez les prochains rendez-vous et indiquez votre présence.</p></div>
        <button className="button-primary rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => setShowForm((shown) => !shown)} type="button">{showForm ? 'Fermer' : '+ Créer un événement'}</button>
      </div>
      {showForm && <form className="form-enter mb-5 grid gap-3 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:grid-cols-2" onSubmit={submitEvent}>
        <label className="field-label">Nom de l’événement<input className="field mt-1.5" maxLength={160} name="title" placeholder="Ex. Rencontre des clubs" required /></label>
        <label className="field-label">Date et heure<input className="field mt-1.5" name="startsAt" required type="datetime-local" /></label>
        <label className="field-label sm:col-span-2">Lieu<input className="field mt-1.5" maxLength={200} name="location" placeholder="Ex. Amphi 1, campus de Ziguinchor" required /></label>
        <label className="field-label sm:col-span-2">Détails<textarea className="field mt-1.5 min-h-24" maxLength={3000} name="description" placeholder="Présentez le programme ou les informations utiles." required /></label>
        <div className="sm:col-span-2"><button className="rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" disabled={busyId === 'new'} type="submit">{busyId === 'new' ? 'Création…' : 'Publier l’événement'}</button></div>
      </form>}

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {loading ? <p className="loading-surface rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Chargement des événements…</p>
        : events.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="text-lg font-bold">Pas encore d’événement à venir</p><p className="mt-2 text-sm text-stone-500">Ajoutez le prochain rendez-vous de la vie du campus.</p></div>
          : <div className="stagger-list grid gap-4 md:grid-cols-2">{events.map((campusEvent) => <EventCard busy={busyId === campusEvent.id} campusEvent={campusEvent} key={campusEvent.id} onRsvp={() => void updateRsvp(campusEvent)} token={token} userId={userId} />)}</div>}
    </main>
  )
}


export default EventsScreen
