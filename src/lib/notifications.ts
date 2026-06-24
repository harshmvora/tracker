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
  new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: title, // deduplicate by title
  })
}
