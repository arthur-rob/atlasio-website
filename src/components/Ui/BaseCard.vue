<template>
    <div
        class="base-card-wrapper"
        :class="variant === 'gradient' ? 'ui-gradient-border' : 'ui-border'"
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        variant?: 'default' | 'gradient'
    }>(),
    {
        variant: 'default',
    },
)
</script>

<style scoped lang="scss">
.base-card-wrapper {
    box-sizing: border-box;
    border-radius: var(--ui-radius-lg);
    --ui-border-width: 1px;
    color: var(--ui-text);
}
</style>
