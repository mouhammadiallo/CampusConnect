import { useEffect, useState, type FormEvent } from 'react'
import { getMyProfile, updateMyProfile, uploadFile } from '../api'
import { errorMessage } from '../components/shared'
import type { Session, UserProfile } from '../types'
import FilePicker from '../components/FilePicker'
import ProfileAvatar from '../components/ProfileAvatar'

export default function ProfilePage({ session, onUpdated }: { session: Session; onUpdated: (user: UserProfile) => void }) {
  const [profile, setProfile] = useState<UserProfile>(session.user)
  const [fullName, setFullName] = useState(session.user.fullName)
  const [department, setDepartment] = useState(session.user.department ?? '')
  const [studyLevel, setStudyLevel] = useState(session.user.studyLevel ?? '')
  const [bio, setBio] = useState(session.user.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(session.user.avatarUrl ?? '')
  const [skills, setSkills] = useState((session.user.skills ?? []).join(', '))
  const [links, setLinks] = useState<Record<string, string>>({ website: '', linkedin: '', github: '', instagram: '', ...session.user.socialLinks })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    void getMyProfile(session.accessToken).then((user) => {
      if (!active) return
      setProfile(user); setFullName(user.fullName); setDepartment(user.department ?? ''); setStudyLevel(user.studyLevel ?? '')
      setBio(user.bio ?? ''); setAvatarUrl(user.avatarUrl ?? ''); setSkills((user.skills ?? []).join(', '))
      setLinks({ website: '', linkedin: '', github: '', instagram: '', ...user.socialLinks })
      onUpdated(user)
    }).catch((requestError) => { if (active) setError(errorMessage(requestError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.accessToken])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false)
    try {
      const user = await updateMyProfile(session.accessToken, {
        fullName, department, studyLevel, bio,
        avatarUrl: avatarFile || removeAvatar ? '' : avatarUrl.trim(),
        avatarAttachmentId: avatarFile ? (await uploadFile(session.accessToken, avatarFile, 'avatar')).id
          : removeAvatar || avatarUrl.trim() ? null : profile.avatarAttachment?.id ?? null,
        skills: skills.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 10),
        socialLinks: Object.fromEntries(Object.entries(links).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])),
      })
      setProfile(user); setAvatarFile(null); setRemoveAvatar(false); onUpdated(user); setSaved(true)
    } catch (requestError) { setError(errorMessage(requestError)) }
    finally { setBusy(false) }
  }

  const fields = [
    ['website', 'Site personnel'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['instagram', 'Instagram'],
  ] as const

  return <main className="page-enter mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10">
    <div className="page-heading mb-6"><p className="page-kicker">Votre espace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Mon profil</h1><p className="mt-2 text-sm text-stone-500">Présentez votre parcours et vos centres d’intérêt à la communauté.</p></div>
    {loading ? <div className="card card-border bg-base-100"><div className="card-body text-sm text-stone-500">Chargement du profil…</div></div> : <>
      <section className="card card-border mb-5 bg-base-100 shadow-sm"><div className="card-body flex-row items-center gap-4">
        <ProfileAvatar avatarUrl={profile.avatarUrl} attachment={profile.avatarAttachment} className="size-16 text-lg" name={profile.fullName} previewFile={avatarFile} token={session.accessToken} />
        <div><h2 className="card-title">{profile.fullName}</h2><p className="text-sm text-stone-500">{profile.email} · {profile.role === 'STUDENT' ? 'Étudiant·e' : profile.role}</p></div>
      </div></section>
      <form className="card card-border bg-base-100 shadow-sm" onSubmit={submit}><div className="card-body gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control gap-1"><span className="label-text font-semibold">Nom complet</span><input className="input input-bordered w-full" maxLength={100} onChange={(e) => setFullName(e.target.value)} required value={fullName} /></label>
          <label className="form-control gap-1"><span className="label-text font-semibold">Département / filière</span><input className="input input-bordered w-full" maxLength={120} onChange={(e) => setDepartment(e.target.value)} value={department} /></label>
          <label className="form-control gap-1"><span className="label-text font-semibold">Niveau d’études</span><input className="input input-bordered w-full" maxLength={80} onChange={(e) => setStudyLevel(e.target.value)} placeholder="Ex. Licence 2" value={studyLevel} /></label>
          <div className="form-control gap-2"><span className="label-text font-semibold">Photo de profil</span><FilePicker accept="image/jpeg,image/png,.jpg,.jpeg,.png" description="JPG ou PNG · 10 Mo maximum" file={avatarFile} onChange={(file) => { setAvatarFile(file); if (file) { setAvatarUrl(''); setRemoveAvatar(false) } }} />
            <label className="text-xs font-medium text-stone-500">Ou collez un lien d’image<input className="input input-bordered mt-1 w-full" maxLength={500} onChange={(e) => { setAvatarUrl(e.target.value); setAvatarFile(null); setRemoveAvatar(false) }} placeholder="https://…" type="url" value={avatarUrl} /></label>
            {(profile.avatarUrl || profile.avatarAttachment || avatarFile) && <button className="btn btn-ghost btn-xs self-start text-error" onClick={() => { setAvatarFile(null); setAvatarUrl(''); setRemoveAvatar(true) }} type="button">Retirer la photo</button>}
          </div>
        </div>
        <label className="form-control gap-1"><span className="label-text font-semibold">À propos de vous</span><textarea className="textarea textarea-bordered min-h-28 w-full" maxLength={500} onChange={(e) => setBio(e.target.value)} placeholder="Présentez-vous en quelques lignes…" value={bio} /><span className="label-text-alt self-end">{bio.length}/500</span></label>
        <label className="form-control gap-1"><span className="label-text font-semibold">Compétences</span><input className="input input-bordered w-full" maxLength={600} onChange={(e) => setSkills(e.target.value)} placeholder="Séparées par des virgules, 10 maximum" value={skills} /></label>
        <fieldset className="space-y-3"><legend className="mb-2 font-bold">Liens publics</legend><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <label className="form-control gap-1" key={key}><span className="label-text">{label}</span><input className="input input-bordered w-full" maxLength={500} onChange={(e) => setLinks((current) => ({ ...current, [key]: e.target.value }))} placeholder="https://…" type="url" value={links[key] ?? ''} /></label>)}</div></fieldset>
        {error && <div className="alert alert-error" role="alert">{error}</div>}{saved && <div className="alert alert-success" role="status">Profil enregistré.</div>}
        <div className="card-actions justify-end"><button className="btn btn-primary" disabled={busy || loading} type="submit">{busy ? 'Enregistrement…' : 'Enregistrer le profil'}</button></div>
      </div></form>
    </>}
  </main>
}
