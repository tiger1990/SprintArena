export type Role = 'admin' | 'assignee'

export type StoryStatus =
  | 'proposed'
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'spilled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type StoryPoints = 1 | 2 | 3 | 5 | 8 | 13

export type SprintStatus = 'planning' | 'active' | 'review' | 'completed'

export type BadgeKey =
  | 'sprint_mvp'
  | 'clean_sprint'
  | 'critical_crusher'
  | 'speed_demon'
  | 'hat_trick'
  | 'iron_dev'
  | 'first_blood'
  | 'comeback_kid'

export interface User {
  id: string
  name: string
  role: Role
  photoUrl?: string
  color: string
  email?: string
  timezone: string
  isActive: boolean
  workspaceId: string
  createdAt: string
}

export interface AcceptanceCriterion {
  id: string
  storyId: string
  text: string
  isMet: boolean
  metBy?: string
  metAt?: string
  orderIndex: number
}

export interface StoryComment {
  id: string
  storyId: string
  userId: string
  body: string
  isBlocker: boolean
  createdAt: string
}

export interface Story {
  id: string
  workspaceId: string
  sprintId?: string
  title: string
  description: string
  status: StoryStatus
  priority: Priority
  storyPoints: StoryPoints
  assigneeId?: string
  createdBy: string
  approvedBy?: string
  rejectedBy?: string
  rejectionNote?: string
  tags: string[]
  completedAt?: string
  completedBy?: string
  spilledFrom?: string
  orderIndex: number
  acceptanceCriteria: AcceptanceCriterion[]
  comments: StoryComment[]
  createdAt: string
  updatedAt: string
}

export interface Sprint {
  id: string
  workspaceId: string
  name: string
  goal?: string
  startDate: string
  endDate: string
  status: SprintStatus
  capacityPoints: number
  velocityPoints: number
  createdBy: string
  startedAt?: string
  endedBy?: string
  endedAt?: string
  createdAt: string
}

export interface Badge {
  key: BadgeKey
  name: string
  icon: string
  description: string
}

export interface UserBadge {
  id: string
  userId: string
  badgeKey: BadgeKey
  sprintId: string
  earnedAt: string
}

export interface SprintResult {
  id: string
  sprintId: string
  userId: string
  rank: number
  pointsScored: number
  storiesCompleted: number
  storiesSpilled: number
  storiesTotal: number
  onTimeRate: number
  rawStoryPoints: number
  bonusPoints: number
  penaltyPoints: number
  isEligible: boolean
  isWinner: boolean
}

export interface Retrospective {
  id: string
  sprintId: string
  whatWentWell: string[]
  whatDidnt: string[]
  actionItems: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  workspaceId: string
  userId?: string
  type: 'assignment' | 'approval' | 'rejection' | 'sprint_start' | 'sprint_end' | 'winner' | 'proposal' | 'blocker'
  title: string
  body?: string
  actionUrl?: string
  metadata: Record<string, unknown>
  readAt?: string
  createdAt: string
}

export interface SprintExclusion {
  id: string
  sprintId: string
  userId: string
  reason: string
  addedBy: string
}

export interface Workspace {
  id: string
  name: string
  logoUrl?: string
  timezone: string
  inviteCode: string
  settings: WorkspaceSettings
  createdAt: string
  createdBy: string
}

export interface WorkspaceSettings {
  sprintDurationDays: number
  wipLimits: { todo: number; inProgress: number; review: number }
  scoringEnabled: boolean
  adminExcludedFromScoring: boolean
  definitionOfDone: string
  velocityWindowSprints: number
}

export interface AuditLog {
  id: string
  workspaceId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  createdAt: string
}

export interface AppState {
  workspace: Workspace | null
  currentUser: User | null
  users: User[]
  sprints: Sprint[]
  stories: Story[]
  notifications: Notification[]
  userBadges: UserBadge[]
  sprintResults: SprintResult[]
  retrospectives: Retrospective[]
  exclusions: SprintExclusion[]
  auditLogs: AuditLog[]
  _hasHydrated: boolean
}

export const BADGES: Badge[] = [
  { key: 'sprint_mvp', name: 'Sprint MVP', icon: '👑', description: 'Won a sprint' },
  { key: 'clean_sprint', name: 'Clean Sprint', icon: '🌟', description: '100% stories done, 0 spilled' },
  { key: 'critical_crusher', name: 'Critical Crusher', icon: '💥', description: 'Completed a CRITICAL story' },
  { key: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Finished all stories 2+ days early' },
  { key: 'hat_trick', name: 'Hat Trick', icon: '🎩', description: 'Won 3 sprints in a row' },
  { key: 'iron_dev', name: 'Iron Dev', icon: '🔩', description: 'No spilled stories for 5 sprints' },
  { key: 'first_blood', name: 'First Blood', icon: '🩸', description: 'First to complete a story in a sprint' },
  { key: 'comeback_kid', name: 'Comeback Kid', icon: '🔄', description: 'Won after being last on the leaderboard' },
]

export const STORY_POINT_OPTIONS: StoryPoints[] = [1, 2, 3, 5, 8, 13]

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'text-blue-400 bg-blue-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-orange-400 bg-orange-400/10',
  critical: 'text-red-400 bg-red-400/10',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const STATUS_LABELS: Record<StoryStatus, string> = {
  proposed: 'Proposed',
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  spilled: 'Spilled',
}

export const COLUMN_STATUSES: StoryStatus[] = ['todo', 'in_progress', 'review', 'done']
