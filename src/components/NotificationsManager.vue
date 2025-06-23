<template>
    <div
        class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-128 p-4 notification-wrapper"
    >
        <TransitionGroup name="notification" tag="div" appear class="flex flex-col relative">
            <BaseNotification
                v-for="notification in notificationStore.notificationToDisplay"
                :key="notification.id"
                class="mb-2"
                :type="notification.type || 'info'"
            >
                {{ notification.message }}
            </BaseNotification>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import BaseNotification from '@/components/Ui/BaseNotification.vue'
import { useNotificationStore } from '@/store/Notifications'

const notificationStore = useNotificationStore()
</script>
<style scoped>
.notification-move,
.notification-enter-active,
.notification-leave-active {
    transition: all 0.5s ease;
}
.notification-leave-active {
    position: absolute;
}
.notification-enter-from,
.notification-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
}
</style>
