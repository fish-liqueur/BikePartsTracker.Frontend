<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLayoutStore } from '@/stores/layoutStore';
import { useAuthStore } from '@/stores/authStore';
import LanguageSwitcher from '@/components/header/LanguageSwitcher.vue';

const layoutStore = useLayoutStore();
const { drawerToggle } = layoutStore;

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

// Route names are stable identifiers (codes); the visible title is looked up as nav.<routeName>
// (ADR 0006 §E4). document.title is kept in sync the same way.
const pageTitle = computed(() => {
  const name = route.name ? String(route.name) : '';
  const key = `nav.${name}`;
  return name && t(key) !== key ? t(key) : name;
});

watch(
  pageTitle, (title) => {
    if (typeof document !== 'undefined') {
      document.title = title ? `${title} · ${t('common.appName')}` : t('common.appName');
    }
  }, { immediate: true }
);

const userInitials = computed(() => {
  const name = authStore.currentUser?.name;
  if (!name) return '😺';
      
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <q-header class="bg-primary text-white" height-hint="98">
    <q-toolbar class="max-width-1200">
      <q-btn
        v-if="route.name !== 'home'"
        flat
        round
        size="1.8rem"
        icon="home"
        to="/home"
        class="q-mr-sm"
      />
      <q-toolbar-title class="header">
        <h1>{{ pageTitle }}</h1>
      </q-toolbar-title>
      <!-- Userpic and its menu -->
      <q-btn-dropdown flat
                      round
                      class="dropdown-no-icon">
        <template v-slot:label>
          <q-btn size="1.8rem"
                 flat
                 round
                 icon="language">
            <q-avatar size="2.9rem" color="accent">
              {{ userInitials }}
            </q-avatar>
          </q-btn>
        </template>
        <q-list>
          <q-item v-if="authStore.currentUser"
                  clickable
                  v-close-popup >
            <q-item-section>
              <q-btn color="secondary" 
                     icon="settings" 
                     :label="t('common.userSettings')" 
                     to="/settings"
                     size="l" 
                     flat />
            </q-item-section>
          </q-item>
          <q-item v-if="authStore.currentUser" clickable>
            <q-item-section>
              <q-btn color="negative" 
                     icon="logout" 
                     :label="t('common.logout')" 
                     size="l" 
                     @click="logout"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <LanguageSwitcher />
      <q-btn size="1.8rem"
             flat
             round
             icon="notifications"
             @click="drawerToggle" />
    </q-toolbar>
  </q-header>
</template>

<style lang="css" scoped>
.header {
  text-transform: uppercase;
}

  :deep(.dropdown-no-icon.q-btn-dropdown .q-icon) {
    display: none;
  }

  :deep(h1) {
    font-size: 4rem;
    line-height: 1;
  }
</style>