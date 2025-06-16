import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../BaseButton.vue'
describe('BaseButton', () => {
    it('renders slot content', () => {
        const wrapper = mount(BaseButton, {
            slots: {
                default: 'Click me',
            },
        })
        expect(wrapper.text()).toContain('Click me')
    })

    it('renders prepend and append content', () => {
        const wrapper = mount(BaseButton, {
            props: {
                prependIcon: 'arrow_left',
                appendIcon: 'arrow_right',
            },
            slots: {
                default: 'Click me',
            },
        })
        expect(wrapper.text()).toContain('arrow_left')
        expect(wrapper.text()).toContain('arrow_right')
    })

    it('renders loading over append icon', () => {
        const wrapper = mount(BaseButton, {
            props: {
                loading: true,
                appendIcon: 'arrow_right',
            },
            slots: {
                default: 'Click me',
            },
        })
        expect(wrapper.text()).not.toContain('arrow_right')
        expect(wrapper.text()).toContain('progress_activity')
    })
    it('renders disabled', () => {
        const wrapper = mount(BaseButton, {
            props: {
                disabled: true,
            },
            slots: {
                default: 'Click me',
            },
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('disabled')
    })
})
