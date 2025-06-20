import { ref } from 'vue'
import { defineStore } from 'pinia'

const DEFAULT_DURATION = 1000

export const useNotificationStore = defineStore('notification', () => {
    const visibleNotifications = ref<Notification[]>([])
    const queue = ref<Notification[]>([])

    const add = (notification: Notification) => {
        const id = Math.random().toString(36).substring(2, 15)
        const notif = { id, ...notification }

        if (visibleNotifications.value.length < 3) {
            visibleNotifications.value.push(notif)
            setTimeout(() => remove(id), DEFAULT_DURATION)
        } else {
            queue.value.push(notif)
        }
    }
    const remove = (id: string) => {
        const index = visibleNotifications.value.findIndex((n) => n.id === id)
        if (index === -1) return
        visibleNotifications.value.splice(index, 1)
        if (queue.value.length == 0) return
        const next = queue.value.shift()
        if (!next) return
        
        visibleNotifications.value.push(next)
        setTimeout(() => remove(id), DEFAULT_DURATION)
    }

    return {
        visibleNotifications,
        queue,
        add,
        remove,
    }
})
