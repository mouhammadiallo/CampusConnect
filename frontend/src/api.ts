import type { AcademicResource, AuthResponse, CampusClassified, CampusEvent, CampusPoll, CampusQuiz, ChatMessage, ClassifiedCategory, Comment, Contact, Conversation, ModerationReport, Page, Post, PublicProfile, ReportAction, ReportedContentType, ReportReason, ResourceType, Session, UploadedFile, UserProfile } from './types'

export class ApiError extends Error {}
export const SESSION_EXPIRED_EVENT = 'campusconnect:session-expired'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

export function chatWebSocketUrl(): string {
  const url = new URL(API_BASE_URL || window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/ws/chat`
  url.search = ''
  url.hash = ''
  return url.toString()
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(apiUrl(path), { ...init, headers })
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez que l’API est démarrée.')
  }

  if (!response.ok) {
    let message = response.status === 401
      ? 'Votre session a expiré. Connectez-vous à nouveau.'
      : response.status === 403
        ? 'Vous n’avez pas l’autorisation d’effectuer cette action.'
        : `La requête a échoué (${response.status}).`
    if (response.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null) {
        const details = body as { detail?: unknown; message?: unknown; title?: unknown }
        if (typeof details.detail === 'string') message = details.detail
        else if (typeof details.message === 'string') message = details.message
        else if (typeof details.title === 'string') message = details.title
      }
    } catch {
      // Keep the status-based message when the API response has no JSON body.
    }
    throw new ApiError(message)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export async function authenticate(path: '/api/auth/login' | '/api/auth/register', payload: object): Promise<Session> {
  const result = await request<AuthResponse>(path, { method: 'POST', body: JSON.stringify(payload) })
  return { accessToken: result.accessToken, user: result.user }
}

export function getMyProfile(token: string): Promise<UserProfile> {
  return request<UserProfile>('/api/profile/me', {}, token)
}

export function updateMyProfile(token: string, profile: {
  fullName: string
  department: string
  studyLevel: string
  bio: string
  avatarUrl: string
  avatarAttachmentId?: string | null
  skills: string[]
  socialLinks: Record<string, string>
}): Promise<UserProfile> {
  return request<UserProfile>('/api/profile/me', { method: 'PUT', body: JSON.stringify(profile) }, token)
}

export function searchProfiles(token: string, q: string): Promise<PublicProfile[]> {
  return request<PublicProfile[]>(`/api/profiles?q=${encodeURIComponent(q)}`, {}, token)
}

export function getPublicProfile(token: string, id: string): Promise<PublicProfile> {
  return request<PublicProfile>(`/api/profiles/${encodeURIComponent(id)}`, {}, token)
}

export async function getPosts(token: string): Promise<Post[]> {
  const page = await request<Page<Post>>('/api/posts?page=0&size=20', {}, token)
  return page.content
}

export function uploadFile(token: string, file: File, purpose: 'post' | 'resource' | 'avatar' = 'post'): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  const path = purpose === 'resource' ? '/api/uploads/pdf' : '/api/uploads'
  return request<UploadedFile>(path, { method: 'POST', body: form }, token)
}

export async function fetchUploadedFile(token: string, id: string): Promise<Blob> {
  let response: Response
  try { response = await fetch(apiUrl(`/api/uploads/${encodeURIComponent(id)}`), { headers: { Authorization: `Bearer ${token}` } }) }
  catch { throw new ApiError('Impossible de joindre le serveur. Vérifiez que l’API est démarrée.') }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw new ApiError(response.status === 401 ? 'Votre session a expiré. Connectez-vous à nouveau.' : `Le fichier n’a pas pu être chargé (${response.status}).`)
  }
  return response.blob()
}

export function createPost(token: string, content: string, mediaUrl?: string, attachmentId?: string): Promise<Post> {
  return request<Post>('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ content, mediaUrl: mediaUrl || undefined, attachmentId: attachmentId || undefined }),
  }, token)
}

export function deletePost(token: string, postId: string): Promise<void> {
  return request<void>(`/api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }, token)
}

export function getComments(token: string, postId: string): Promise<Comment[]> {
  return request<Comment[]>(`/api/posts/${encodeURIComponent(postId)}/comments?page=0&size=50`, {}, token)
}

export function createComment(token: string, postId: string, content: string): Promise<Comment> {
  return request<Comment>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }, token)
}

export function likePost(token: string, postId: string): Promise<Post> {
  return request<Post>(`/api/posts/${encodeURIComponent(postId)}/likes`, { method: 'POST' }, token)
}

export function unlikePost(token: string, postId: string): Promise<Post> {
  return request<Post>(`/api/posts/${encodeURIComponent(postId)}/likes`, { method: 'DELETE' }, token)
}

export type ResourceFilters = { q?: string; ufr?: string; mention?: string; studyLevel?: string }

export async function getResources(token: string, filters: ResourceFilters = {}): Promise<AcademicResource[]> {
  const params = new URLSearchParams({ page: '0', size: '50' })
  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) params.set(key, value.trim())
  })
  const page = await request<Page<AcademicResource>>(`/api/resources?${params.toString()}`, {}, token)
  return page.content
}

