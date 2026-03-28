import { generateId } from '@/lib/utils'
import type { Notification, AuditLog } from '@/types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../types'

const MAX_AUDIT_LOGS = 500

export interface NotificationSlice {
  notifications: Notification[]
  auditLogs: AuditLog[]

  addNotification: (data: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllRead: (userId: string) => void
  getUnreadCount: (userId: string) => number
  addAuditLog: (data: Omit<AuditLog, 'id' | 'createdAt'>) => void
}

export const createNotificationSlice: StateCreator<AppStore, [], [], NotificationSlice> = (set, get) => ({
  notifications: [],
  auditLogs: [],

  addNotification: (data) => {
    const notif: Notification = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    set(s => ({ notifications: [notif, ...s.notifications] }))
  },

  markNotificationRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      ),
    }))
  },

  markAllRead: (userId) => {
    set(s => ({
      notifications: s.notifications.map(n =>
        (!n.userId || n.userId === userId) && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n
      ),
    }))
  },

  getUnreadCount: (userId) =>
    get().notifications.filter(n => !n.readAt && (!n.userId || n.userId === userId)).length,

  addAuditLog: (data) => {
    const log: AuditLog = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    // Truncate BEFORE appending to keep localStorage writes small
    set(s => ({ auditLogs: [log, ...s.auditLogs.slice(0, MAX_AUDIT_LOGS - 1)] }))
  },
})
