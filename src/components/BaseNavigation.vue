<template>
    <header class="fixed top-0 z-50 bg-white w-full shadow-md">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <RouterLink
                    to="/"
                    class="hover:text-primary-foreground/80 flex items-center transition-colors"
                >
                    <img src="/logo/atlas.png" width="50px" alt="logo atlas" />
                    <h2>Atlasio</h2>
                </RouterLink>
                <div class="hidden md:flex items-center space-x-8">
                    <RouterLink
                        activeClass="base-gradient-underlined"
                        v-for="link in mainLinks"
                        :to="link.to"
                        :key="link.key"
                        :id="link.key"
                        class="hover:text-primary-foreground/80 transition-colors"
                    >
                        {{ link.label }}
                    </RouterLink>
                </div>
            </div>
        </div>
    </header>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

interface link {
    to: string
    label: string
    key: string
}

const mainLinks = ref<link[]>([
    {
        to: '/',
        label: 'Acceuil',
        key: 'home',
    },
])
</script>
