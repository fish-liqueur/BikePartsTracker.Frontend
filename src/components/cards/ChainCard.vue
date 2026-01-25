<template>
  <template v-if="part">
    <q-card 
      class="chain-card" 
      :class="{ 
        'chain-card--active bg-primary text-white' : isActive && part,
        'chain-card--draggable bg-secondary text-white' : !isActive && part,
        'chain-card--draggable bg-warning text-white' : !part 
      }"
     
    >

      <q-card-section>
        <h4 class="chain-card__name">{{ part.name }}</h4>
        <p class="chain-card__description">{{ part.description }}</p>
      </q-card-section>

      <q-menu touch-position>
        <q-list>
          <q-item clickable v-close-popup @click="handleFullDetails">
            <q-item-section avatar>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>To detailed page</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="handleRemoveFromCycle">
            <q-item-section avatar>
              <q-icon name="remove_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Do not use on this bike</q-item-label>
              <q-item-label caption>{{ props.bikeContext.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-card>
    <div class="chain-card-absolute" >
      Active chain!
    </div>
  </template>
  <q-card 
    v-else
    class="chain-card" 
    :class="{ 
      'bg-primary text-white' : isActive && part,
      'bg-secondary text-white' : !isActive && part,
      'bg-warning text-white' : !part 
    }"
    @click="handleClickCard"
  >
    <q-card-section>
      <div class="chain-card__empty">
        <h4 class="chain-card__name">No chain selected!</h4>
        <p class="chain-card__description">Click to select a chain</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

import type { Bike, BikePart } from '@/types';

interface Props {
  part: BikePart | null;
  isActive: boolean;
  bikeContext: Bike;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  selectChain: [partId: string | null];
  fullDetails: [partId: string];
  removeFromCycle: [partId: string];
}>();

const showMenu = ref(false);

const handleClickCard = () => {
  if (props.part) {
    showMenu.value = !showMenu.value;
    console.log('handleClickCard 22', showMenu.value);
  } else {
    console.log('No chain selected');
  }
};

const handleFullDetails = () => {
  emit('fullDetails', props.part?.id || '');
  // router.push(`/parts/${props.part?.id}`);
};

const handleRemoveFromCycle = () => {
  emit('removeFromCycle', props.part?.id || '');
};
</script>

<style scoped lang="css">
.chain-card {
  transition: box-shadow 0.2s ease;
}

.chain-card:hover {
  cursor: grab;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chain-card:active {
  cursor: grabbing;
}

.chain-card:first-child {
  anchor-name: --chain-card-first;
}

.chain-card-absolute {
  position: absolute;
  position-anchor: --chain-card-first;
  top: anchor(top);
  left: anchor(center);
  pointer-events: none;
}

.chain-card__name {
  font-size: 1.4rem;
  line-height: 1.4;
}

.chain-card__description {
  font-size: 0.8rem;
  margin-bottom: 0;
}
</style>

