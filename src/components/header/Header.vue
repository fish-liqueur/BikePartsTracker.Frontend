<script setup lang="ts">
    import { useLayoutStore } from '@/stores/layoutStore';

    const layoutStore = useLayoutStore();
    const { drawerToggle } = layoutStore;
</script>

<template>
<q-header class="bg-primary text-white" height-hint="98">
  <q-toolbar class="max-width-1200">
    <q-toolbar-title>
      Home
    </q-toolbar-title>
    <q-avatar size="2.4em">
        <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
      </q-avatar>

    <q-btn dense flat round icon="menu" @click="drawerToggle" />
    <q-btn dense flat round icon="language" @click="drawerToggle" />
    <q-btn dense flat round icon="notifications" @click="drawerToggle" />
  </q-toolbar>
</q-header>
</template>