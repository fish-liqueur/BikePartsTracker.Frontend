<script setup lang="ts">
    import { useRouter } from 'vue-router';
    import { useLayoutStore } from '@/stores/layoutStore';
    import { useAuthStore } from '@/stores/authStore';

    const layoutStore = useLayoutStore();
    const { drawerToggle } = layoutStore;

    const router = useRouter();
    const authStore = useAuthStore(); 

    const logout = () => {
      authStore.logout();
      router.push('/login')
    }
</script>

<template>
<q-header class="bg-primary text-white" height-hint="98">
  <q-toolbar class="max-width-1200">
    <q-toolbar-title>
      Home
    </q-toolbar-title>
    <q-btn-dropdown flat class="dropdown-no-icon">
      <template v-slot:label>
        <q-avatar size="2.4em">
          <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
        </q-avatar>
      </template>
      <q-list>
        <q-item clickable v-close-popup >
          <q-item-section>
            <q-btn color="secondary" 
              icon="settings" 
              label="User settings" 
              to="settings"
              size="l" 
              flat />
          </q-item-section>
        </q-item>
        <q-item clickable>
          <q-item-section>
            <q-btn color="negative" 
              icon="logout" 
              label="Log out" 
              size="l" 
              @click="logout"
              />
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>


    <q-btn dense flat round icon="menu" @click="drawerToggle" />
    <q-btn dense flat round icon="language" @click="drawerToggle" />
    <q-btn dense flat round icon="notifications" @click="drawerToggle" />
  </q-toolbar>
</q-header>
</template>

<style lang="css" scoped>
  :deep(.dropdown-no-icon.q-btn-dropdown .q-icon) {
    display: none;
  }
</style>