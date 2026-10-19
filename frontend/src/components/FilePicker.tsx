import { useEffect, useId, useState } from 'react'
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react'

type FilePickerProps = {
  accept: string
  description: string
  file: File | null
  maxBytes?: number
  onChange: (file: File | null) => void
}

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf',
}

function matchesAccept(file: File, accept: string) {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  const mimeType = file.type || MIME_BY_EXTENSION[extension] || ''
  return accept.split(',').map((part) => part.trim().toLowerCase()).some((allowed) => {
    if (allowed.startsWith('.')) return extension === allowed
    if (allowed.endsWith('/*')) return mimeType.startsWith(allowed.slice(0, -1))
    return mimeType === allowed
  })
}

function formatFileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} Ko` : `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

export default function FilePicker({ accept, description, file, maxBytes = 10 * 1024 * 1024, onChange }: FilePickerProps) {
  const inputId = useId()
  const helpId = useId()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!file?.type.startsWith('image/')) { setPreviewUrl(''); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function selectFile(nextFile?: File) {
    setError('')
    if (!nextFile) return
    if (!matchesAccept(nextFile, accept)) {
      setError('Ce format de fichier n’est pas accepté.')
      return
    }
    if (nextFile.size > maxBytes) {
      setError(`Le fichier dépasse la taille maximale de ${Math.round(maxBytes / (1024 * 1024))} Mo.`)
      return
    }
    onChange(nextFile)
  }

  return <div
    className={`min-w-0 rounded-2xl border border-dashed p-3 transition focus-within:ring-2 focus-within:ring-primary/35 focus-within:ring-offset-2 ${dragging ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/45'} ${file ? 'border-solid bg-base-100' : ''}`}
    onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
    onDragOver={(event) => event.preventDefault()}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
    onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]) }}
  >
    <input aria-describedby={helpId} accept={accept} className="sr-only" id={inputId} onChange={(event) => { selectFile(event.target.files?.[0]); event.currentTarget.value = '' }} type="file" />
    {file ? <div className="flex min-w-0 items-center gap-3">
      {previewUrl
        ? <img alt="Aperçu du fichier sélectionné" className="size-12 shrink-0 rounded-xl object-cover" src={previewUrl} />
        : <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{file.type.startsWith('image/') ? <ImageIcon aria-hidden="true" size={21} /> : <FileText aria-hidden="true" size={21} />}</span>}
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-base-content">{file.name}</p><p className="text-xs text-base-content/60">{formatFileSize(file.size)} · prêt à être ajouté</p></div>
      <button aria-label={`Retirer ${file.name}`} className="btn btn-ghost btn-sm btn-square shrink-0" onClick={() => { onChange(null); setError('') }} type="button"><X aria-hidden="true" size={17} /></button>
    </div> : <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UploadCloud aria-hidden="true" size={19} /></span><div><p className="text-sm font-semibold text-base-content">Glissez un fichier ici</p><p className="text-xs text-base-content/60" id={helpId}>{description}</p></div></div>
      <label className="btn btn-outline btn-sm cursor-pointer" htmlFor={inputId}>Parcourir</label>
    </div>}
    {file && <p className="sr-only" id={helpId}>{description}</p>}
    {error && <p className="mt-2 text-xs font-medium text-error" role="alert">{error}</p>}
  </div>
}
