import { useEffect, useRef, useState, type FormEvent } from 'react'
import { closeClassified, createClassified, createReport, getClassifieds } from './api'
import { ApiError } from './api'
import type { CampusClassified, ClassifiedCategory, ReportReason, Session } from './types'
import { Search, SearchX } from 'lucide-react'

const categories: { value: ClassifiedCategory; label: string }[] = [
  { value: 'CARAVAN', label: 'Caravane' },
  { value: 'CARPOOL', label: 'Covoiturage' },
  { value: 'HOUSING', label: 'Logement et colocation' },
  { value: 'SALE', label: 'Vente et achat' },
  { value: 'LOST_FOUND', label: 'Perdu ou trouvé' },
  { value: 'OTHER', label: 'Autre' },
]
const reasons: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam ou contenu trompeur' },
  { value: 'HARASSMENT', label: 'Harcèlement ou propos haineux' },
  { value: 'MISINFORMATION', label: 'Information potentiellement fausse' },
  { value: 'OTHER', label: 'Autre motif' },
]

function showError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function ClassifiedsScreen({ session }: { session: Session }) {
  const [items, setItems] = useState<CampusClassified[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ClassifiedCategory | ''>('')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ClassifiedCategory>('CARPOOL')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')
  const [reportingId, setReportingId] = useState('')
  const [reportReason, setReportReason] = useState<ReportReason>('OTHER')
  const [reportDetails, setReportDetails] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const requestId = useRef(0)
  const busy = busyId !== ''

  async function refresh(nextQuery = query, nextFilter = filter) {
    const currentRequest = ++requestId.current
    setLoading(true)
    try {
      const result = await getClassifieds(session.accessToken, { q: nextQuery, category: nextFilter || undefined })
      if (currentRequest === requestId.current) { setItems(result.content); setError('') }
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(showError(requestError, 'Impossible de charger les annonces.'))
    } finally { if (currentRequest === requestId.current) setLoading(false) }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(query, filter) }, 300)
    return () => { window.clearTimeout(timer); requestId.current += 1 }
  }, [query, filter, session.accessToken])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyId('create'); setError(''); setNotice('')
    const amount = price.trim() ? Number(price.replace(',', '.')) : undefined
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      setError('Le prix doit être un montant valide, supérieur ou égal à 0.')
      setBusyId('')
      return
    }
    try {
      const supportsPrice = category === 'SALE' || category === 'HOUSING'
      await createClassified(session.accessToken, { title: title.trim(), description: description.trim(), category, price: supportsPrice ? amount : undefined, location: location.trim() || undefined })
      setTitle(''); setDescription(''); setPrice(''); setLocation(''); setCategory('CARPOOL'); setFormOpen(false)
      setNotice('Annonce publiée. Elle est maintenant visible par la communauté.')
      await refresh()
    } catch (requestError) { setError(showError(requestError, 'Impossible de publier cette annonce.')) }
    finally { setBusyId('') }
  }

  async function close(item: CampusClassified) {
    setBusyId(item.id); setError(''); setNotice('')
    try {
      await closeClassified(session.accessToken, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setNotice('Annonce clôturée et retirée du tableau actif.')
    } catch (requestError) { setError(showError(requestError, 'Impossible de clôturer cette annonce.')) }
    finally { setBusyId('') }
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reportingId) return
    setBusyId(`report-${reportingId}`); setError(''); setNotice('')
    try {
      await createReport(session.accessToken, 'CLASSIFIED', reportingId, reportReason, reportDetails.trim())
      setReportingId(''); setReportDetails(''); setNotice('Merci, le signalement a été transmis à la modération.')
    } catch (requestError) { setError(showError(requestError, 'Impossible de transmettre le signalement.')) }
    finally { setBusyId('') }
  }

  return <main className="page-enter mx-auto max-w-5xl px-5 sm:px-8">
    <section className="hero-panel mb-7 flex flex-col gap-5 rounded-3xl bg-emerald-950 px-6 py-7 text-white sm:flex-row sm:items-end sm:justify-between sm:px-8">
      <div><p className="text-sm font-bold tracking-wide text-emerald-200">Entraide et vie pratique</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Petites annonces</h1><p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">Covoiturage, logement, ventes et objets perdus ou retrouvés entre membres du campus.</p></div>
      <button className="btn btn-primary shrink-0" onClick={() => setFormOpen((value) => !value)} type="button">{formOpen ? 'Fermer le formulaire' : 'Déposer une annonce'}</button>
    </section>

    {notice && <div className="alert alert-success mb-4" role="status"><span>{notice}</span><button className="btn btn-ghost btn-xs" onClick={() => setNotice('')} type="button" aria-label="Fermer le message">✕</button></div>}
    {error && <div className="alert alert-error mb-4" role="alert"><span>{error}</span><button className="btn btn-ghost btn-xs" onClick={() => setError('')} type="button" aria-label="Fermer le message">✕</button></div>}

    {formOpen && <form className="card card-border mb-6 bg-base-100 shadow-sm" onSubmit={submit}>
      <div className="card-body gap-4">
        <div><h2 className="card-title">Nouvelle annonce</h2><p className="text-sm text-base-content/65">Décrivez clairement ce que vous proposez ou recherchez.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-sm font-semibold">Catégorie</span><select className="select w-full" value={category} onChange={(event) => setCategory(event.target.value as ClassifiedCategory)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Titre</span><input className="input w-full" maxLength={120} minLength={4} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Deux places pour Ziguinchor–Dakar" /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Description</span><textarea className="textarea min-h-28 w-full" maxLength={3000} minLength={10} required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ajoutez les détails utiles à la communauté." /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Lieu ou trajet <span className="font-normal text-base-content/60">(facultatif)</span></span><input className="input w-full" maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex. Campus, Ziguinchor" /></label>
          {(category === 'SALE' || category === 'HOUSING') && <label className="block"><span className="mb-1 block text-sm font-semibold">Prix en FCFA <span className="font-normal text-base-content/60">(facultatif)</span></span><input className="input w-full" min="0" step="100" type="number" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Ex. 15000" /></label>}
        </div>
        <div className="card-actions justify-end"><button className="btn btn-ghost" disabled={busy} onClick={() => setFormOpen(false)} type="button">Annuler</button><button className="btn btn-primary" disabled={busy || !title.trim() || !description.trim()} type="submit">{busyId === 'create' ? 'Publication…' : 'Publier l’annonce'}</button></div>
      </div>
    </form>}

    <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
      <label className="input w-full"><Search aria-hidden="true" size={17} /><input aria-label="Rechercher dans les annonces" placeholder="Mot-clé, trajet, logement…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label="Filtrer par catégorie" className="select w-full" value={filter} onChange={(event) => setFilter(event.target.value as ClassifiedCategory | '')}><option value="">Toutes les catégories</option>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    </div>

    {loading ? <div className="grid gap-4 sm:grid-cols-2"><div className="skeleton h-48" /><div className="skeleton h-48" /></div>
      : items.length === 0 ? <div className="card card-border bg-base-100"><div className="card-body items-center py-12 text-center"><SearchX aria-hidden="true" className="text-stone-400" size={32} /><h2 className="card-title">Aucune annonce pour l’instant</h2><p className="text-sm text-base-content/65">Essayez une autre recherche ou publiez la première annonce.</p><button className="btn btn-primary mt-2" onClick={() => setFormOpen(true)} type="button">Déposer une annonce</button></div></div>
        : <div className="grid items-start gap-4 md:grid-cols-2">{items.map((item) => <article className="card card-border bg-base-100 shadow-sm" key={item.id}>
          <div className="card-body gap-3">
            <div className="flex items-start justify-between gap-3"><span className="badge badge-soft badge-primary">{categories.find((option) => option.value === item.category)?.label ?? item.category}</span>{item.price !== null && <span className="text-sm font-bold text-emerald-900">{new Intl.NumberFormat('fr-FR').format(item.price)} FCFA</span>}</div>
            <h2 className="card-title leading-snug">{item.title}</h2><p className="whitespace-pre-wrap text-sm leading-6 text-base-content/75">{item.description}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-base-200 pt-3 text-xs text-base-content/60"><span>{item.authorName}</span>{item.location && <span>{item.location}</span>}<time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</time></div>
            <div className="card-actions justify-end">{item.authorId === session.user.id && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void close(item)} type="button">{busyId === item.id ? 'Clôture…' : 'Clôturer'}</button>}{item.authorId !== session.user.id && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setReportingId(item.id); setReportDetails('') }} type="button">Signaler</button>}</div>
            {reportingId === item.id && <form className="space-y-2 border-t border-base-200 pt-3" onSubmit={report}><select aria-label="Motif du signalement" className="select select-sm w-full" value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)}>{reasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</select><textarea aria-label="Détails du signalement" className="textarea textarea-sm w-full" maxLength={1000} placeholder="Détail facultatif" value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} /><div className="flex justify-end gap-2"><button className="btn btn-ghost btn-xs" disabled={busy} onClick={() => setReportingId('')} type="button">Annuler</button><button className="btn btn-warning btn-xs" disabled={busy} type="submit">{busyId === `report-${item.id}` ? 'Envoi…' : 'Envoyer'}</button></div></form>}
          </div>
        </article>)}</div>}
  </main>
}