export function createResource(token: string, resource: {
  title: string
  description: string
  type: ResourceType
  ufr: string
  mention: string
  studyLevel: string
  url?: string
  attachmentId?: string
}): Promise<AcademicResource> {
  return request<AcademicResource>('/api/resources', {
    method: 'POST',
    body: JSON.stringify(resource),
  }, token)
}

export function deleteResource(token: string, resourceId: string): Promise<void> {
  return request<void>(`/api/resources/${encodeURIComponent(resourceId)}`, { method: 'DELETE' }, token)
}

export function getEvents(token: string): Promise<CampusEvent[]> {
  return request<CampusEvent[]>('/api/events?page=0&size=50', {}, token)
}

export function getPolls(token: string): Promise<CampusPoll[]> {
  return request<CampusPoll[]>('/api/polls?page=0&size=50', {}, token)
}

export function createPoll(token: string, question: string, options: string[]): Promise<CampusPoll> {
  return request<CampusPoll>('/api/polls', { method: 'POST', body: JSON.stringify({ question, options }) }, token)
}

export function votePoll(token: string, pollId: string, optionId: string): Promise<CampusPoll> {
  return request<CampusPoll>(`/api/polls/${encodeURIComponent(pollId)}/votes`, { method: 'POST', body: JSON.stringify({ optionId }) }, token)
}

export function closePoll(token: string, pollId: string): Promise<CampusPoll> {
  return request<CampusPoll>(`/api/polls/${encodeURIComponent(pollId)}/close`, { method: 'POST' }, token)
}

export function getQuizzes(token: string): Promise<CampusQuiz[]> {
  return request<CampusQuiz[]>('/api/quizzes?page=0&size=50', {}, token)
}

export function createQuiz(token: string, question: string, options: string[], correctOptionId: string, explanation: string): Promise<CampusQuiz> {
  return request<CampusQuiz>('/api/quizzes', {
    method: 'POST', body: JSON.stringify({ question, options, correctOptionId, explanation }),
  }, token)
}

export function answerQuiz(token: string, quizId: string, optionId: string): Promise<CampusQuiz> {
  return request<CampusQuiz>(`/api/quizzes/${encodeURIComponent(quizId)}/answers`, {
    method: 'POST', body: JSON.stringify({ optionId }),
  }, token)
}

export function createEvent(token: string, event: {
  title: string
  description: string
  location: string
  startsAt: string
}): Promise<CampusEvent> {
  return request<CampusEvent>('/api/events', { method: 'POST', body: JSON.stringify(event) }, token)
}

export function setEventRsvp(token: string, eventId: string, attending: boolean): Promise<CampusEvent> {
  return request<CampusEvent>(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: attending ? 'POST' : 'DELETE',
  }, token)
}

export function createReport(token: string, contentType: ReportedContentType, contentId: string, reason: ReportReason, details: string): Promise<ModerationReport> {
  return request<ModerationReport>('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ contentType, contentId, reason, details }),
  }, token)
}

export async function getOpenReports(token: string): Promise<ModerationReport[]> {
  const page = await request<Page<ModerationReport>>('/api/moderation/reports?page=0&size=100', {}, token)
  return page.content
}

export function resolveReport(token: string, reportId: string, action: ReportAction, note: string, suspensionHours?: number): Promise<ModerationReport> {
  return request<ModerationReport>(`/api/moderation/reports/${encodeURIComponent(reportId)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action, note, suspensionHours }),
  }, token)
}

export function getConversations(token: string): Promise<Conversation[]> {
  return request<Conversation[]>('/api/conversations', {}, token)
}

export function getContacts(token: string, q: string): Promise<Contact[]> {
  return request<Contact[]>(`/api/conversations/contacts?q=${encodeURIComponent(q)}`, {}, token)
}

export function createConversation(token: string, participantIds: string[], title?: string): Promise<Conversation> {
  return request<Conversation>('/api/conversations', { method: 'POST', body: JSON.stringify({ participantIds, title }) }, token)
}

export function getMessages(token: string, conversationId: string): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/api/conversations/${encodeURIComponent(conversationId)}/messages?size=100`, {}, token)
}

export async function getClassifieds(token: string, filters: { q?: string; category?: ClassifiedCategory } = {}): Promise<Page<CampusClassified>> {
  const params = new URLSearchParams({ page: '0', size: '30' })
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.category) params.set('category', filters.category)
  return request<Page<CampusClassified>>(`/api/classifieds?${params.toString()}`, {}, token)
}

export function createClassified(token: string, classified: {
  title: string
  description: string
  category: ClassifiedCategory
  price?: number
  location?: string
}): Promise<CampusClassified> {
  return request<CampusClassified>('/api/classifieds', {
    method: 'POST',
    body: JSON.stringify(classified),
  }, token)
}

export function closeClassified(token: string, id: string): Promise<CampusClassified> {
  return request<CampusClassified>(`/api/classifieds/${encodeURIComponent(id)}/close`, { method: 'POST' }, token)
}
