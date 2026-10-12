<template>
    <button
        type="button"
        class="base-button ui-focusable inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none cursor-pointer"
        :class="[
            `variant-${variant}`,
            {
                'is-loading': loading,
                'is-icon-only': isIconOnly,
                disabled: disabled || loading,
                'ui-gradient-border': variant === 'primary',
                'ui-border': variant === 'secondary' || variant === 'outlined',
            },
        ]"
        :disabled="disabled || loading"
        :aria-busy="loading || undefined"
    >
        <span v-if="prependIcon" class="material-symbols-outlined button-icon" aria-hidden="true">
            {{ prependIcon }}
        </span>
        <slot></slot>
        <span
            v-if="loading || appendIcon"
            class="material-symbols-outlined button-icon append-icon"
            aria-hidden="true"
        >
            {{ loading ? 'progress_activity' : appendIcon }}
        </span>
    </button>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

type BaseButtonVariant = 'primary' | 'secondary' | 'text' | 'outlined' | 'plain'
withDefaults(
    defineProps<{
        prependIcon?: boolean | string
        appendIcon?: boolean | string
        variant?: BaseButtonVariant
        disabled?: boolean
        loading?: boolean
    }>(),
    {
        prependIcon: false,
        appendIcon: false,
        variant: 'primary',
        disabled: false,
        loading: false,
    },
)

const slots = useSlots()
const isIconOnly = computed(() => !slots.default)
</script>

<style scoped lang="scss">
.base-button {
    height: var(--ui-height);
    padding: 0 1rem;
    border-radius: var(--ui-radius);
    font-size: var(--ui-font-size);
    line-height: 1;
    flex-shrink: 0;
    color: var(--ui-text);
    transition:
        background-color 150ms ease,
        box-shadow 150ms ease,
        color 150ms ease,
        --ui-surface 150ms ease;

    &.is-icon-only {
        width: var(--ui-height);
        padding: 0;
    }
}

.button-icon {
    font-size: 1.25rem;
}

.variant-primary:hover:not(.disabled) {
    --ui-surface: var(--ui-surface-hover);
    box-shadow: var(--ui-shadow-hover);
}

.variant-secondary,
.variant-outlined {
    &:hover:not(.disabled) {
        --ui-surface: var(--ui-surface-hover);
        --ui-border-color: var(--ui-border-color-hover);
    }
}

.variant-plain,
.variant-text {
    border: var(--ui-border-width) solid transparent;
    background-color: transparent;
    color: var(--ui-text-muted);

    &:hover:not(.disabled) {
        background-color: var(--color-gray-100);
        color: var(--ui-text);
    }
}

.disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
.is-loading {
    cursor: progress;
    .append-icon {
        animation: loading 1s linear infinite;
    }
}
@keyframes loading {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
