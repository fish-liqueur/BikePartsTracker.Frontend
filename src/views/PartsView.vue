<template>
  <div class="view-container">
    <PartsWidget
      title="Parts Management"
      show-installed-to-other-bikes
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePartsStore } from '@/stores/partsStore';
import PartsWidget from '@/components/widgets/PartsWidget.vue';

const partsStore = usePartsStore();

onMounted(async () => {
  try {
    await partsStore.ensureParts();
  } catch (error) {
    console.error('Failed to fetch parts:', error);
  }
});
</script>

