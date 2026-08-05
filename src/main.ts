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
import { i18n } from './i18n';
import { resolveLocale } from './i18n/resolveLocale';
import { useLocale } from './composables/useLocale';
import { storageService } from './services/storage';
import { useAuthStore } from './stores/authStore';
import { useStravaStore } from './stores/stravaStore';
import { realtimeService } from './services/realtimeService';

async function init() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n);
  app.use(router);
  app.use(Quasar, {
    plugins: {
      Notify,
      Loading,
      Dialog,
    },
  });

  const authStore = useAuthStore();
  authStore.initializeAuth();
  authStore.setupCrossTabSignOut();

  const stravaStore = useStravaStore();
  stravaStore.initializeStrava();

  // ADR-0001: SignalR while authenticated (quiet dirty-marking).
  if (authStore.isAuthenticated) {
    void realtimeService.connect();
  }

  const startupLocale = resolveLocale({
    cachedLocale: storageService.get('locale'),
    navigatorLanguages: typeof navigator !== 'undefined' ? navigator.languages : null,
  });
  await useLocale().setLocale(startupLocale, { persist: false });

  app.mount('#app');
}

init();
