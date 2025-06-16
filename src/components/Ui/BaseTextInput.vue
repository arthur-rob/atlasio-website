<template>
    <div>
        <input
            type="text"
            class="gradient-text-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-white flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[2px]"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
        />
        <p v-if="error" class="text-red-500 text-sm mt-1">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { defineModel, ref, inject, onMounted } from 'vue'

const error = ref<string | null>()
const componentId = `input-${Math.random().toString(36).substring(2, 10)}`
const registerField = inject<(id: string, validateFn: () => boolean) => void>('registerField')
const props = withDefaults(
    defineProps<{
        placeholder?: string
        disabled?: boolean
        rules?: ((value: string) => string | true)[]
    }>(),
    {
        disabled: false,
        rules: () => [],
    },
)
const model = defineModel<string>('modelValue', {
    required: true,
})

const validate = (): boolean => {
    error.value = null
    for (const rule of props.rules) {
        const result = rule(model.value)
        if (result !== true) {
            error.value = result
            return false
        }
    }
    return true
}

onMounted(() => {
    registerField?.(componentId, validate)
})
</script>

<style scoped lang="scss">
.gradient-text-input {
    background: linear-gradient(45deg, #fafafa, rgba(255, 255, 255, 0.33));
}
</style>
