<template>
    <div class="fixed bottom-0 right-50 z-50 p-4 w-full max-w-sm">
        <BaseNotification v-for="notification in notificationStore.visibleNotifications" :key="notification.id" class="mb-2" :type="notification.type || 'info'">
            {{ notification.message }}
        </BaseNotification>
    </div>
</template>

<script setup lang="ts">
import BaseNotification from "@/components/Ui/BaseNotification.vue";
import { useNotificationStore } from "@/store/Notifications";

const notificationStore = useNotificationStore()
</script>