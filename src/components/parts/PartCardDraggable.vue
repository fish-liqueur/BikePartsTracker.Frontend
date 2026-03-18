<template>
  <div
    class="part-card-draggable"
    :class="{ 'is-dragging': isDragging }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <PartCard
      :part="part"
      :current-bike-mileage="currentBikeMileage"
      @full-details="handleFullDetails"
      @rides-history="handleRidesHistory"
      @show-bike="handleShowBike"
      @remove-from-bike="handleRemoveFromBike"
      @put-on-other-bike="handlePutOnOtherBike"
      @pass-to-other-user="handlePassToOtherUser"
      @delete="handleDelete"
      @configure="handleConfigure"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PartCard from '@/components/cards/PartCard.vue';
import type { BikePart } from '@/types';

interface Props {
  part: BikePart;
  currentBikeMileage?: number;
  containerId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentBikeMileage: 0,
  containerId: ''
});

const emit = defineEmits<{
  dragStart: [part: BikePart, containerId: string];
  dragEnd: [];
  fullDetails: [partId: string];
  ridesHistory: [partId: string];
  showBike: [bikeId: string];
  removeFromBike: [partId: string];
  putOnOtherBike: [partId: string];
  passToOtherUser: [partId: string];
  delete: [partId: string];
  configure: [partId: string];
}>();

const isDragging = ref(false);

const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return;
  
  isDragging.value = true;
  
  // Set drag data
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/json', JSON.stringify({
    partId: props.part.id,
    containerId: props.containerId,
    part: props.part
  }));
  
  // Set drag image (optional - use a custom ghost image)
  // For now, browser will use default
  
  emit(
    'dragStart', props.part, props.containerId
  );
};

const handleDragEnd = () => {
  isDragging.value = false;
  emit('dragEnd');
};

// Pass through all PartCard events
const handleFullDetails = (partId: string) => {
  emit('fullDetails', partId);
};

const handleRidesHistory = (partId: string) => {
  emit('ridesHistory', partId);
};

const handleShowBike = (bikeId: string) => {
  emit('showBike', bikeId);
};

const handleRemoveFromBike = (partId: string) => {
  emit('removeFromBike', partId);
};

const handlePutOnOtherBike = (partId: string) => {
  emit('putOnOtherBike', partId);
};

const handlePassToOtherUser = (partId: string) => {
  emit('passToOtherUser', partId);
};

const handleDelete = (partId: string) => {
  emit('delete', partId);
};

const handleConfigure = (partId: string) => {
  emit('configure', partId);
};
</script>

<style scoped lang="css">
.part-card-draggable {
  cursor: move;
  transition: opacity 0.2s ease;
}

.part-card-draggable.is-dragging {
  opacity: 0.5;
}

.part-card-draggable:hover {
  opacity: 0.9;
}
</style>

