<template>
    <button
        class="cursor-pointer flex items-center h-10 base-gradient-bg p-[2px] rounded-md outline-gray-200 active:outline-2 transition-outline duration-100"
        :class="{ 'is-loading': loading, disabled: disabled || loading }"
    >
        <div class="px-4 py-1 bg-white rounded h-full flex items-center">
            <span v-if="prependIcon" class="material-symbols-outlined mr-2">
                {{ prependIcon }}</span
            >
            <slot></slot>
            <span class="material-symbols-outlined ml-2 append-icon" v-if="loading || appendIcon">{{
                loading ? 'progress_activity' : appendIcon
            }}</span>
        </div>
    </button>
</template>

<script setup lang="ts">
type BaseButtonVariant = 'primary' | 'secondary' | 'text' | 'outlined'
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
</script>

<style scoped lang="scss">
.disabled {
    cursor: not-allowed;
}
.disabled:active {
    pointer-events: none;
}
.is-loading {
    .append-icon {
        animation: loading 1s ease-in-out infinite;
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
