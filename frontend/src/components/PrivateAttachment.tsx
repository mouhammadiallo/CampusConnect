import { useEffect, useState } from 'react'
import { fetchUploadedFile } from '../api'
import type { UploadedFile } from '../types'

export default function PrivateAttachment({ attachment, token }: { attachment: UploadedFile; token: string }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    void fetchUploadedFile(token, attachment.id).then((blob) => {
      objectUrl = URL.createObjectURL(blob)
      if (active) setUrl(objectUrl)
      else URL.revokeObjectURL(objectUrl)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [token, attachment.id])

  if (failed) return <p className="mt-3 text-sm text-error">Fichier indisponible.</p>
  if (!url) return <p className="mt-3 text-sm text-stone-500">Chargement de {attachment.originalName}…</p>
  return attachment.contentType.startsWith('image/')
    ? <img alt="Pièce jointe" className="mt-3 max-h-[32rem] max-w-full rounded-xl object-contain" src={url} />
    : <a className="btn btn-outline btn-sm mt-3" download={attachment.originalName} href={url}>Télécharger {attachment.originalName}</a>
}
