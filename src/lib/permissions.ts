import type { User, Story, Sprint, Role } from '@/types'

export function canMoveStory(user: User, story: Story): boolean {
  if (user.role === 'admin') return true
  return story.assigneeId === user.id
}

export function canEditStory(user: User, story: Story): boolean {
  if (user.role === 'admin') return true
  return story.createdBy === user.id || story.assigneeId === user.id
}

export function canDeleteStory(user: User, story: Story): boolean {
  if (user.role === 'admin') return true
  if (story.sprintId) return false // in sprint — only admin can delete
  return story.createdBy === user.id
}

export function canAssignStory(user: User): boolean {
  return user.role === 'admin'
}

export function canAddToSprint(user: User): boolean {
  return user.role === 'admin'
}

export function canApproveProposal(user: User): boolean {
  return user.role === 'admin'
}

export function canEndSprint(user: User): boolean {
  return user.role === 'admin'
}

export function canCreateSprint(user: User): boolean {
  return user.role === 'admin'
}

export function canManageTeam(user: User): boolean {
  return user.role === 'admin'
}

export function canViewAnalytics(user: User): boolean {
  return user.role === 'admin'
}

export function canProposeStory(user: User): boolean {
  return true // all roles can propose
}

export function canMarkAcceptanceCriteria(user: User, story: Story): boolean {
  if (user.role === 'admin') return true
  return story.assigneeId === user.id
}

export function canMoveToReview(user: User, story: Story): boolean {
  if (user.role === 'admin') return true
  return story.assigneeId === user.id
}

export function canMoveToDone(user: User): boolean {
  return user.role === 'admin'
}

export function canExcludeFromScoring(user: User): boolean {
  return user.role === 'admin'
}

export function requiresRole(role: Role, userRole: Role): boolean {
  if (role === 'assignee') return true
  return userRole === 'admin'
}
