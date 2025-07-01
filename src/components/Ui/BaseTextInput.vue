<template>
    <div :class="{ 'input-disabled': disabled }" class="min-h-16 mb-0">
        <input
            :type="type"
            :label="label"
            class="h-10 selection:bg-primary selection:text-primary-foreground min-w-64 outline-gray-200 rounded-md focus:outline-4 outline-2 transition-outline duration-200 px-3 py-1 text-base bg-input-background"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
        />
        <p v-if="error" class="error-message text-red-500 text-sm pl-2">{{ error }}</p>
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
        label?: string
        type?: 'text' | 'password'
    }>(),
    {
        disabled: false,
        type: 'text',
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
.input-disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>
