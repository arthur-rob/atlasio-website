import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTextInput from '../Ui/BaseTextInput.vue'

describe('BaseTextInput', () => {
    it('renders an input element', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: 'hello' },
        })
        expect(wrapper.find('input').exists()).toBe(true)
    })

    it('binds the value prop to the input', async () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: 'hello' },
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('hello')
    })

    it('emits update:modelValue when input value changes', async () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '' },
        })
        const input = wrapper.find('input')
        await input.setValue('test')
        expect(wrapper.emitted()['update:modelValue']).toBeTruthy()
        expect(wrapper.emitted()['update:modelValue']![0]).toEqual(['test'])
    })

    it('passes placeholder prop to input', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '', placeholder: 'Enter text' },
        })
        const input = wrapper.find('input')
        expect(input.attributes('placeholder')).toBe('Enter text')
    })

    it('disables input when disabled prop is true', () => {
        const wrapper = mount(BaseTextInput, {
            props: { modelValue: '', disabled: true },
        })
        const input = wrapper.find('input')
        expect(input.attributes('disabled')).toBeDefined()
    })
})
