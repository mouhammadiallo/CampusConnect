import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { createPost, getPosts, uploadFile } from '../api'
import type { Post, Session } from '../types'
import { Header, errorMessage, initials } from '../components/shared'
import { PostCard } from '../components/PostCard'
const MessagingScreen = lazy(() => import('../MessagingScreen').then((module) => ({ default: module.MessagingScreen })))
const ResourceScreen = lazy(() => import('./ResourcesPage'))
const EventsScreen = lazy(() => import('./EventsPage'))
const ModerationScreen = lazy(() => import('./ModerationPage'))
const ClassifiedsScreen = lazy(() => import('../ClassifiedsScreen').then((module) => ({ default: module.ClassifiedsScreen })))
const ProfilePage = lazy(() => import('./ProfilePage'))
import type { UserProfile } from '../types'
const DirectoryPage = lazy(() => import('./DirectoryPage'))
import { Link, useLocation } from 'react-router'
const PollsPage = lazy(() => import('./PollsPage'))
const QuizzesPage = lazy(() => import('./QuizzesPage'))
import { AnimatePresence, motion } from 'motion/react'
import FilePicker from '../components/FilePicker'
import { ArrowRight, BookOpen, CalendarDays, ContactRound, FilePlus2, Home, LibraryBig, MessageCircle, ShieldCheck, Sparkles, SquareKanban, UserRound, Vote, type LucideIcon } from 'lucide-react'

const SECTION_PATHS = {
  feed: '/', resources: '/resources', events: '/events', polls: '/polls', quizzes: '/quizzes', classifieds: '/classifieds',
  messaging: '/messages', profile: '/profile', directory: '/directory', moderation: '/moderation',
} as const
type Section = keyof typeof SECTION_PATHS
const SECTION_ICONS: Record<Section, LucideIcon> = {
  feed: Home, resources: LibraryBig, events: CalendarDays, polls: Vote, quizzes: BookOpen, classifieds: SquareKanban,
  messaging: MessageCircle, profile: UserRound, directory: ContactRound, moderation: ShieldCheck,
}

