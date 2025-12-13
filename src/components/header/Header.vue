<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { useLayoutStore } from '@/stores/layoutStore';
    import { useAuthStore } from '@/stores/authStore';

    const layoutStore = useLayoutStore();
    const { drawerToggle } = layoutStore;

    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore(); 

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
      router.push('/login')
    }
</script>

<template>
<q-header class="bg-primary text-white" height-hint="98">
  <q-toolbar class="max-width-1200">
    <q-btn
      v-if="route.name !== 'home'"
      flat
      round
      icon="home"
      to="/home"
      class="q-mr-sm"
    />
    <q-toolbar-title class="header">
      {{ route.name }}
    </q-toolbar-title>
    <!-- Userpic and its menu -->
    <q-btn-dropdown flat round class="dropdown-no-icon">
      <template v-slot:label>
        <q-avatar size="2.4em" color="accent">
          {{ userInitials }}
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
    <q-btn dense flat round icon="language" @click="drawerToggle" />
    <q-btn dense flat round icon="notifications" @click="drawerToggle" />
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
</style>