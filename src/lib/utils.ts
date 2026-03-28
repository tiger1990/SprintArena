import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return uuidv4()
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateColor(): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateString)
}

export function daysUntil(dateString: string): number {
  const now = new Date()
  const date = new Date(dateString)
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysBetween(a: string, b: string): number {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return Math.abs(Math.ceil((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24)))
}

export function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function sprintProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
