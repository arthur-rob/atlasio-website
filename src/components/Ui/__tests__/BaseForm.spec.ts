import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import BaseForm from '@/components/Ui/BaseForm.vue'
import BaseInput from '@/components/Ui/BaseTextInput.vue'

describe('Form validation', () => {
    it('returns empty array when inputs are valid', async () => {
        const wrapper = mount(
            defineComponent({
                components: { BaseForm, BaseInput },
                setup() {
                    const model = ref({ username: 'aRthur', email: 'arthur@atlasio.app' })
                    const validateFormRef = ref<(() => true | string[]) | undefined>(undefined)
                    return {
                        model,
                        validateFormRef,
                    }
                },
                template: `
                    <BaseForm ref="validateFormRef">
                        <BaseInput v-model="model.email" :rules="[(v) => /.+@.+/.test(v) || 'Invalid email']" />
                        <BaseInput v-model="model.username" :rules="[(v) => !!v || 'Required']" />
                    </BaseForm>
                `,
            }),
        )

        await nextTick()

        const result = wrapper.vm.validateFormRef?.validate()
        expect(Array.isArray(result)).toBe(false)
        expect(result).toBe(true)
    })

    it('returns invalid field ids when inputs are invalid', async () => {
        const wrapper = mount(
            defineComponent({
                components: { BaseForm, BaseInput },
                setup() {
                    const model = ref({ username: '', email: 'not-an-email' })
                    const validateFormRef = ref<(() => true | string[]) | undefined>(undefined)
                    return {
                        model,
                        validateFormRef,
                    }
                },
                template: `
                    <BaseForm ref="validateFormRef">
                        <BaseInput v-model="model.username" :rules="[(v) => !!v || 'Required']" />
                        <BaseInput v-model="model.email" :rules="[(v) => /.+@.+/.test(v) || 'Invalid email']" />
                    </BaseForm>
                `,
            }),
        )

        await nextTick()

        const result = wrapper.vm.validateFormRef.validate()
        expect(Array.isArray(result)).toBe(true)
        expect(result.length).toBe(2)
    })
})
