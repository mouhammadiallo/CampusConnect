import { useState, type FormEvent } from 'react'
import { authenticate } from '../api'
import type { Session } from '../types'
import { errorMessage } from '../components/shared'
import { Link } from 'react-router'
import { ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UsersRound } from 'lucide-react'

function AuthScreen({ onAuthenticated, notice }: { onAuthenticated: (session: Session) => void; notice?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const payload = mode === 'login'
      ? { email: form.get('email'), password: form.get('password') }
      : {
          email: form.get('email'),
          fullName: form.get('fullName'),
          password: form.get('password'),
          department: form.get('department'),
          studyLevel: form.get('studyLevel'),
        }

    try {
      const session = await authenticate(mode === 'login' ? '/api/auth/login' : '/api/auth/register', payload)
      onAuthenticated(session)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    if (busy) return
    setMode(nextMode)
    setError('')
    setShowPassword(false)
  }

  const registering = mode === 'register'

  return <main className="auth-layout page-enter mx-auto grid min-h-screen items-center gap-8 px-5 py-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-10 xl:gap-14">
    <section aria-labelledby="auth-story-title" className="auth-art flex flex-col justify-between p-7 sm:p-10 lg:p-12">
      <div className="auth-orbit" aria-hidden="true" />
      <Link aria-label="CampusConnect, accueil" className="relative z-10 inline-flex w-fit items-center gap-3" to="/">
        <span className="grid size-11 place-items-center rounded-2xl border border-campus-light/30 bg-campus-light/10 text-lg font-black text-campus-light">C.</span>
        <span><span className="block text-sm font-bold tracking-wide text-campus-light">CampusConnect</span><span className="block text-[11px] text-campus-light/70">UASZ · Ziguinchor</span></span>
      </Link>

      <div className="auth-story-copy relative z-10 my-10">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-campus-light/25 bg-campus-light/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-campus-soft"><Sparkles aria-hidden="true" size={14} /> La communauté UASZ</p>
        <h1 className="auth-story-title text-5xl font-semibold leading-[.98] tracking-[-.055em] text-campus-light sm:text-6xl xl:text-7xl" id="auth-story-title">Le campus,<br />à votre <span className="font-serif italic text-campus-soft">façon.</span></h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-campus-light/80 sm:text-lg">Les idées circulent. Les rencontres commencent. Tout le campus se retrouve au même endroit.</p>
      </div>

      <div className="relative z-10 grid gap-3 sm:grid-cols-2">
        <div className="auth-feature-note rounded-2xl p-4"><div className="mb-3 grid size-9 place-items-center rounded-xl bg-campus-blue text-campus-light"><BookOpen aria-hidden="true" size={18} /></div><p className="text-sm font-bold text-campus-light">Apprendre ensemble</p><p className="mt-1 text-xs leading-5 text-campus-light/70">Cours, TD et entraide entre filières.</p></div>
        <div className="auth-feature-note rounded-2xl p-4"><div className="mb-3 grid size-9 place-items-center rounded-xl bg-campus-olive text-campus-deep"><UsersRound aria-hidden="true" size={18} /></div><p className="text-sm font-bold text-campus-light">Faire communauté</p><p className="mt-1 text-xs leading-5 text-campus-light/70">Événements, associations et échanges.</p></div>
      </div>
      <p className="relative z-10 mt-7 text-[11px] tracking-wide text-campus-light/55">UNIVERSITÉ ASSANE SECK DE ZIGUINCHOR · DEPUIS LE CAMPUS</p>
    </section>

    <section aria-label={registering ? 'Créer un compte CampusConnect' : 'Se connecter à CampusConnect'} className="auth-form-shell auth-card mx-auto w-full max-w-xl rounded-[1.75rem] border p-6 sm:p-9 lg:p-10">
      {notice && <p className="alert alert-warning mb-5 text-sm" role="status">{notice}</p>}
      <div className="mb-7">
        <p className="page-kicker">{registering ? 'Votre place vous attend' : 'Ravi de vous revoir'}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-campus-deep sm:text-4xl">{registering ? 'Rejoignez le mouvement.' : 'Retrouvons-nous.'}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-campus-deep/75">{registering ? 'Créez votre espace pour partager, apprendre et participer à la vie du campus.' : 'Connectez-vous pour retrouver les nouvelles et les personnes de votre campus.'}</p>
      </div>

      <div aria-label="Accès au compte" className="mb-7 grid grid-cols-2 gap-2 rounded-2xl border border-campus-olive/50 bg-campus-light/60 p-1.5" role="tablist">
        <button aria-controls="auth-panel" aria-selected={!registering} className="auth-tab rounded-xl px-4 py-3 text-sm font-bold text-campus-deep/70 transition" disabled={busy} id="login-tab" onClick={() => switchMode('login')} role="tab" type="button">Connexion</button>
        <button aria-controls="auth-panel" aria-selected={registering} className="auth-tab rounded-xl px-4 py-3 text-sm font-bold text-campus-deep/70 transition" disabled={busy} id="register-tab" onClick={() => switchMode('register')} role="tab" type="button">Inscription</button>
      </div>

      <div aria-labelledby={registering ? 'register-tab' : 'login-tab'} id="auth-panel" role="tabpanel">
        <form autoComplete="on" className="space-y-4" onSubmit={submit}>
          {registering && <>
            <label className="block text-sm font-semibold text-campus-deep" htmlFor="fullName">Nom complet
              <input autoComplete="name" className="field mt-2" id="fullName" maxLength={100} name="fullName" placeholder="Ex. Awa Diop" required />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-campus-deep" htmlFor="department">Département <span className="font-normal text-campus-deep/60">(facultatif)</span>
                <input autoComplete="organization-title" className="field mt-2" id="department" maxLength={120} name="department" placeholder="Ex. Informatique" />
              </label>
              <label className="block text-sm font-semibold text-campus-deep" htmlFor="studyLevel">Niveau <span className="font-normal text-campus-deep/60">(facultatif)</span>
                <input className="field mt-2" id="studyLevel" maxLength={80} name="studyLevel" placeholder="Ex. Licence 2" />
              </label>
            </div>
          </>}

          <label className="block text-sm font-semibold text-campus-deep" htmlFor="email">Adresse courriel
            <span className="auth-input-wrap mt-2 block"><Mail aria-hidden="true" className="auth-input-icon" size={17} /><input autoComplete="email" className="field" id="email" maxLength={254} name="email" placeholder="vous@exemple.sn" required type="email" /></span>
          </label>
          <label className="block text-sm font-semibold text-campus-deep" htmlFor="password">Mot de passe
            <span className="auth-input-wrap mt-2 block"><LockKeyhole aria-hidden="true" className="auth-input-icon" size={17} /><input autoComplete={registering ? 'new-password' : 'current-password'} className="field pr-12" id="password" maxLength={72} minLength={registering ? 12 : undefined} name="password" placeholder={registering ? '12 caractères minimum' : 'Saisissez votre mot de passe'} required type={showPassword ? 'text' : 'password'} /><button aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-campus-blue hover:bg-campus-soft focus-visible:outline" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}</button></span>
          </label>

          {error && <p className="rounded-xl border border-campus-blue/40 bg-campus-light px-4 py-3 text-sm font-medium text-campus-deep" role="alert">{error}</p>}
          <button className="auth-submit button-primary group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60" disabled={busy} type="submit">
            {busy ? 'Connexion en cours…' : registering ? 'Créer mon compte' : 'Se connecter'}
            {!busy && <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" size={17} />}
          </button>
        </form>
      </div>

      <div className="mt-7 flex items-start gap-3 border-t border-campus-olive/45 pt-5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-campus-olive/50 text-campus-deep"><UsersRound aria-hidden="true" size={15} /></span>
        <p className="text-xs leading-5 text-campus-deep/75">Un espace universitaire pour partager des informations utiles et faire vivre la communauté avec respect.</p>
      </div>
    </section>
  </main>
}

export default AuthScreen
