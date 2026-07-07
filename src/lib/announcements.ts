export type AnnouncementTone = 'muted' | 'success' | 'warning'

export interface TimelineAnnouncement {
  id: string
  message: string
  meta: string
  tone?: AnnouncementTone
  enabled?: boolean
}

export interface ModalAnnouncement {
  id: string
  title: string
  message: string
  confirmText?: string
  enabled?: boolean
}

export const modalAnnouncements: ModalAnnouncement[] = []

export const timelineAnnouncements: TimelineAnnouncement[] = []

const DISMISSED_MODAL_ANNOUNCEMENTS_KEY = 'lewis-image-dismissed-modal-announcements'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getDismissedModalAnnouncementIds(): string[] {
  if (!canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(DISMISSED_MODAL_ANNOUNCEMENTS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

export function dismissModalAnnouncement(id: string) {
  if (!canUseLocalStorage()) return

  const dismissedIds = new Set(getDismissedModalAnnouncementIds())
  dismissedIds.add(id)
  window.localStorage.setItem(DISMISSED_MODAL_ANNOUNCEMENTS_KEY, JSON.stringify([...dismissedIds]))
}

export function getFirstUnreadModalAnnouncement() {
  const dismissedIds = new Set(getDismissedModalAnnouncementIds())
  return modalAnnouncements.find((announcement) => announcement.enabled !== false && !dismissedIds.has(announcement.id)) ?? null
}
