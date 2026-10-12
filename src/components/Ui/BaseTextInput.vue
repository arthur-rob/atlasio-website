<template>
    <div
        :class="{ 'input-disabled': disabled, 'pb-5': rules.length }"
        class="base-text-input relative w-full"
    >
        <label v-if="label" :for="componentId" class="input-label">{{ label }}</label>
        <input
            :id="componentId"
            :type="type"
            class="input-field ui-border w-full"
            :class="{ 'has-error': error }"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :aria-invalid="!!error || undefined"
        />
        <p v-if="error" class="error-message absolute left-0 bottom-0">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

const error = ref<string | null>()
const componentId = `input-${Math.random().toString(36).substring(2, 10)}`
const registerField = inject<((id: string, validateFn: () => boolean) => void) | null>(
    'registerField',
    null,
)
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
    if (registerField) registerField(componentId, validate)
})
</script>

<style scoped lang="scss">
.input-label {
    display: block;
    margin-bottom: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ui-text);
}

.input-field {
    height: var(--ui-height);
    padding: 0 0.75rem;
    border-radius: var(--ui-radius);
    font-size: var(--ui-font-size);
    color: var(--ui-text);
    outline: none;

    &::placeholder {
        color: var(--color-gray-400);
    }
    &::selection {
        background: rgb(29 140 253 / 0.2);
    }
    &:hover {
        --ui-border-color: var(--ui-border-color-hover);
    }
    &:focus {
        background:
            linear-gradient(var(--ui-surface), var(--ui-surface)) padding-box,
            var(--base-linear-gradient) border-box;
        box-shadow: var(--ui-focus-ring);
    }
    &.has-error {
        background:
            linear-gradient(var(--ui-surface), var(--ui-surface)) padding-box,
            linear-gradient(var(--color-rose-300), var(--color-rose-300)) border-box;
    }
    &.has-error:focus {
        box-shadow: 0 0 0 4px rgb(244 63 94 / 0.12);
    }
}

.error-message {
    font-size: 0.75rem;
    line-height: 1.25rem;
    color: var(--color-rose-600);
    margin: 0;
    padding-left: 0.25rem;
}

.input-disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>
