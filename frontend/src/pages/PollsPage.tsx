import { useEffect, useState, type FormEvent } from 'react'
import { closePoll, createPoll, getPolls, votePoll } from '../api'
import { errorMessage } from '../components/shared'
import type { CampusPoll } from '../types'

function PollCard({ poll, busy, userId, onVote, onClose }: {
  poll: CampusPoll
  busy: boolean
  userId: string
  onVote: (optionId: string) => void
  onClose: () => void
}) {
  const showResults = poll.closed || poll.myVote !== null
  return <article className="card card-border bg-base-100 shadow-sm"><div className="card-body gap-4">
    <div className="flex items-start justify-between gap-3"><div><h2 className="card-title text-lg">{poll.question}</h2><p className="mt-1 text-xs text-stone-500">Proposé par {poll.authorName}</p></div><span className={`badge ${poll.closed ? 'badge-neutral' : 'badge-soft badge-primary'}`}>{poll.closed ? 'Clôturé' : 'En cours'}</span></div>
    <div className="space-y-2">{poll.options.map((option) => {
      const percent = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0
      return <div key={option.id}>{showResults ? <div aria-label={`${option.text}: ${option.votes} voix, ${percent}%`} className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${poll.myVote === option.id ? 'border-primary bg-primary/5' : 'border-base-300'}`}>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${percent}%` }} />
        <div className="relative flex items-center justify-between gap-3 text-sm"><span className="font-medium">{option.text}{poll.myVote === option.id && <span className="ml-2 text-primary">Votre choix</span>}</span><span className="shrink-0 text-stone-500">{option.votes} · {percent}%</span></div>
      </div> : <button className="btn btn-outline w-full justify-start text-left" disabled={busy || poll.closed} onClick={() => onVote(option.id)} type="button">{option.text}</button>}</div>
    })}</div>
    <div className="flex items-center justify-between border-t border-base-200 pt-3 text-xs text-stone-500"><span>{poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'}</span>{poll.authorId === userId && !poll.closed && <button className="btn btn-ghost btn-xs" disabled={busy} onClick={onClose} type="button">Clôturer le sondage</button>}</div>
  </div></article>
}

export default function PollsPage({ token, userId }: { token: string; userId: string }) {
  const [polls, setPolls] = useState<CampusPoll[]>([])
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function loadPolls() {
    setLoading(true); setError('')
    try { setPolls(await getPolls(token)) }
    catch (requestError) { setError(errorMessage(requestError)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadPolls() }, [token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean)
    setBusyId('create'); setError('')
    try {
      const poll = await createPoll(token, question.trim(), cleanOptions)
      setPolls((current) => [poll, ...current]); setQuestion(''); setOptions(['', '']); setShowForm(false)
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusyId('') }
  }

  async function updatePoll(id: string, action: () => Promise<CampusPoll>) {
    setBusyId(id); setError('')
    try { const updated = await action(); setPolls((current) => current.map((poll) => poll.id === id ? updated : poll)) }
    catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusyId('') }
  }

  function changeOption(index: number, value: string) {
    setOptions((current) => current.map((option, optionIndex) => optionIndex === index ? value : option))
  }

  return <main className="page-enter mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10">
    <div className="page-heading mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="page-kicker">La parole au campus</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Sondages rapides</h1><p className="mt-2 text-sm text-stone-500">Posez une question, recueillez les avis et consultez les résultats.</p></div><button className="btn btn-primary" onClick={() => setShowForm((visible) => !visible)} type="button">{showForm ? 'Fermer' : 'Créer un sondage'}</button></div>
    {showForm && <form className="card card-border mb-5 bg-base-100 shadow-sm" onSubmit={submit}><div className="card-body gap-4"><label className="form-control gap-1"><span className="label-text font-semibold">Question</span><input className="input input-bordered w-full" maxLength={240} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex. Quel thème pour la prochaine rencontre ?" required value={question} /></label><fieldset className="space-y-3"><legend className="label-text mb-2 font-semibold">Choix (2 à 6)</legend>{options.map((option, index) => <div className="flex gap-2" key={index}><input aria-label={`Choix ${index + 1}`} className="input input-bordered w-full" maxLength={100} onChange={(event) => changeOption(index, event.target.value)} placeholder={`Choix ${index + 1}`} required value={option} />{options.length > 2 && <button aria-label={`Supprimer le choix ${index + 1}`} className="btn btn-ghost btn-square" onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">×</button>}</div>)}</fieldset><div className="card-actions items-center justify-between"><button className="btn btn-ghost btn-sm" disabled={options.length >= 6} onClick={() => setOptions((current) => [...current, ''])} type="button">+ Ajouter un choix</button><button className="btn btn-primary" disabled={busyId === 'create'} type="submit">{busyId === 'create' ? 'Création…' : 'Publier le sondage'}</button></div></div></form>}
    {error && <div className="alert alert-error mb-5" role="alert">{error}</div>}
    {loading ? <div className="card card-border bg-base-100"><div className="card-body text-center text-sm text-stone-500">Chargement des sondages…</div></div> : polls.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="text-lg font-bold text-stone-800">Aucun sondage pour le moment</p><p className="mt-2 text-sm text-stone-500">Lancez le premier sondage de la communauté.</p></div> : <div className="space-y-4">{polls.map((poll) => <PollCard busy={busyId === poll.id} key={poll.id} onClose={() => void updatePoll(poll.id, () => closePoll(token, poll.id))} onVote={(optionId) => void updatePoll(poll.id, () => votePoll(token, poll.id, optionId))} poll={poll} userId={userId} />)}</div>}
  </main>
}
