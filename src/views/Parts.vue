<template>
  <div class="view-container">
    <PartsWidget
      v-model:view-mode="viewMode"
      title="Parts Management"
      @parts-changed="handlePartsChanged"
      @view-mode-changed="handleViewModeChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePartsStore } from '@/stores/partsStore';
import PartsWidget from '@/components/parts/PartsWidget.vue';

const partsStore = usePartsStore();
const viewMode = ref<'cards' | 'table'>('cards');

const handlePartsChanged = (event: { type: string; partId: string; data?: any }) => {
  console.log('Parts changed:', event);
  // Additional handling if needed
};

const handleViewModeChanged = (mode: 'cards' | 'table') => {
  console.log('View mode changed to:', mode);
  // Additional handling if needed
};

onMounted(async () => {
  // Fetch parts when component mounts
  try {
    await partsStore.fetchParts();
  } catch (error) {
    console.error('Failed to fetch parts:', error);
  }
});
</script>

<style scoped>
.view-container {
  min-height: 100%;
  background-color: #f8fafc;
  padding: 32px;
}

@media (max-width: 768px) {
  .view-container {
    padding: 20px;
  }
}
</style>

