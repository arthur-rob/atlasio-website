<template>
    <div
        class="divider-container"
        :class="{ horizontal: orientation === 'horizontal', vertical: orientation === 'vertical' }"
    ></div>
</template>
<script lang="ts" setup>
interface Props {
    orientation?: 'horizontal' | 'vertical'
}

withDefaults(defineProps<Props>(), {
    orientation: 'horizontal',
})
</script>
<style scoped lang="scss">
.divider-container {
    background-color: var(--color-gray-200);
    &.horizontal {
        width: 100%;
        height: 1px;
    }
    &.vertical {
        width: 1px;
        height: 100%;
    }
}
</style>
