import { describe, it, expect } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import BaseNavigation from '../BaseNavigation.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/editor', component: { template: '<div>Editor</div>' } },
    ],
})

describe('BaseNavigation', () => {
    it('renders properly', () => {
        const wrapper = mount(BaseNavigation, {
            global: {
                plugins: [router],
            },
        })
        expect(wrapper.get('#editor').text()).toContain('Editor')
        expect(wrapper.get('#home').text()).toContain('Home')
    })
})
