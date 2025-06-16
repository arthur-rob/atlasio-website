<template>
    <form @submit.prevent>
        <slot />
    </form>
</template>

<script setup lang="ts">
import { reactive, provide, defineExpose } from 'vue'

type Field = {
    validate: () => boolean
}

const fields = reactive<Record<string, Field>>({})

const registerField = (id: string, validateFn: () => boolean) => {
    fields[id] = { validate: validateFn }
}

const validate = (): true | string[] => {
    const invalidFields = Object.entries(fields)
        .filter(([_, field]) => !field.validate())
        .map(([id]) => id)

    return invalidFields.length === 0 ? true : invalidFields
}

provide('registerField', registerField)
defineExpose({ validate })
</script>

<style scoped lang="scss"></style>
