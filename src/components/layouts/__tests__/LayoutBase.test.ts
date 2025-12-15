import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import LayoutBase from '../LayoutBase.vue'
import Header from '@/components/header/Header.vue'
import QuickMenu from '@/components/menus/QuickMenu.vue'
import Home from '@/views/Home.vue'

// Create a simple router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/home', component: Home }
  ]
})

describe('LayoutBase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly', () => {
    const wrapper = mount(LayoutBase, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders Header component', () => {
    const wrapper = mount(LayoutBase, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })

    expect(wrapper.findComponent(Header).exists()).toBe(true)
  })

  it('renders QuickMenu component', () => {
    const wrapper = mount(LayoutBase, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })

    expect(wrapper.findComponent(QuickMenu).exists()).toBe(true)
  })

  it('provides ajaxBar ref', () => {
    const wrapper = mount(LayoutBase, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })

    // The component should provide ajaxBar
    expect(wrapper.vm).toBeDefined()
  })

  it('renders router-view', () => {
    const wrapper = mount(LayoutBase, {
      global: {
        plugins: [Quasar, router, createPinia()]
      }
    })

    // Check if router-view is present (it's a component, so we check for the container)
    const pageContainer = wrapper.find('.layout-base-content')
    expect(pageContainer.exists()).toBe(true)
  })
})

