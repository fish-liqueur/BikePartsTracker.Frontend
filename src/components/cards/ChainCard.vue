<template>
  <template v-if="part">
    <q-card 
      class="chain-card" 
      :class="{ 
        'chain-card--active bg-primary text-white' : isActive && part,
        'chain-card--draggable bg-secondary text-white' : !isActive && part,
        'chain-card--draggable bg-warning text-white' : !part 
      }">
      <div class="chain-card__index">
          {{ index + 1 }}
      </div>
      <h4 class="chain-card__name">{{ part.name }}</h4>
      <p class="chain-card__description">{{ part.description }}</p>
      <p class="chain-card__third-line" :style="thirdLineStyle">{{ thirdLineText }}</p>
      

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
    <!-- <div class="chain-card-absolute" >
      Active chain
    </div> -->
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
  <div class="chain-card__index">
          {{ index + 1 }}
        </div>
        <h4 class="chain-card__name">No chain selected!</h4>
        <p class="chain-card__description">Click to select a chain</p>
  </q-card>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';

import type { Bike, BikePart } from '@/types';

interface Props {
  part: BikePart | null;
  isActive: boolean;
  bikeContext: Bike;
  index: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  onAddChain: [];
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

const thirdLineText = computed(() => {
  return props.isActive ? 'Active chain' : `should install in ${kmsBeforeInstallation.value} km`;
});

const kmsBeforeInstallation = computed(() => {
  if (!props.bikeContext.chainCycleInterval) {
    return 0;
  }
  return props.bikeContext.chainCycleInterval * props.index;
});

const thirdLineStyle = computed(() => {
  return { 
    color: props.isActive ? 'var(--q-warning)' : '#fff',
    fontWeight: props.isActive ? 'bold' : 'normal',
  };
});
</script>

<style scoped lang="css">
.chain-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: .1rem .5rem;
  grid-template-areas: 
    "index name"
    "index description"
    "thirdline thirdline";
  padding: .5rem;
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

/* .chain-card-absolute {
  position: absolute;
  position-anchor: --chain-card-first;
  top: anchor(top);
  left: anchor(left);
  transform: translate(.5rem, -1.5rem);
  pointer-events: none;
  font-size: 1rem;
  line-height: 1;
  border: solid 1px var(--q-warning);
  border-radius: .25rem;
  background: white;
  padding: .25rem .5rem;
} */

.chain-card__index {
  grid-area: index;
  font-size: 2rem;
  line-height: 1;
  font-weight: 600;
}

.chain-card__name {
  grid-area: name;
  font-size: 1.4rem;
  line-height: 1.4;
}

.chain-card__description {
  grid-area: description;
  font-size: 0.8rem;
  margin-bottom: 0;
}

.chain-card__third-line {
  grid-area: thirdline;
  font-size: 0.8rem;
  margin-bottom: 0;
  text-align: center;
}
</style>

