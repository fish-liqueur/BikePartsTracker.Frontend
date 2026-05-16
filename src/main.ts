import './assets/layers.css';
import './assets/tailwind.css';
import './assets/main.scss';

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
