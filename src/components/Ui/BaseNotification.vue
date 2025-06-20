<template>
    <div
        class="base-notification-wrapper border rounded p-8 min-w-64"
        :class="[
            {
                error: type === 'error',
                success: type === 'success',
                info: type === 'info',
                warning: type === 'warning',
                'bg-red-400': type === 'error',
                'bg-orange-400': type === 'warning',
            },
            backgroundClassName,
            borderClassName,
        ]"
    >
        <div class="icon-aligner flex items-center justify-between">
            <span class="material-symbols-outlined ml-2 append-icon">{{ icon }}</span>
        </div>
        <slot></slot>
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

const notificationDisplayOption = ref<Record<NotificationType, NotificationDisplayOption>>({
    info: {
        icon: 'info',
        color: 'blue',
    },
    error: {
        icon: 'error',
        color: 'red',
    },
    success: {
        icon: 'check_circle',
        color: 'green',
    },
    warning: {
        icon: 'warning',
        color: 'yellow',
    },
})

const icon = computed<string>(() => notificationDisplayOption.value[props.type].icon)
const color = computed(() => notificationDisplayOption.value[props.type].color)
const backgroundClassName = computed(() => `bg-${color.value}-400`)
const borderClassName = computed(() => `border-${color.value}-400`)
</script>
