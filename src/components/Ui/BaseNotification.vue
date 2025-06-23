<template>
    <div
        class="base-notification-wrapper border-2 rounded w-full m-auto shadow-md px-2 py-2 flex items-center justify-start"
        :class="{
            'bg-rose-50 border-rose-300 text-rose-800': type === 'error',
            'bg-amber-50 border-amber-300 text-amber-800': type === 'warning',
            'bg-sky-50 border-sky-300 text-sky-800': type === 'info',
            'bg-lime-50 border-lime-300 text-lime-800': type === 'success',
        }"
    >
        <div class="icon-aligner flex items-center justify-start">
            <span
                class="mx-2 append-icon material-symbols-outlined"
                :class="[
                    {
                        'text-rose-600': type === 'error',
                        'text-amber-600': type === 'warning',
                        'text-sky-600': type === 'info',
                        'text-lime-600': type === 'success',
                    },
                ]"
                >{{ icon }}</span
            >

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
    .append-icon {
        font-size: 18px;
    }
}
</style>
