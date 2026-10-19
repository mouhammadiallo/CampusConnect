import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createResource, deleteResource, getResources, uploadFile, type ResourceFilters } from '../api'
import type { AcademicResource, ResourceType } from '../types'
import { errorMessage, safeWebUrl, ReportDialog } from '../components/shared'
import PrivateAttachment from '../components/PrivateAttachment'
import FilePicker from '../components/FilePicker'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Flag, Trash2 } from 'lucide-react'

const RESOURCE_LABELS: Record<ResourceType, string> = {
  COURSE: 'Cours',
  TUTORIAL: 'Travaux dirigés',
  PAST_PAPER: 'Annales',
  SUMMARY: 'Résumé',
  OTHER: 'Autre',
}

function ResourceCard({ resource, token, userId, onDeleted }: { resource: AcademicResource; token: string; userId: string; onDeleted: (resourceId: string) => void }) {
  const [reporting, setReporting] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const link = resource.url ? safeWebUrl(resource.url) : null
  async function removeResource() {
    if (!window.confirm('Supprimer définitivement cette ressource ?')) return
    setBusy(true)
    setError('')
    try {
      await deleteResource(token, resource.id)
      onDeleted(resource.id)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }
  return <motion.article animate={{ opacity: 1, y: 0 }} className="interactive-card overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" exit={{ opacity: 0, scale: .98 }} initial={{ opacity: 0, y: 10 }} layout>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">{RESOURCE_LABELS[resource.type]}</span><span className="text-right text-xs text-stone-500">{resource.studyLevel}</span></div>
      <h2 className="mt-4 text-lg font-bold text-stone-900">{resource.title}</h2>
      {resource.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">{resource.description}</p>}
      <p className="mt-3 text-xs font-medium text-stone-500">{resource.ufr} · {resource.mention}</p>
      {resource.attachment && <PrivateAttachment attachment={resource.attachment} token={token} />}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3"><span className="truncate text-xs text-stone-400">Partagé par {resource.authorName}</span><div className="flex items-center gap-3">{link && <a className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-900 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800" href={link} rel="noreferrer" target="_blank">Ouvrir <ExternalLink aria-hidden="true" size={14} /></a>}{resource.authorId === userId ? <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50" disabled={busy} onClick={() => void removeResource()} type="button"><Trash2 aria-hidden="true" size={14} />{busy ? 'Suppression…' : 'Supprimer'}</button> : <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-amber-900" onClick={() => setReporting((value) => !value)} type="button"><Flag aria-hidden="true" size={14} />Signaler</button>}</div></div>
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </div>
    {reporting && <ReportDialog contentId={resource.id} contentType="RESOURCE" onClose={() => setReporting(false)} token={token} />}
  </motion.article>
}

function ResourceScreen({ token, userId }: { token: string; userId: string }) {
  const [resources, setResources] = useState<AcademicResource[]>([])
  const [filters, setFilters] = useState<ResourceFilters>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [resourceUrl, setResourceUrl] = useState('')
  const [error, setError] = useState('')
  const requestId = useRef(0)

  async function loadResources(nextFilters: ResourceFilters = filters) {
    const currentRequest = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const result = await getResources(token, nextFilters)
      if (currentRequest === requestId.current) setResources(result)
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(errorMessage(requestError))
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    void loadResources({})
    return () => { requestId.current += 1 }
  }, [token])

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextFilters = {
      q: String(form.get('q') ?? ''),
      ufr: String(form.get('ufr') ?? ''),
      mention: String(form.get('mention') ?? ''),
      studyLevel: String(form.get('studyLevel') ?? ''),
    }
    setFilters(nextFilters)
    await loadResources(nextFilters)
  }

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    const form = new FormData(event.currentTarget)
    const chosenFile = file
    const resource = {
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      type: String(form.get('type') ?? 'OTHER') as ResourceType,
      ufr: String(form.get('ufr') ?? ''),
      mention: String(form.get('mention') ?? ''),
      studyLevel: String(form.get('studyLevel') ?? ''),
      url: resourceUrl,
    }
    if (chosenFile && resource.url.trim()) { setError('Choisissez soit un lien, soit un PDF.'); return }
    if (!chosenFile && !resource.url.trim()) { setError('Ajoutez un lien ou choisissez un PDF.'); return }
    setBusy(true)
    try {
      const uploaded = chosenFile ? await uploadFile(token, chosenFile, 'resource') : null
      await createResource(token, { ...resource, attachmentId: uploaded?.id })
      formElement.reset()
      setFile(null)
      setResourceUrl('')
      setShowForm(false)
      await loadResources(filters)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-enter mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="page-heading mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="page-kicker">Apprendre et partager</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Ressources pédagogiques</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Retrouvez les cours, TD, annales et résumés partagés par la communauté.</p></div>
        <button className="btn btn-primary" disabled={busy} onClick={() => { setShowForm((shown) => !shown); if (showForm) { setFile(null); setResourceUrl('') } }} type="button">{showForm ? 'Fermer' : '+ Partager une ressource'}</button>
      </div>

      {showForm && <form className="form-enter mb-5 grid gap-3 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:grid-cols-2" onSubmit={submitResource}>
        <label className="field-label">Titre<input className="field mt-1.5" maxLength={160} name="title" required /></label>
        <label className="field-label">Type<select className="field mt-1.5" defaultValue="COURSE" name="type">{Object.entries(RESOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-label">UFR<input className="field mt-1.5" maxLength={120} name="ufr" placeholder="Ex. Sciences et Technologies" required /></label>
        <label className="field-label">Mention / filière<input className="field mt-1.5" maxLength={120} name="mention" placeholder="Ex. Informatique" required /></label>
        <label className="field-label">Niveau<input className="field mt-1.5" maxLength={80} name="studyLevel" placeholder="Ex. Licence 2" required /></label>
        <label className="field-label">Lien vers la ressource (facultatif)<input className="field mt-1.5" maxLength={1500} name="url" onChange={(event) => { setResourceUrl(event.target.value); if (event.target.value) setFile(null) }} placeholder="https://…" type="url" value={resourceUrl} /></label>
        <div className="field-label">Ou joindre un PDF<FilePicker accept="application/pdf,.pdf" description="PDF uniquement · 10 Mo maximum" file={file} onChange={(selectedFile) => { setFile(selectedFile); if (selectedFile) setResourceUrl('') }} /></div>
        <label className="field-label sm:col-span-2">Description facultative<textarea className="field mt-1.5 min-h-20" maxLength={2000} name="description" /></label>
        <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Téléversement et partage…' : 'Partager la ressource'}</button></div>
      </form>}

      <form className="mb-5 grid gap-2 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto]" onSubmit={search}>
        <input className="field" defaultValue={filters.q} name="q" placeholder="Rechercher un cours, un sujet…" />
        <input className="field" defaultValue={filters.ufr} name="ufr" placeholder="UFR" />
        <input className="field" defaultValue={filters.mention} name="mention" placeholder="Mention" />
        <input className="field" defaultValue={filters.studyLevel} name="studyLevel" placeholder="Niveau" />
        <button className="rounded-xl border border-emerald-900 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50" type="submit">Filtrer</button>
      </form>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {loading ? <p className="loading-surface rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Chargement des ressources…</p>
        : resources.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="text-lg font-bold">Aucune ressource trouvée</p><p className="mt-2 text-sm text-stone-500">Essayez d’autres filtres ou partagez la première ressource.</p></div>
          : <div className="stagger-list grid gap-4 md:grid-cols-2"><AnimatePresence initial={false}>{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} token={token} userId={userId} onDeleted={(resourceId) => setResources((current) => current.filter((item) => item.id !== resourceId))} />)}</AnimatePresence></div>}
    </main>
  )
}


export default ResourceScreen
