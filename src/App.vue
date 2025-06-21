<script setup lang="ts">
import BaseNavigation from './components/BaseNavigation.vue'
import BaseBackground from './components/BaseBackground.vue'
import NotificationsManager from './components/NotificationsManager.vue'
</script>

<template>
    <BaseBackground />
    <BaseNavigation />
    <RouterView />
    <NotificationsManager />
</template>
