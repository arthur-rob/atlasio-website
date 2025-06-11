<template>
    <form>
        <slot />
        <button type="submit" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
</template>

<script setup lang="ts">
import { reactive, provide } from 'vue'

type Field = {
    validate: () => boolean
}

const fields = reactive<Record<string, Field>>({})

const registerField = (id: string, validateFn: () => boolean) => {
  fields[id] = { validate: validateFn }
}


const validateForm = (): true | string[] => {
    const invalidFields = Object.entries(fields)
        .filter(([_, field]) => !field.validate())
        .map(([id]) => id)

    return invalidFields.length === 0 ? true : invalidFields
}

provide('registerField', registerField)
provide('validate', validateForm)
</script>

<style scoped lang="scss">

</style>
