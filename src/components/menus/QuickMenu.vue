<template>
<q-btn-group spread>
    <q-btn v-for="(item, index) in menuItems" 
    :key="index" 
    :color="route.path === item.path ? 'primary' : 'default'" 
    :icon="item.icon" 
    :label="item.label" 
    :to="item.path"
    size="2.5rem"
    class="quick-menu-button" />
  </q-btn-group>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();

const navigateTo = (path: string) => {
    router.push(path);
}

const menuItems = ref([
    {
        label: 'Bikes',
        icon: 'pedal_bike',
        path: '/bikes'
    },
    {
        label: 'Parts',
        icon: 'hardware',
        path: '/parts'
    },
    {
        label: 'Rides',
        icon: 'toc',
        path: '/rides'
    },
    {
        label: 'Works',
        icon: 'calendar_today',
        path: '/works'
    }
]);
</script>

<style lang="css" scoped>
    .quick-menu-button {
        font-weight: 300;
    }
</style>