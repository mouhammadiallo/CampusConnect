import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ApiError, chatWebSocketUrl, createConversation, getContacts, getConversations, getMessages } from './api'
import type { ChatMessage, Conversation, Contact } from './types'
import { Mail } from 'lucide-react'

export function MessagingScreen({ token, userId, fullName }: { token: string; userId: string; fullName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactDirectory, setContactDirectory] = useState<Contact[]>([])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [content, setContent] = useState('')
  const [groupTitle, setGroupTitle] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const socket = useRef<WebSocket | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  async function refreshConversations() {
    try { setConversations(await getConversations(token)) } catch (requestError) {
      setError(requestError instanceof ApiError ? `Chargement des conversations : ${requestError.message}` : 'Impossible de charger les conversations. Vérifiez que l’API est démarrée.')
    }
  }

  useEffect(() => { void refreshConversations() }, [token])
  useEffect(() => {
    let cancelled = false
    if (query.trim().length < 2) { setContacts([]); return }
    const timer = window.setTimeout(() => {
      void getContacts(token, query.trim()).then((items) => {
        if (!cancelled) {
          setContacts(items)
          setContactDirectory((current) => [...new Map([...current, ...items].map((contact) => [contact.id, contact])).values()])
        }
      }).catch(() => { if (!cancelled) setContacts([]) })
    }, 250)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [query, token])

  useEffect(() => {
    if (!active) { setMessages([]); return }
    let alive = true
    const ws = new WebSocket(chatWebSocketUrl())
    socket.current = ws
    ws.onopen = () => ws.send(JSON.stringify({ type: 'AUTH', token }))
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type: string; message?: ChatMessage | string }
      const incoming = typeof data.message === 'object' ? data.message : undefined
      if (data.type === 'AUTHENTICATED') ws.send(JSON.stringify({ type: 'SUBSCRIBE', conversationId: active.id }))
      if (data.type === 'MESSAGE' && incoming && alive) setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming])
      if (data.type === 'ERROR' && alive) setError(typeof data.message === 'string' ? data.message : 'La connexion à la messagerie a rencontré un problème.')
      if (data.type === 'SUBSCRIBED' && alive) setConnected(true)
    }
    ws.onclose = () => { if (alive) setConnected(false) }
    ws.onerror = () => { if (alive) setError('Connexion temps réel indisponible. Vérifiez que l’API est démarrée.') }
    void getMessages(token, active.id).then((items) => {
      if (alive) setMessages((current) => [...new Map([...items, ...current].map((message) => [message.id, message])).values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
    }).catch(() => { if (alive) setError('Impossible de charger les messages.') })
    return () => { alive = false; setConnected(false); socket.current = null; ws.close() }
  }, [active?.id, token])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const activeLabel = useMemo(() => {
    if (!active) return ''
    if (active.group) return active.title
    const otherId = active.participantIds.find((id) => id !== userId)
    return contactDirectory.find((contact) => contact.id === otherId)?.fullName ?? 'Conversation directe'
  }, [active, contactDirectory, userId])

  async function startConversation(participantIds: string[], title?: string) {
    try {
      const created = await createConversation(token, participantIds, title)
      await refreshConversations()
      setActive(created); setQuery(''); setSelected([]); setGroupTitle(''); setError('')
    } catch { setError('Impossible de créer la conversation. Vérifiez les participants et le nom du groupe.') }
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = content.trim()
    if (!active || !text || socket.current?.readyState !== WebSocket.OPEN || !connected) return
    socket.current.send(JSON.stringify({ type: 'SEND', conversationId: active.id, content: text }))
    setContent('')
  }

  return <main className="page-enter mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <div className="page-heading mb-5"><p className="page-kicker">Échanges du campus</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Messagerie</h1></div>
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
    <section className="surface-panel grid min-h-[620px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="border-b border-stone-200 md:border-b-0 md:border-r">
        <div className="border-b border-stone-100 p-4"><h2 className="font-bold text-stone-900">Nouvelle conversation</h2><input className="field mt-3" aria-label="Rechercher un étudiant" placeholder="Nom ou courriel (2 caractères min.)" value={query} onChange={(event) => setQuery(event.target.value)} />
          {contacts.length > 0 && <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-stone-100">{contacts.map((contact) => <div key={contact.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50"><input aria-label={`Ajouter ${contact.fullName} au groupe`} checked={selected.includes(contact.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, contact.id] : current.filter((id) => id !== contact.id))} type="checkbox" /><button type="button" className="min-w-0 flex-1 text-left" onClick={() => void startConversation([contact.id])}><span className="block truncate font-semibold">{contact.fullName}</span><span className="block truncate text-xs text-stone-500">{contact.email}</span></button></div>)}</div>}
          {selected.length > 0 && <div className="mt-3 space-y-2"><input className="field" placeholder="Nom du groupe" value={groupTitle} onChange={(event) => setGroupTitle(event.target.value)} /><button type="button" className="w-full rounded-xl bg-emerald-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!groupTitle.trim()} onClick={() => void startConversation(selected, groupTitle)}>Créer le groupe ({selected.length + 1})</button></div>}
        </div>
        <div className="stagger-list p-2">{conversations.map((conversation) => <button key={conversation.id} className={`conversation-item mb-1 w-full rounded-xl px-3 py-3 text-left text-sm ${active?.id === conversation.id ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-stone-50'}`} onClick={() => setActive(conversation)} type="button"><span className="block font-bold">{conversation.group ? conversation.title : (contactDirectory.find((item) => conversation.participantIds.includes(item.id) && item.id !== userId)?.fullName ?? 'Conversation directe')}</span><span className="text-xs text-stone-500">{conversation.group ? `${conversation.participantIds.length} participants` : 'Message direct'}</span></button>)}
          {conversations.length === 0 && <p className="px-3 py-5 text-sm text-stone-500">Vos conversations apparaîtront ici.</p>}</div>
      </aside>
      <div className="flex min-h-[560px] flex-col">
        {active ? <>
          <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4"><div><h2 className="font-bold text-stone-900">{activeLabel}</h2><p className="text-xs text-stone-500">{active.group ? `${active.participantIds.length} participants` : 'Conversation directe'}</p></div><span className={`text-xs font-semibold ${connected ? 'text-emerald-700' : 'text-stone-400'}`}>{connected ? 'En ligne' : 'Connexion…'}</span></header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50/70 p-4">{messages.length === 0 ? <p className="pt-12 text-center text-sm text-stone-500">Démarrez la conversation avec un premier message.</p> : messages.map((message) => <div key={message.id} className={`message-bubble max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.senderId === userId ? 'ml-auto bg-emerald-900 text-white' : 'bg-white text-stone-800 shadow-sm'}`}><p className="mb-1 text-xs font-bold opacity-75">{message.senderId === userId ? fullName : message.senderName}</p><p className="whitespace-pre-wrap break-words">{message.content}</p><time className="mt-1 block text-right text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString('fr-FR')}</time></div>)}<div ref={bottom} /></div>
          <form className="flex gap-2 border-t border-stone-100 p-4" onSubmit={send}><input className="field" aria-label="Votre message" maxLength={4000} placeholder="Écrire un message…" value={content} onChange={(event) => setContent(event.target.value)} /><button className="rounded-xl bg-emerald-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!connected || !content.trim()} type="submit">Envoyer</button></form>
        </> : <div className="grid flex-1 place-items-center p-8 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-900"><Mail aria-hidden="true" size={26} /></div><h2 className="mt-4 font-bold text-stone-900">Vos échanges, en temps réel</h2><p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">Choisissez une conversation ou recherchez un membre du campus pour démarrer.</p></div></div>}
      </div>
    </section>
  </main>
}
