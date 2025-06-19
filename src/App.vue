<script setup lang="ts">
import BaseNavigation from './components/BaseNavigation.vue'
import BaseBackground from './components/BaseBackground.vue'
</script>

<template>
    <BaseBackground />
    <BaseNavigation />
    <RouterView />
</template>
