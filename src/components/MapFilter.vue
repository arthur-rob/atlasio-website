<template>
    <label
        class="map-filter flex items-center gap-3 my-2 cursor-pointer"
        :class="checked ? 'ui-gradient-border' : 'ui-border'"
    >
        <input class="map-filter-checkbox" type="checkbox" v-model="checked" />
        <span class="map-filter-label">{{ label }}</span>
    </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    label: string
    layerKeys: string[]
    modelValue: string[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
}>()

const checked = computed({
    get: () => props.layerKeys.every((id) => props.modelValue.includes(id)),
    set: (val: boolean) => {
        let newValue = [...props.modelValue]
        if (val) {
            props.layerKeys.forEach((id) => {
                if (!newValue.includes(id)) newValue.push(id)
            })
        } else {
            newValue = newValue.filter((id) => !props.layerKeys.includes(id))
        }
        emit('update:modelValue', newValue)
    },
})
</script>
<style scoped>
.map-filter {
    min-height: var(--ui-height);
    padding: 0.5rem 0.75rem;
    border-radius: var(--ui-radius);
    color: var(--ui-text);
    user-select: none;
}
.map-filter:hover {
    --ui-surface: var(--ui-surface-hover);
    --ui-border-color: var(--ui-border-color-hover);
}
.map-filter:has(:focus-visible) {
    box-shadow: var(--ui-focus-ring);
}
.map-filter-checkbox {
    width: 1rem;
    height: 1rem;
    accent-color: var(--ui-accent);
    cursor: pointer;
}
.map-filter-label {
    font-size: var(--ui-font-size);
    line-height: 1.35;
}
</style>
