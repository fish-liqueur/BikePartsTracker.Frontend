// Import layers declaration first (must be before any other CSS)
import './assets/layers.css'

// Import reset styles
import './assets/reset.css'

// Import icon libraries (before Quasar layer)
import '@quasar/extras/material-icons/material-icons.css'
// Uncomment if you need FontAwesome icons:
// import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'

// Import Quasar CSS within quasar layer
import './assets/quasar-layer.sass'

// Import custom layers
import './assets/components.css'
import './assets/utilities.css'
import './assets/overrides.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Loading } from 'quasar'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Quasar, {
  plugins: {
    Notify,
    Loading,
  },
})

// Initialize auth store
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
