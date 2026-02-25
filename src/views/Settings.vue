<template>
  <div class="view-container">
    <StravaWidget />
    <UserSettingsWidget />
  </div>
</template>

<script setup lang="ts">
import StravaWidget from '@/components/stravaWidget/StravaWidget.vue';
import UserSettingsWidget from '@/components/settings/UserSettingsWidget.vue';
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
  min-height: 100%;
  background-color: #f8fafc;
  padding: 32px;
}
</style>

