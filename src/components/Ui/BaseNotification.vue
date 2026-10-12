<template>
    <div
        class="base-notification-wrapper w-full m-auto flex items-center gap-3"
        :class="`type-${type}`"
        :role="type === 'error' ? 'alert' : 'status'"
    >
        <span class="notification-icon material-symbols-outlined" aria-hidden="true">{{
            icon
        }}</span>
        <div class="notification-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
    defineProps<{
        type: NotificationType
    }>(),
    {
        type: 'info',
    },
)

const notificationIcon = ref<Record<NotificationType, string>>({
    info: 'info',
    error: 'error',
    success: 'check_circle',
    warning: 'warning',
})
const icon = computed<string>(() => notificationIcon.value[props.type])
</script>
<style scoped lang="scss">
.base-notification-wrapper {
    box-sizing: border-box;
    padding: 0.75rem 1rem;
    border: 1px solid var(--tone-border);
    border-radius: var(--ui-radius);
    background: var(--tone-bg);
    color: var(--tone-text);
    font-size: var(--ui-font-size);
    line-height: 1.4;
    box-shadow:
        0 10px 25px -10px rgb(0 0 0 / 0.15),
        0 2px 6px -2px rgb(0 0 0 / 0.06);

    .notification-icon {
        font-size: 1.25rem;
        color: var(--tone-icon);
        flex-shrink: 0;
    }

    &.type-error {
        --tone-bg: var(--color-rose-50);
        --tone-border: var(--color-rose-200);
        --tone-text: var(--color-rose-900);
        --tone-icon: var(--color-rose-600);
    }
    &.type-warning {
        --tone-bg: var(--color-amber-50);
        --tone-border: var(--color-amber-200);
        --tone-text: var(--color-amber-900);
        --tone-icon: var(--color-amber-600);
    }
    &.type-info {
        --tone-bg: var(--color-sky-50);
        --tone-border: var(--color-sky-200);
        --tone-text: var(--color-sky-900);
        --tone-icon: var(--color-sky-600);
    }
    &.type-success {
        --tone-bg: var(--color-emerald-50);
        --tone-border: var(--color-emerald-200);
        --tone-text: var(--color-emerald-900);
        --tone-icon: var(--color-emerald-600);
    }
}
</style>
