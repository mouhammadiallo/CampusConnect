import { useEffect, useState, type FormEvent } from 'react'
import { answerQuiz, createQuiz, getQuizzes } from '../api'
import { errorMessage } from '../components/shared'
import type { CampusQuiz } from '../types'

function QuizCard({ quiz, busy, onAnswer }: { quiz: CampusQuiz; busy: boolean; onAnswer: (optionId: string) => void }) {
  const answered = quiz.myAnswer !== null
  return <article className="card card-border bg-base-100 shadow-sm"><div className="card-body gap-4">
    <div><h2 className="card-title text-lg">{quiz.question}</h2><p className="mt-1 text-xs text-stone-500">Proposé par {quiz.authorName} · {quiz.attempts} réponse{quiz.attempts === 1 ? '' : 's'}</p></div>
    <div className="space-y-2">{quiz.options.map((option) => {
      const isCorrect = answered && option.id === quiz.correctOptionId
      const isSelected = option.id === quiz.myAnswer
      return answered ? <div className={`rounded-xl border px-3 py-2.5 text-sm ${isCorrect ? 'border-success bg-success/10 text-success' : isSelected ? 'border-error bg-error/10 text-error' : 'border-base-300 text-stone-700'}`} key={option.id}>
        <span className="font-medium">{option.text}</span>{isCorrect && <span className="ml-2 font-bold">Réponse correcte</span>}{isSelected && !isCorrect && <span className="ml-2 font-bold">Votre réponse</span>}
      </div> : <button className="btn btn-outline w-full justify-start text-left" disabled={busy} key={option.id} onClick={() => onAnswer(option.id)} type="button">{option.text}</button>
    })}</div>
    {answered && <div className={`alert ${quiz.myCorrect ? 'alert-success' : 'alert-warning'}`} role="status"><span>{quiz.myCorrect ? 'Bonne réponse !' : 'Pas tout à fait.'}{quiz.explanation && ` ${quiz.explanation}`}</span></div>}
  </div></article>
}

export default function QuizzesPage({ token }: { token: string }) {
  const [quizzes, setQuizzes] = useState<CampusQuiz[]>([])
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [correctOptionId, setCorrectOptionId] = useState('0')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  async function loadQuizzes() {
    setLoading(true); setError('')
    try { setQuizzes(await getQuizzes(token)) }
    catch (requestError) { setError(errorMessage(requestError)) }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadQuizzes() }, [token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean)
    setBusyId('create'); setError('')
    try {
      const quiz = await createQuiz(token, question.trim(), cleanOptions, correctOptionId, explanation.trim())
      setQuizzes((current) => [quiz, ...current]); setQuestion(''); setOptions(['', '']); setCorrectOptionId('0'); setExplanation(''); setShowForm(false)
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusyId('') }
  }

  async function submitAnswer(quizId: string, optionId: string) {
    setBusyId(quizId); setError('')
    try {
      const result = await answerQuiz(token, quizId, optionId)
      setQuizzes((current) => current.map((quiz) => quiz.id === result.id ? result : quiz))
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusyId('') }
  }

  function removeOption(index: number) {
    const next = options.filter((_, itemIndex) => itemIndex !== index)
    const selected = Number(correctOptionId)
    setOptions(next)
    setCorrectOptionId(String(selected === index ? 0 : selected > index ? selected - 1 : selected))
  }

  return <main className="page-enter mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10">
    <div className="page-heading mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="page-kicker">Apprendre en s’entraidant</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Quiz du campus</h1><p className="mt-2 text-sm text-stone-500">Répondez à une question, découvrez la correction et partagez vos connaissances.</p></div><button className="btn btn-primary" onClick={() => setShowForm((visible) => !visible)} type="button">{showForm ? 'Fermer' : 'Créer un quiz'}</button></div>
    {showForm && <form className="card card-border mb-5 bg-base-100 shadow-sm" onSubmit={submit}><div className="card-body gap-4"><label className="form-control gap-1"><span className="label-text font-semibold">Question</span><input className="input input-bordered w-full" maxLength={240} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex. Quel est le langage de la plateforme ?" required value={question} /></label><fieldset className="space-y-3"><legend className="label-text mb-2 font-semibold">Choix (sélectionnez la bonne réponse)</legend>{options.map((option, index) => <div className="flex items-center gap-2" key={index}><input aria-label={`Marquer le choix ${index + 1} comme correct`} checked={correctOptionId === String(index)} className="radio radio-primary" name="correctOption" onChange={() => setCorrectOptionId(String(index))} type="radio" /><input aria-label={`Choix ${index + 1}`} className="input input-bordered w-full" maxLength={100} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Choix ${index + 1}`} required value={option} />{options.length > 2 && <button aria-label={`Supprimer le choix ${index + 1}`} className="btn btn-ghost btn-square" onClick={() => removeOption(index)} type="button">×</button>}</div>)}</fieldset><button className="btn btn-ghost btn-sm self-start" disabled={options.length >= 6} onClick={() => setOptions((current) => [...current, ''])} type="button">+ Ajouter un choix</button><label className="form-control gap-1"><span className="label-text font-semibold">Explication après réponse (facultative)</span><textarea className="textarea textarea-bordered min-h-20" maxLength={500} onChange={(event) => setExplanation(event.target.value)} value={explanation} /></label><div className="card-actions justify-end"><button className="btn btn-primary" disabled={busyId === 'create'} type="submit">{busyId === 'create' ? 'Création…' : 'Publier le quiz'}</button></div></div></form>}
    {error && <div className="alert alert-error mb-5" role="alert">{error}</div>}
    {loading ? <div className="card card-border bg-base-100"><div className="card-body text-center text-sm text-stone-500">Chargement des quiz…</div></div> : quizzes.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><p className="text-lg font-bold text-stone-800">Aucun quiz pour le moment</p><p className="mt-2 text-sm text-stone-500">Créez la première question de la communauté.</p></div> : <div className="space-y-4">{quizzes.map((quiz) => <QuizCard busy={busyId === quiz.id} key={quiz.id} onAnswer={(optionId) => void submitAnswer(quiz.id, optionId)} quiz={quiz} />)}</div>}
  </main>
}
