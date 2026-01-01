<template>
  <div
    class="parts-drag-container"
    :class="{
      'is-drag-over': isDragOver,
      'is-empty': parts.length === 0,
    }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Container Header -->
    <div v-if="title" class="container-header">
      <h3 class="container-title">{{ title }}</h3>
      <q-badge v-if="showCount" color="primary" :label="parts.length" />
    </div>

    <!-- Empty State -->
    <div v-if="parts.length === 0" class="empty-state">
      <q-icon name="inventory_2" size="48px" color="grey-5" />
      <p class="empty-text">No parts in this container</p>
      <p class="empty-hint">Drag and drop parts here</p>
    </div>

    <!-- Parts Grid -->
    <div v-else class="parts-grid">
      <PartCardDraggable
        v-for="part in parts"
        :key="part.id"
        :part="part"
        :current-bike-mileage="currentBikeMileage"
        :container-id="containerId"
        @drag-start="handleCardDragStart"
        @drag-end="handleCardDragEnd"
        @full-details="$emit('fullDetails', $event)"
        @rides-history="$emit('ridesHistory', $event)"
        @show-bike="$emit('showBike', $event)"
        @remove-from-bike="$emit('removeFromBike', $event)"
        @put-on-other-bike="$emit('putOnOtherBike', $event)"
        @pass-to-other-user="$emit('passToOtherUser', $event)"
        @delete="$emit('delete', $event)"
        @configure="$emit('configure', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PartCardDraggable from './PartCardDraggable.vue';
import type { BikePart } from '@/types';

interface Props {
  parts: BikePart[];
  containerId: string;
  title?: string;
  showCount?: boolean;
  currentBikeMileage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showCount: true,
  currentBikeMileage: 0
});

const emit = defineEmits<{
  partDropped: [partId: string, sourceContainerId: string, targetContainerId: string];
  partMoved: [partId: string, sourceContainerId: string, targetContainerId: string];
  fullDetails: [partId: string];
  ridesHistory: [partId: string];
  showBike: [bikeId: string];
  removeFromBike: [partId: string];
  putOnOtherBike: [partId: string];
  passToOtherUser: [partId: string];
  delete: [partId: string];
  configure: [partId: string];
}>();

const isDragOver = ref(false);
const draggedPartId = ref<string | null>(null);
const draggedSourceContainerId = ref<string | null>(null);

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  // Only set dragOver to false if we're leaving the container itself
  const target = event.target as HTMLElement;
  const container = event.currentTarget as HTMLElement;
  
  if (!container.contains(target)) {
    isDragOver.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  isDragOver.value = false;
  
  if (!event.dataTransfer) return;
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('application/json'));
    const partId = data.partId;
    const sourceContainerId = data.containerId;
    
    // Only emit if dropping from a different container
    if (sourceContainerId !== props.containerId) {
      emit('partDropped', partId, sourceContainerId, props.containerId);
      emit('partMoved', partId, sourceContainerId, props.containerId);
    }
  } catch (error) {
    console.error('Failed to parse drag data:', error);
  }
};

const handleCardDragStart = (part: BikePart, containerId: string) => {
  draggedPartId.value = part.id;
  draggedSourceContainerId.value = containerId;
};

const handleCardDragEnd = () => {
  draggedPartId.value = null;
  draggedSourceContainerId.value = null;
  isDragOver.value = false;
};
</script>

<style scoped lang="css">
.parts-drag-container {
  /* flex: 1 1 auto; */
  min-height: 200px;
  padding: 16px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.parts-drag-container.is-drag-over {
  border-color: #4299e1;
  background-color: #ebf8ff;
  border-style: solid;
}

.parts-drag-container.is-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
}

.container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.container-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.empty-text {
  margin: 16px 0 8px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
}

.empty-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #718096;
}

.parts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .parts-grid {
    grid-template-columns: 1fr;
  }
  
  .parts-drag-container {
    padding: 12px;
  }
}
</style>

