<template>
    <input
        type="text"
        class="gradient-text-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-white flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
        v-model="model"
        :placeholder="placeholder"
    />
</template>

<script setup lang="ts">
import { defineModel } from 'vue'

defineProps<{
    placeholder: string
}>()

const model = defineModel<string>('modelValue', {
    required: true,
})
</script>

<style scoped lang="scss">
.gradient-text-input {
    background: linear-gradient(45deg, #fafafa, rgba(255, 255, 255, 0.33));
}
</style>
