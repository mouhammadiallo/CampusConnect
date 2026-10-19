import { useEffect, useState } from 'react'
import { fetchUploadedFile } from '../api'
import type { UploadedFile } from '../types'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

type ProfileAvatarProps = {
  name: string
  token?: string
  avatarUrl?: string | null
  attachment?: UploadedFile | null
  previewFile?: File | null
  className: string
}

export default function ProfileAvatar({ name, token, avatarUrl, attachment, previewFile, className }: ProfileAvatarProps) {
  const [privateUrl, setPrivateUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    setPrivateUrl('')
    if (!attachment || !token) return () => { active = false }
    void fetchUploadedFile(token, attachment.id).then((blob) => {
      objectUrl = URL.createObjectURL(blob)
      if (active) setPrivateUrl(objectUrl)
      else URL.revokeObjectURL(objectUrl)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [attachment?.id, token])

  useEffect(() => {
    setFailed(false)
    if (!previewFile) { setPreviewUrl(''); return }
    const objectUrl = URL.createObjectURL(previewFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [avatarUrl, attachment?.id, previewFile])

  const source = previewUrl || privateUrl || (attachment ? '' : avatarUrl || '')
  return <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 font-bold text-emerald-900 ${className}`}>
    {source && !failed
      ? <img alt={`Photo de ${name}`} className="absolute inset-0 size-full object-cover" onError={() => setFailed(true)} referrerPolicy="no-referrer" src={source} />
      : <span aria-hidden="true">{initials(name)}</span>}
  </div>
}
