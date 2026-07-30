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

  // Initialize stores
  const authStore = useAuthStore();
  authStore.initializeAuth();
  authStore.setupCrossTabSignOut();

  const stravaStore = useStravaStore();
  stravaStore.initializeStrava();

  // Resolve and apply the language BEFORE mount so there is no English flash for a known locale
  // (ADR 0006 §E4). Settings live behind auth, so startup uses cache/navigator; once the authenticated
  // session loads its UserSettings.Language, useLocale reconciles (unless the rider already switched).
  const startupLocale = resolveLocale({
    cachedLocale: storageService.get('locale'),
    navigatorLanguages: typeof navigator !== 'undefined' ? navigator.languages : null,
  });
  await useLocale().setLocale(startupLocale, { persist: false });

  app.mount('#app');
}

init();