function FeedScreen({ session, onSignOut, onUserUpdated }: { session: Session; onSignOut: () => void; onUserUpdated: (user: UserProfile) => void }) {
  const location = useLocation()
  const pathname = location.pathname.replace(/\/$/, '') || '/'
  const section = (Object.entries(SECTION_PATHS).find(([, path]) => path === pathname)?.[0] ?? null) as Section | null
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setPosts(await getPosts(session.accessToken))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [session.accessToken])

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!content.trim()) return
    if (mediaUrl.trim() && attachmentFile) { setError('Choisissez soit un lien, soit un fichier joint.'); return }
    if (attachmentFile && attachmentFile.size > 10 * 1024 * 1024) { setError('Le fichier doit faire 10 Mo maximum.'); return }
    setBusy(true)
    setError('')
    try {
      const uploaded = attachmentFile ? await uploadFile(session.accessToken, attachmentFile) : null
      const post = await createPost(session.accessToken, content.trim(), mediaUrl.trim(), uploaded?.id)
      setPosts((current) => [post, ...current])
      setContent('')
      setMediaUrl('')
      setAttachmentFile(null)
      form.reset()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  function updatePost(updated: Post) {
    setPosts((current) => current.map((post) => post.id === updated.id ? updated : post))
  }

  const tabs: [Section, string][] = [
    ['feed', 'Fil du campus'],
    ['messaging', 'Messages'],
    ['resources', 'Ressources'],
    ['events', 'Événements'],
    ['classifieds', 'Petites annonces'],
    ['polls', 'Sondages'],
    ['quizzes', 'Quiz'],
    ['profile', 'Mon profil'],
    ['directory', 'Annuaire'],
  ]
  tabs.push(['moderation', 'Modération'])

  return (
    <>
      <Header user={session.user} token={session.accessToken} onSignOut={onSignOut} />
      <nav className="app-nav border-b border-stone-200 bg-white" aria-label="Sections du campus">
        <div className="app-nav-inner mx-auto flex max-w-7xl flex-nowrap gap-1 overflow-x-auto px-5 sm:px-8 md:flex-wrap md:overflow-visible">
          {tabs.map(([value, label]) => {
            const Icon = SECTION_ICONS[value]
            return <Link aria-current={section === value ? 'page' : undefined} className={`app-nav-tab relative whitespace-nowrap text-sm font-semibold transition ${section === value ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`} key={value} to={SECTION_PATHS[value]}><Icon aria-hidden="true" size={17} strokeWidth={1.9} /><span>{label}</span></Link>
          })}
        </div>
      </nav>
      <AnimatePresence mode="wait" initial={false}><motion.div animate={{ opacity: 1, y: 0 }} className="min-h-[50vh]" exit={{ opacity: 0, y: -5 }} initial={{ opacity: 0, y: 8 }} key={pathname}>
      <Suspense fallback={<main aria-live="polite" className="page-enter mx-auto max-w-5xl px-5 text-center text-sm font-semibold text-campus-deep/70" role="status">Ouverture de la page…</main>}>
      {section === 'classifieds' ? <ClassifiedsScreen session={session} /> : section === 'messaging' ? <MessagingScreen fullName={session.user.fullName} token={session.accessToken} userId={session.user.id} /> : section === 'profile' ? <ProfilePage onUpdated={onUserUpdated} session={session} /> : section === 'directory' ? <DirectoryPage token={session.accessToken} /> : section === 'polls' ? <PollsPage token={session.accessToken} userId={session.user.id} /> : section === 'quizzes' ? <QuizzesPage token={session.accessToken} /> : section === null ? <main className="page-enter mx-auto max-w-3xl px-5 py-16 text-center"><p className="page-kicker justify-center">CampusConnect UASZ</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-campus-deep">Cette page n’existe pas</h1><p className="mt-3 text-campus-deep/70">Vérifiez l’adresse ou revenez au fil du campus.</p><Link className="btn btn-primary mt-6" to="/">Retour à l’accueil</Link></main> : section === 'feed' ? <main className="page-enter mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8 lg:py-8">
        <section className="feed-banner col-span-full rounded-[1.75rem] p-6 sm:p-9 lg:p-10">
          <div className="relative z-10 flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-campus-soft/40 bg-campus-light/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-campus-soft"><Sparkles aria-hidden="true" size={14} /> Le campus en mouvement</p>
              <h1 className="max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-.05em] text-campus-light sm:text-5xl lg:text-6xl">Les idées font <span className="font-serif italic text-campus-soft">campus.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-campus-light/80 sm:text-base">Bienvenue, {session.user.fullName.split(' ')[0]}. Partagez une nouvelle, une question ou une initiative avec la communauté UASZ.</p>
            </div>
            <button className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-campus-light px-5 py-3 text-sm font-bold text-campus-deep shadow-lg transition hover:-translate-y-0.5 hover:bg-campus-soft" onClick={() => document.getElementById('composer-content')?.focus()} type="button">Écrire une publication <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" size={16} /></button>
          </div>
          <div className="relative z-10 mt-8 flex flex-wrap gap-2 border-t border-campus-light/20 pt-5 text-xs font-semibold text-campus-light/80"><span className="rounded-full bg-campus-blue px-3 py-1.5">Infos du campus</span><span className="rounded-full border border-campus-light/25 px-3 py-1.5">Entraide étudiante</span><span className="rounded-full border border-campus-light/25 px-3 py-1.5">Vie associative</span></div>
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="page-kicker">Le fil commun</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-campus-deep">À la une du campus</h2></div>{!loading && !error && <span className="rounded-full bg-campus-olive/45 px-3 py-1.5 text-xs font-bold text-campus-deep">{posts.length} publication{posts.length === 1 ? '' : 's'}</span>}</div>
          <form className="feed-composer interactive-card mb-6 rounded-2xl border border-campus-olive/55 bg-campus-soft p-4 shadow-sm sm:p-5" onSubmit={submitPost}>
            <div className="flex gap-3">
              <div aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-campus-olive bg-campus-light font-bold text-campus-deep">{initials(session.user.fullName)}</div>
              <div className="min-w-0 flex-1"><label className="mb-2 block text-sm font-bold text-campus-deep" htmlFor="composer-content">Votre tour de partager</label><textarea aria-label="Votre publication" className="min-h-28 w-full resize-y rounded-xl border border-campus-olive/60 bg-campus-light px-4 py-3 text-sm leading-6 text-campus-deep outline-none placeholder:text-campus-deep/55 focus:border-campus-blue focus:ring-2 focus:ring-campus-blue/20" id="composer-content" maxLength={3000} onChange={(event) => setContent(event.target.value)} placeholder="Une idée, une question, une bonne nouvelle…" value={content} /><p className="mt-1 text-right text-[11px] text-campus-deep/60">{content.length}/3000</p></div>
            </div>
            <div className="mt-3 grid gap-3 border-t border-campus-olive/45 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2"><label className="block text-xs font-bold uppercase tracking-wide text-campus-deep/70" htmlFor="composer-link">Ajouter un lien ou un fichier</label><input aria-label="Lien facultatif" className="field" id="composer-link" maxLength={1000} onChange={(event) => { setMediaUrl(event.target.value); if (event.target.value) setAttachmentFile(null) }} placeholder="https://… (facultatif)" type="url" value={mediaUrl} /><FilePicker accept="image/jpeg,image/png,application/pdf" description="Image ou PDF · 10 Mo maximum" file={attachmentFile} onChange={(file) => { setAttachmentFile(file); if (file) setMediaUrl('') }} /></div>
              <button className="button-primary flex min-h-12 shrink-0 items-center justify-center gap-2 self-end rounded-xl px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !content.trim()} type="submit">{busy ? 'Publication…' : <><FilePlus2 aria-hidden="true" size={17} /> Publier</>}</button>
            </div>
          </form>

          {error && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-campus-blue/40 bg-campus-light px-4 py-3 text-sm text-campus-deep" role="alert"><span>{error}</span><button className="btn btn-sm btn-outline" onClick={() => void refresh()} type="button">Réessayer</button></div>}
          {loading ? <div aria-live="polite" className="loading-surface rounded-2xl border border-campus-olive/60 p-10 text-center text-sm font-medium text-campus-deep/70">Chargement du fil…</div>
            : !error && posts.length === 0 ? <div className="rounded-2xl border border-dashed border-campus-olive bg-campus-light px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-campus-soft text-campus-deep"><Sparkles aria-hidden="true" size={22} /></span><p className="mt-4 text-xl font-bold text-campus-deep">Le fil est à vous.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-campus-deep/70">Aucune publication pour le moment. Lancez la conversation et donnez le ton à la communauté.</p><button className="btn btn-primary mt-5" onClick={() => document.getElementById('composer-content')?.focus()} type="button">Écrire la première publication</button></div>
              : !error && <div className="stagger-list space-y-4"><AnimatePresence initial={false}>{posts.map((post) => <PostCard key={post.id} onChanged={updatePost} onDeleted={(postId) => setPosts((current) => current.filter((item) => item.id !== postId))} post={post} token={session.accessToken} userId={session.user.id} />)}</AnimatePresence></div>}
          {!loading && !error && posts.length >= 20 && <button className="btn btn-outline mt-5 w-full" onClick={() => void refresh()} type="button">Actualiser le fil</button>}
        </section>

        <aside className="space-y-4 lg:pt-1">
          <section className="rounded-2xl border border-campus-olive/55 bg-campus-soft p-5">
            <p className="page-kicker">À portée de main</p><h2 className="mt-2 text-lg font-bold text-campus-deep">Explorer le campus</h2>
            <div className="mt-4 space-y-2">
              <Link className="feed-shortcut flex items-center gap-3 rounded-xl border border-campus-olive/45 bg-campus-light/70 p-3" to="/messages"><span className="grid size-9 place-items-center rounded-xl bg-campus-blue text-campus-light"><MessageCircle aria-hidden="true" size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-campus-deep">Messages</span><span className="block text-xs text-campus-deep/65">Échanger en direct</span></span><ArrowRight aria-hidden="true" className="text-campus-blue" size={16} /></Link>
              <Link className="feed-shortcut flex items-center gap-3 rounded-xl border border-campus-olive/45 bg-campus-light/70 p-3" to="/resources"><span className="grid size-9 place-items-center rounded-xl bg-campus-olive text-campus-deep"><LibraryBig aria-hidden="true" size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-campus-deep">Ressources</span><span className="block text-xs text-campus-deep/65">Cours, TD et annales</span></span><ArrowRight aria-hidden="true" className="text-campus-blue" size={16} /></Link>
              <Link className="feed-shortcut flex items-center gap-3 rounded-xl border border-campus-olive/45 bg-campus-light/70 p-3" to="/events"><span className="grid size-9 place-items-center rounded-xl bg-campus-deep text-campus-light"><CalendarDays aria-hidden="true" size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-campus-deep">Événements</span><span className="block text-xs text-campus-deep/65">Ne rien manquer</span></span><ArrowRight aria-hidden="true" className="text-campus-blue" size={16} /></Link>
            </div>
          </section>
          <section className="relative overflow-hidden rounded-2xl bg-campus-deep p-5 text-campus-light"><div aria-hidden="true" className="absolute -right-7 -top-8 size-24 rounded-full border border-campus-light/25" /><p className="relative text-xs font-bold uppercase tracking-[.14em] text-campus-soft">Notre esprit</p><h2 className="relative mt-2 text-lg font-bold">Un espace commun</h2><p className="relative mt-2 text-sm leading-6 text-campus-light/75">Des échanges bienveillants, des informations utiles et une communauté qui avance ensemble.</p></section>
        </aside>
      </main> : section === 'moderation' && session.user.role === 'STUDENT' ? <main className="page-enter mx-auto max-w-4xl px-5 sm:px-8">
        <section className="surface-panel overflow-hidden rounded-3xl border bg-campus-soft shadow-sm">
          <div className="grid gap-6 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:p-9">
            <span aria-hidden="true" className="grid size-14 place-items-center rounded-2xl bg-campus-deep text-campus-light shadow-lg"><ShieldCheck size={27} /></span>
            <div>
              <p className="page-kicker">Espace de confiance</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-campus-deep">Modération du campus</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-campus-deep/80">Cet espace permet à l’équipe de modération d’examiner les signalements et d’agir selon la charte de la communauté.</p>
              <div className="mt-6 rounded-2xl border border-campus-olive bg-campus-light p-4 sm:p-5">
                <p className="font-bold text-campus-deep">Votre compte n’a pas encore l’accès modérateur.</p>
                <p className="mt-2 text-sm leading-6 text-campus-deep/80">La file des signalements est réservée aux modérateurs et administrateurs. Demandez à un responsable CampusConnect de vous attribuer ce rôle, puis reconnectez-vous pour consulter et traiter les signalements.</p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-campus-olive bg-campus-soft px-3 py-1.5 text-xs font-bold text-campus-deep"><ShieldCheck aria-hidden="true" size={14} /> Rôle actuel : Étudiant</span>
              </div>
              <Link className="btn btn-primary mt-6" to="/">Revenir au fil du campus</Link>
            </div>
          </div>
        </section>
      </main> : section === 'resources' ? <ResourceScreen token={session.accessToken} userId={session.user.id} /> : section === 'events' ? <EventsScreen token={session.accessToken} userId={session.user.id} /> : <ModerationScreen token={session.accessToken} />}
      </Suspense>
      </motion.div></AnimatePresence>
    </>
  )
}


export default FeedScreen
