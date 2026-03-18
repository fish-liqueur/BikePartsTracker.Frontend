// Import layers declaration first (must be before any other CSS)
import './assets/layers.css';

// Import reset styles
import './assets/reset.css';

// Import icon libraries within icons layer
import './assets/icons.css';

// Import Quasar CSS within quasar layer
import './assets/quasar-layer.sass';

// Import custom layers
import './assets/components.css';
import './assets/utilities.css';
import './assets/overrides.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import {
  Quasar, Notify, Loading, Dialog 
} from 'quasar';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/authStore';
import { useStravaStore } from './stores/stravaStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Quasar, {
  plugins: {
    Notify,
    Loading,
    Dialog,
  },
});

// Initialize stores
const authStore = useAuthStore();
authStore.initializeAuth();

const stravaStore = useStravaStore();
stravaStore.initializeStrava();

app.mount('#app');
