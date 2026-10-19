import { useState, type FormEvent } from 'react'
import { createComment, deletePost, getComments, likePost, unlikePost } from '../api'
import type { Comment, Post } from '../types'
import { errorMessage, initials, ReportDialog, safeWebUrl } from './shared'
import PrivateAttachment from './PrivateAttachment'
import { motion } from 'motion/react'
import { Flag, Heart, MessageCircle, Trash2 } from 'lucide-react'

function CommentItem({ comment, token, userId }: { comment: Comment; token: string; userId: string }) {
  const [reporting, setReporting] = useState(false)
  return <div className="rounded-xl">
    <div className="flex gap-2.5">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-200 text-xs font-bold text-stone-700">{initials(comment.authorName)}</div>
      <div className="min-w-0 flex-1 rounded-2xl bg-white px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-stone-800">{comment.authorName}</p>{comment.authorId !== userId && <button className="text-[11px] font-semibold text-stone-400 hover:text-amber-900" onClick={() => setReporting((value) => !value)} type="button">Signaler</button>}</div>
        <p className="whitespace-pre-wrap break-words pt-1 text-sm text-stone-700">{comment.content}</p>
      </div>
    </div>
    {reporting && <div className="ml-10 mt-2 overflow-hidden rounded-xl border border-amber-200"><ReportDialog contentId={comment.id} contentType="COMMENT" onClose={() => setReporting(false)} token={token} /></div>}
  </div>
}

function PostCard({ post, token, userId, onChanged, onDeleted }: { post: Post; token: string; userId: string; onChanged: (post: Post) => void; onDeleted: (postId: string) => void }) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)

  async function removePost() {
    if (!window.confirm('Supprimer définitivement cette publication et ses commentaires ?')) return
    setBusy(true)
    setError('')
    try {
      await deletePost(token, post.id)
      onDeleted(post.id)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function toggleComments() {
    setError('')
    if (comments !== null) {
      setComments(null)
      return
    }
    setCommentsLoading(true)
    try {
      setComments(await getComments(token, post.id))
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setCommentsLoading(false)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!commentText.trim()) return
    setBusy(true)
    setError('')
    try {
      const created = await createComment(token, post.id, commentText.trim())
      setComments((current) => current ? [...current, created] : [created])
      setCommentText('')
      onChanged({ ...post, commentsCount: post.commentsCount + 1 })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function toggleLike() {
    setBusy(true)
    setError('')
    try {
      const updated = post.likedByCurrentUser ? await unlikePost(token, post.id) : await likePost(token, post.id)
      onChanged(updated)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const mediaLink = post.mediaUrl ? safeWebUrl(post.mediaUrl) : null
  const postDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(post.createdAt))

  return (
    <motion.article animate={{ opacity: 1, y: 0 }} className="interactive-card overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" exit={{ opacity: 0, scale: .98 }} initial={{ opacity: 0, y: 10 }} layout>
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-900">{initials(post.authorName)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-stone-900">{post.authorName}</p>
          <time className="text-xs text-stone-500" dateTime={post.createdAt}>{postDate}</time>
        </div>
      </div>
      <div className="px-5 pb-4 pt-4">
        <p className="whitespace-pre-wrap break-words leading-7 text-stone-700">{post.content}</p>
        {mediaLink && <a className="mt-3 inline-flex max-w-full items-center gap-2 break-all rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100" href={mediaLink} rel="noreferrer" target="_blank">↗ Ouvrir le lien partagé</a>}
        {post.attachment && <PrivateAttachment attachment={post.attachment} token={token} />}
      </div>
      <div className="mx-5 flex items-center justify-between border-y border-stone-100 py-2 text-xs text-stone-500">
        <span>{post.likesCount} J’aime</span><span>{post.commentsCount} commentaire{post.commentsCount === 1 ? '' : 's'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 py-2">
        <button aria-pressed={post.likedByCurrentUser} className={`post-like inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-stone-100 ${post.likedByCurrentUser ? 'text-emerald-800' : 'text-stone-600'}`} disabled={busy} onClick={() => void toggleLike()} type="button"><Heart aria-hidden="true" fill={post.likedByCurrentUser ? 'currentColor' : 'none'} size={16} />J’aime</button>
        <button aria-expanded={comments !== null} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50" disabled={commentsLoading} onClick={() => void toggleComments()} type="button"><MessageCircle aria-hidden="true" size={16} />{commentsLoading ? 'Chargement…' : comments === null ? 'Commenter' : 'Masquer'}</button>
        {post.authorId === userId
          ? <button className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50" disabled={busy} onClick={() => void removePost()} type="button"><Trash2 aria-hidden="true" size={16} />Supprimer</button>
          : <button className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-semibold text-stone-500 transition hover:bg-amber-50 hover:text-amber-900" onClick={() => setReporting((value) => !value)} type="button"><Flag aria-hidden="true" size={16} />Signaler</button>}
      </div>
      {reporting && <ReportDialog contentId={post.id} contentType="POST" onClose={() => setReporting(false)} token={token} />}
      {comments !== null && (
        <section className="space-y-3 border-t border-stone-100 bg-stone-50/70 px-5 py-4" aria-label="Commentaires">
          {comments.length === 0 ? <p className="text-sm text-stone-500">Pas encore de commentaire. Lancez la conversation.</p> : comments.map((comment) => <CommentItem comment={comment} key={comment.id} token={token} userId={userId} />)}
          <form className="flex gap-2 pt-1" onSubmit={submitComment}>
            <input aria-label="Votre commentaire" className="field" maxLength={1000} onChange={(event) => setCommentText(event.target.value)} placeholder="Écrire un commentaire…" value={commentText} />
            <button className="shrink-0 rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white disabled:opacity-50" disabled={busy || !commentText.trim()} type="submit">Envoyer</button>
          </form>
        </section>
      )}
      {error && <p className="px-5 pb-4 text-sm text-red-700" role="alert">{error}</p>}
    </motion.article>
  )
}


export { PostCard }
