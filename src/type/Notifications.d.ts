type NotificationType = 'error' | 'success' | 'info' | 'warning'

interface NotificationDisplayOption {
    icon: string
    color: string
}

interface Notification {
    id?: string
    message: string
    type?: NotificationType
}
