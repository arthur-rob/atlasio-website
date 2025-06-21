import { setActivePinia, createPinia } from 'pinia'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from '../Notifications'

describe('Notification Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('adds a notification to notificationToDisplay if less than 3 are visible', () => {
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        expect(store.notificationToDisplay.length).toBe(1)
        expect(store.notificationToDisplay[0].message).toBe('Test 1')
    })

    it('queues notifications if more than 3 are visible', () => {
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        store.add({ message: 'Test 2' })
        store.add({ message: 'Test 3' })
        store.add({ message: 'Test 4' })
        expect(store.notificationToDisplay.length).toBe(3)
        expect(store.queue.length).toBe(1)
        expect(store.queue[0].message).toBe('Test 4')
    })

    it('removes a notification from notificationToDisplay', () => {
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        const id = store.notificationToDisplay[0].id
        store.remove(id!)
        expect(store.notificationToDisplay.length).toBe(0)
    })

    it('moves a queued notification to notificationToDisplay when one is removed', () => {
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        store.add({ message: 'Test 2' })
        store.add({ message: 'Test 3' })
        store.add({ message: 'Test 4' })
        const id = store.notificationToDisplay[0].id
        store.remove(id!)
        expect(store.notificationToDisplay.length).toBe(3)
        expect(store.queue.length).toBe(0)
        expect(store.notificationToDisplay.some((n) => n.message === 'Test 4')).toBe(true)
    })

    it('does not remove if id is not found', () => {
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        store.remove('non-existent-id')
        expect(store.notificationToDisplay.length).toBe(1)
    })

    it('auto-removes notification after DEFAULT_DURATION', async () => {
        vi.useFakeTimers()
        const store = useNotificationStore()
        store.add({ message: 'Test 1' })
        vi.advanceTimersByTime(5000)
        expect(store.notificationToDisplay.length).toBe(0)
        vi.useRealTimers()
    })
})
