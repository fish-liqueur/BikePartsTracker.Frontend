<script setup lang="ts">
import { computed, ref, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import type { QAjaxBar } from 'quasar';
import QuickMenu from '@/components/menus/QuickMenu.vue';
import Header from '@/components/header/Header.vue';

const router = useRouter();
const authStore = useAuthStore();
const route = useRoute();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const layoutStore = useLayoutStore();

// Provide ajax-bar ref for use in composables
const ajaxBarRef = ref<QAjaxBar | null>(null)
provide('ajaxBar', ajaxBarRef)
</script>

<template>
<q-layout view="hHh lpR fFf" class="layout-base">

<q-ajax-bar
  ref="ajaxBarRef"
  position="top"
  color="accent"
  size="10px"
  skip-hijack
/>

<q-notifications position="top" />

<q-drawer v-model="layoutStore.drawerOpen" side="right" overlay bordered>
  <!-- drawer content -->
</q-drawer>

<Header />

<q-page-container class="layout-base-content max-width-1200">
  <router-view />
</q-page-container>

<q-footer elevated class="bg-grey-8 text-white">
  <div class="max-width-1200">
    <QuickMenu />
  </div>
</q-footer>
</q-layout>
</template>

<style scoped>
:deep(.max-width-1200) {
  max-width: 1200px;
  margin: 0 auto;
}

.layout-base {
  display: flex;
  flex-direction: column;
}

:deep(.layout-base-content) {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>