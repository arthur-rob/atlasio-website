import { ref } from 'vue'
import { defineStore } from 'pinia'

const DEFAULT_DURATION = 4000

export const useNotificationStore = defineStore('notification', () => {
    const notificationToDisplay = ref<UiNotification[]>([])
    const queue = ref<UiNotification[]>([])

    const add = (notification: UiNotification) => {
        const notif = { id: Math.random().toString(36).substring(2, 15), ...notification }
        if (notificationToDisplay.value.length < 3) displayNotification(notif)
        else queue.value.push(notif)
    }

    const remove = (id: string) => {
        const index = notificationToDisplay.value.findIndex((n) => n.id === id)
        if (index === -1) return
        notificationToDisplay.value.splice(index, 1)
        if (queue.value.length == 0) return
        const next = queue.value.shift()
        if (next) displayNotification(next)
    }

    const displayNotification = (notif: UiNotification) => {
        if (!notif.id) return
        notificationToDisplay.value.push(notif)
        setTimeout(() => remove(notif.id), DEFAULT_DURATION)
    }

    return {
        notificationToDisplay,
        queue,
        add,
        remove,
    }
})
