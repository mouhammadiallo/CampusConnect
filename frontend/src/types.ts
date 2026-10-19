export type UserProfile = {
  id: string
  email: string
  fullName: string
  department: string | null
  studyLevel: string | null
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN'
  bio?: string | null
  avatarUrl?: string | null
  avatarAttachment?: UploadedFile | null
  skills?: string[]
  socialLinks?: Record<string, string>
}

export type PublicProfile = Pick<UserProfile, 'id' | 'fullName' | 'department' | 'studyLevel' | 'bio' | 'avatarUrl' | 'avatarAttachment' | 'skills' | 'socialLinks'>

export type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresAt: string
  user: UserProfile
}

export type Session = {
  accessToken: string
  user: UserProfile
}

export type Post = {
  id: string
  authorId: string
  authorName: string
  content: string
  mediaUrl: string | null
  attachment?: UploadedFile | null
  createdAt: string
  likesCount: number
  commentsCount: number
  likedByCurrentUser: boolean
}

export type UploadedFile = { id: string; originalName: string; contentType: string; size: number }

export type CampusQuiz = {
  id: string
  question: string
  options: { id: string; text: string }[]
  authorId: string
  authorName: string
  createdAt: string
  attempts: number
  myAnswer: string | null
  myCorrect: boolean | null
  correctOptionId: string | null
  explanation: string | null
}

export type Comment = {
  id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type ResourceType = 'COURSE' | 'TUTORIAL' | 'PAST_PAPER' | 'SUMMARY' | 'OTHER'

export type AcademicResource = {
  id: string
  title: string
  description: string | null
  type: ResourceType
  ufr: string
  mention: string
  studyLevel: string
  url: string | null
  attachment?: UploadedFile | null
  authorId: string
  authorName: string
  createdAt: string
}

export type CampusEvent = {
  id: string
  title: string
  description: string
  location: string
  startsAt: string
  authorId: string
  authorName: string
  createdAt: string
  attendeesCount: number
  attending: boolean
}

export type CampusPoll = {
  id: string
  question: string
  options: { id: string; text: string; votes: number }[]
  authorId: string
  authorName: string
  createdAt: string
  totalVotes: number
  myVote: string | null
  closed: boolean
}

export type ReportedContentType = 'POST' | 'COMMENT' | 'RESOURCE' | 'EVENT' | 'CLASSIFIED'
export type ReportReason = 'HARASSMENT' | 'SPAM' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER'
export type ReportAction = 'DISMISS' | 'WARN' | 'SUSPEND'

export type ModerationReport = {
  id: string
  reporterId: string
  reporterName: string
  contentType: ReportedContentType
  contentId: string
  contentAuthorId: string
  contentAuthorName: string
  reason: ReportReason
  details: string | null
  status: 'OPEN' | 'DISMISSED' | 'ACTIONED'
  createdAt: string
  resolution: ReportAction | null
  resolutionNote: string | null
  resolvedAt: string | null
}

export type Contact = { id: string; fullName: string; email: string }
export type Conversation = { id: string; title: string | null; group: boolean; participantIds: string[]; createdAt: string; updatedAt: string }
export type ChatMessage = { id: string; conversationId: string; senderId: string; senderName: string; content: string; createdAt: string }
export type ClassifiedCategory = 'CARAVAN' | 'CARPOOL' | 'HOUSING' | 'SALE' | 'LOST_FOUND' | 'OTHER'
export type CampusClassified = {
  id: string
  title: string
  description: string
  category: ClassifiedCategory
  price: number | null
  location: string | null
  authorId: string
  authorName: string
  status: 'ACTIVE' | 'CLOSED'
  createdAt: string
}
