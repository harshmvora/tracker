const INTERVAL_MS = 2 * 60 * 60 * 1000 // 2 hours
const LAST_FIRED_KEY = 'tracker-notified-at'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.requestPermission()
}

export function fireNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.svg', tag: title })
}

/** Returns true if enough time has passed since the last batch (or never fired). */
export function dueForReminder(): boolean {
  const last = Number(localStorage.getItem(LAST_FIRED_KEY) || 0)
  return Date.now() - last >= INTERVAL_MS
}

export function markReminderFired() {
  localStorage.setItem(LAST_FIRED_KEY, String(Date.now()))
}
