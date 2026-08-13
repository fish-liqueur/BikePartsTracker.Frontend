<template>
  <div class="view-container">
    <div class="view-content">
      <MaintenanceTasksWidget
        all-works
        title="Works"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MaintenanceTasksWidget from '@/components/widgets/MaintenanceTasksWidget.vue';
</script>

<style scoped>
.view-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 320px;
}
</style>
