<template>
  <div class="parts-drag-container"
       :class="{
         'is-empty': localParts.length === 0,
       }"
       :data-container-id="containerId">

    <!-- Container Header -->
    <div v-if="title" class="container-header">
      <h3 class="container-title">{{ title }}</h3>
      <q-badge v-if="showCount"
               color="primary"
               :label="localParts.length" />
    </div>

    <!-- Empty State -->
    <div v-if="localParts.length === 0" class="empty-state">
      <q-icon name="inventory_2"
              size="48px"
              color="grey-5" />
      <p class="empty-text">{{ emptyText[0] }}</p>
      <p class="empty-hint">{{ emptyText[1] }}</p>
    </div>

    <!-- Parts Grid with Draggable -->
    <VueDraggable v-model="localParts"
                  :group="{ name: 'parts', pull: true, put: true }"
                  :animation="200"
                  :force-fallback="false"
                  :fallback-tolerance="5"
                  item-key="id"
                  class="parts-grid"
                  @start="handleDragStart"
                  @end="handleDragEnd"
                  @add="handleDragAdd">

      <PartCard v-for="element in localParts"
                :key="element.id"
                class="draggable-card"
                :container-id="containerId"
                :part="element"
                :current-bike-mileage="currentBikeMileage"
                :bike-context="bikeContext"
                @full-details="$emit('fullDetails', $event)"
                @rides-history="$emit('ridesHistory', $event)"
                @show-bike="$emit('showBike', $event)"
                @remove-from-bike="$emit('removeFromBike', $event)"
                @put-on-other-bike="$emit('putOnOtherBike', $event)"
                @pass-to-other-user="$emit('passToOtherUser', $event)"
                @delete="$emit('delete', $event)"
                @configure="$emit('configure', $event)" />
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { SortableEvent } from 'vue-draggable-plus';
import PartCard from '@/components/cards/PartCard.vue';
import { useDragState } from '@/composables/useDragState';
import type { Bike, BikePart } from '@/types';

interface Props {
  parts: BikePart[];
  containerId: string;
  title?: string;
  showCount?: boolean;
  currentBikeMileage?: number;
  emptyText?: [string, string];
  bikeContext?: Bike | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showCount: true,
  currentBikeMileage: 0,
  emptyText: () => ['No parts in this container', 'Click ADD PART button to add one'],
  bikeContext: null
});

const emit = defineEmits<{
  partDropped: [partId: string, sourceContainerId: string, targetContainerId: string, options: {
    event: SortableEvent;
    part: BikePart;
    newIndex: number;
    removeFromTarget: () => void;
  }];
  partMoved: [partId: string, sourceContainerId: string, targetContainerId: string];
  fullDetails: [partId: string];
  ridesHistory: [partId: string];
  showBike: [bikeId: string];
  removeFromBike: [partId: string];
  putOnOtherBike: [partId: string];
  passToOtherUser: [partId: string];
  delete: [partId: string];
  configure: [partId: string];
  addToContainer: [partId: string, containerId: string, part: BikePart];
}>();

const { setDraggedPart } = useDragState();

// Local copy of parts for v-model
const localParts = ref<BikePart[]>([...props.parts]);


// Sync localParts with props.parts when they change externally
// Use a more robust comparison to ensure we sync properly
watch(
  () => props.parts, (newParts) => {
  // Create a new array to ensure reactivity
    const newPartsIds = newParts.map(p => p.id).sort().join(',');
    const currentPartsIds = localParts.value.map(p => p.id).sort().join(',');

    if (newPartsIds !== currentPartsIds) {
      localParts.value = [...newParts];
    }
  }, { deep: true, immediate: true }
);

const handleDragStart = (event: SortableEvent) => {
  const oldIndex = event.oldIndex;
  if (oldIndex !== undefined && oldIndex >= 0 && oldIndex < localParts.value.length) {
    setDraggedPart(localParts.value[oldIndex]);
  }
};

const handleDragEnd = (event: SortableEvent) => {
  setDraggedPart(null);
  if (event.from === event.to) {
    return;
  }
};

const handleDragAdd = (event: SortableEvent) => {
  // This fires when an item is added to this container from another
  // The drop has already happened at this point
  // We need to get the part and source container info
  console.log('! handleDragAdd event', event);
  // Get the part from the event - it should be in the newIndex position

  const newIndex = event.newIndex;
  let sourceContainerId = '';

  if (newIndex === undefined || newIndex < 0 || newIndex >= localParts.value.length) {
    return;
  }

  const part = localParts.value[newIndex];
  if (!part || !part.id) {
    return;
  }

  // Try to get source container ID from the dragged element
  const draggedElement = event.item;


  if (draggedElement?.dataset?.containerId) {
    sourceContainerId = draggedElement.dataset.containerId;
  }

  // Emit event to parent to show dialog
  // Parent will handle cancellation by removing from this container and adding to source
  emit(
    'partDropped', part.id, sourceContainerId, props.containerId, {
      event,
      part,
      newIndex,
      removeFromTarget: () => {
      // Remove the part from this container
        const index = localParts.value.findIndex(p => p.id === part.id);
        if (index !== -1) {
          localParts.value.splice(index, 1);
        }
      }
    }
  );
};
</script>

<style scoped lang="css">
.parts-drag-container {
  position: relative;
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  pointer-events: none;
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

.parts-grid-wrapper {
  flex: 1 1 auto;
  overflow-y: auto;
  width: 100%;
  min-height: 100px;
}

.parts-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: max-content;
  gap: 16px;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  min-height: 100px;
  padding: .4rem;
}

.parts-grid-item {
  /* Ensure grid items are properly sized */
  min-width: 0;
}

/* Draggable item styles */
.parts-grid :deep(.sortable-ghost) {
  opacity: 0.4;
  background: #cbd5e0;
}

.parts-grid :deep(.sortable-drag) {
  opacity: 0.8;
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
