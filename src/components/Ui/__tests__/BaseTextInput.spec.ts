import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTextInput from '../BaseTextInput.vue'
const GLOBAL_MOUNT_OPTIONS = {
    global: {
        provide: {
            registerField: () => {},
        },
    },
}
describe('BaseTextInput', () => {
    it('renders an input element', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: 'hello' },
            ...GLOBAL_MOUNT_OPTIONS,
        })
        expect(wrapper.find('input').exists()).toBe(true)
    })

    it('binds the value prop to the input', async () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: 'hello' },
            ...GLOBAL_MOUNT_OPTIONS,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('hello')
    })

    it('emits update:modelValue when input value changes', async () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '' },
            ...GLOBAL_MOUNT_OPTIONS,
        })
        const input = wrapper.find('input')
        await input.setValue('test')
        expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
        expect(wrapper.emitted()['update:modelValue']![0]).toEqual(['test'])
    })

    it('passes placeholder prop to input', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '', placeholder: 'Enter text' },
            ...GLOBAL_MOUNT_OPTIONS,
        })
        const input = wrapper.find('input')
        expect(input.attributes('placeholder')).toBe('Enter text')
    })

    it('disables input when disabled prop is true', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '', disabled: true },
            ...GLOBAL_MOUNT_OPTIONS,
        })
        const input = wrapper.find('input')
        expect(input.attributes('disabled')).toBeDefined()
    })
})
