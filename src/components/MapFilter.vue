<template>
    <div class="map-filter bg-gray-200 p-[2px] rounded-md my-4 cursor-pointer" :class="{ 'base-gradient-bg': checked }">
        <div class="bg-white rounded py-2 px-1">
            <div class="flex items-center justify-between" @click="checked = !checked">
                <input
                    class="mx-2"
                    type="checkbox"
                    v-model="checked"
                    :id="label"
                    />
                <label :for="label" class="text-sm">{{ label }}</label>
            </div>
        </div>
  </div>
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
  get: () => props.layerKeys.every(id => props.modelValue.includes(id)),
  set: (val: boolean) => {
    let newValue = [...props.modelValue]
    if (val) {
      props.layerKeys.forEach(id => {
        if (!newValue.includes(id)) newValue.push(id)
      })
    } else {
      newValue = newValue.filter(id => !props.layerKeys.includes(id))
    }
    emit('update:modelValue', newValue)
  }
})
</script>