<template>
    <div
        class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm p-4 notification-wrapper"
    >
        <TransitionGroup name="notification" tag="div" appear class="flex flex-col">
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
.notification-enter-active,
.notification-leave-active {
    transition:
        opacity,
        transform,
        0.5s ease;

    transition: height 0.4s 0.1s ease;
}

.notification-leave-active {
    transition: height 0.4s ease;
}
.notification-leave-to,
.notification-enter-from {
    opacity: 0;
    transform: translateY(-10px);
    height: 0px;
}
</style>
