type NotificationType = 'error' | 'success' | 'info' | 'warning'

interface UiNotification {
    id?: string
    message: string
    type?: NotificationType
}
