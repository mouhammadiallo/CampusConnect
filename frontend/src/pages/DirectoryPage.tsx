import { useState, type FormEvent } from 'react'
import { getPublicProfile, searchProfiles } from '../api'
import { errorMessage, safeWebUrl } from '../components/shared'
import ProfileAvatar from '../components/ProfileAvatar'
import type { PublicProfile } from '../types'

const LINK_NAMES: Record<string, string> = { website: 'Site personnel', linkedin: 'LinkedIn', github: 'GitHub', instagram: 'Instagram' }

export default function DirectoryPage({ token }: { token: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [selected, setSelected] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim().length < 2) { setError('Saisissez au moins deux caractères.'); return }
    setLoading(true); setError(''); setSelected(null); setSearched(true)
    try { setResults(await searchProfiles(token, query.trim())) }
    catch (requestError) { setError(errorMessage(requestError)) }
    finally { setLoading(false) }
  }

  async function openProfile(id: string) {
    setLoading(true); setError('')
    try { setSelected(await getPublicProfile(token, id)) }
    catch (requestError) { setError(errorMessage(requestError)) }
    finally { setLoading(false) }
  }

  return <main className="page-enter mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
    <div className="page-heading mb-6"><p className="page-kicker">La communauté UASZ</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Annuaire du campus</h1><p className="mt-2 text-sm text-stone-500">Trouvez des membres et découvrez leurs domaines d’étude et compétences.</p></div>
    <form className="card card-border mb-6 bg-base-100 shadow-sm" onSubmit={search}><div className="card-body"><label className="form-control gap-2"><span className="label-text font-semibold">Rechercher un membre par son nom</span><div className="flex flex-col gap-3 sm:flex-row"><input autoComplete="off" className="input input-bordered w-full" maxLength={100} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. Awa Diop" value={query} /><button className="btn btn-primary shrink-0" disabled={loading} type="submit">{loading ? 'Recherche…' : 'Rechercher'}</button></div></label></div></form>
    {error && <div className="alert alert-error mb-5" role="alert">{error}</div>}
    {selected ? <section className="card card-border bg-base-100 shadow-sm"><div className="card-body">
      <button className="btn btn-ghost btn-sm self-start" onClick={() => setSelected(null)} type="button">← Retour aux résultats</button>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center"><ProfileAvatar avatarUrl={selected.avatarUrl} attachment={selected.avatarAttachment} className="size-20 text-xl" name={selected.fullName} token={token} /><div><h2 className="text-2xl font-bold text-stone-900">{selected.fullName}</h2><p className="mt-1 text-sm text-stone-600">{[selected.department, selected.studyLevel].filter(Boolean).join(' · ') || 'Membre de la communauté UASZ'}</p></div></div>
      {selected.bio && <p className="mt-3 whitespace-pre-wrap leading-7 text-stone-700">{selected.bio}</p>}
      {!!selected.skills?.length && <section className="mt-4"><h3 className="font-bold text-stone-900">Compétences</h3><div className="mt-2 flex flex-wrap gap-2">{selected.skills.map((skill) => <span className="badge badge-soft badge-primary" key={skill}>{skill}</span>)}</div></section>}
      {!!selected.socialLinks && <div className="mt-4 flex flex-wrap gap-3">{Object.entries(selected.socialLinks).map(([key, value]) => { const url = safeWebUrl(value); return url ? <a className="link link-primary font-semibold" href={url} key={key} rel="noreferrer" target="_blank">{LINK_NAMES[key] ?? key} ↗</a> : null })}</div>}
    </div></section> : loading ? <div className="card card-border bg-base-100"><div className="card-body text-sm text-stone-500">Chargement…</div></div> : searched && results.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="font-bold text-stone-800">Aucun membre trouvé</p><p className="mt-2 text-sm text-stone-500">Essayez une autre orthographe ou un nom plus court.</p></div> : results.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((person) => <article className="card card-border bg-base-100 shadow-sm" key={person.id}><div className="card-body items-start"><div className="flex items-center gap-3"><ProfileAvatar avatarUrl={person.avatarUrl} attachment={person.avatarAttachment} className="size-12 text-sm" name={person.fullName} token={token} /><div><h2 className="font-bold text-stone-900">{person.fullName}</h2><p className="text-xs text-stone-500">{[person.department, person.studyLevel].filter(Boolean).join(' · ') || 'Membre UASZ'}</p></div></div>{person.bio && <p className="line-clamp-3 text-sm leading-6 text-stone-600">{person.bio}</p>}<button className="btn btn-outline btn-sm mt-auto" onClick={() => void openProfile(person.id)} type="button">Voir la fiche</button></div></article>)}</div> : <div className="card card-border bg-base-100"><div className="card-body text-sm text-stone-600">L’annuaire affiche jusqu’à 30 résultats. Saisissez un nom pour commencer la recherche.</div></div>}
  </main>
}
