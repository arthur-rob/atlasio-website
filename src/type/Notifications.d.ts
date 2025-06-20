type NotificationType = 'error' | 'success' | 'info' | 'warning'

interface Notification {
    id?: string
    message: string
    type?: NotificationType
    duration?: number
}
