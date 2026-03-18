<template>
  <div class="chain-card-empty">
    <div class="chain-card-empty__border">
      <div class="chain-card-empty__info chain-card" @click="handleClickCard">
        <div class="chain-card__index">
          {{ index + 1 }}
        </div>
        <h4 class="chain-card__name">No chain selected!</h4>
        <p class="chain-card__description">Click or drag a chain from the list</p>
      </div>
    </div>
    <AddChainDialog v-model="showAddChainDialog"
                    :bike-context="bikeContext"
                    :index="props.index"
                    :chainCycleId="props.chainCycleId"
                    @select="handleSelectChain"
                    @create="handleCreateChain" />
  </div>
</template>

<script setup lang="ts">
import {
  ref
} from 'vue';
// import { usePartsStore } from '@/stores/partsStore';
import { useLayout } from '@/composables/useLayout';
import AddChainDialog from '@/components/parts/AddСhainDialog.vue';
import type {
  Bike, CreatePartDto 
} from '@/types';

interface Props {
  bikeContext: Bike;
  index: number;
  chainCycleId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  onSelectChain: [chainId: string, chainCycleId: string, index: number];
  onCreateChain: [chain: CreatePartDto, chainCycleId: string, index: number];
}>();

// const partsStore = usePartsStore();
const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSuccess, showError, withAjaxBar 
} = useLayout();

const showAddChainDialog = ref(false);

const handleClickCard = () => {
  showAddChainDialog.value = true;
};

const handleCreateChain = async (chain: CreatePartDto) => {
  emit(
    'onCreateChain', chain, props.chainCycleId, props.index
  );
};

const handleSelectChain = async (chainId: string) => {
  emit(
    'onSelectChain', chainId, props.chainCycleId, props.index
  );
};
</script>

<style scoped lang="css">
.chain-card-empty {
  background-color: #ccc;
  color: #555;
  border-radius: 1.25rem;
  padding: .5rem;
}

.chain-card-empty__border {
  border: 1px dashed #666;
  border-radius: 1rem;
  padding: .25rem;
}

.chain-card-empty__info {
  flex: 1 1 50%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .5rem;
  grid-template-areas:
    "index name"
    "description description";
  padding: .5rem;
  /* transition: box-shadow 0.2s ease; */
}

/* .chain-card:hover {
  cursor: grab;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
} */



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
  text-align: end;
  font-size: 1.4rem;
  line-height: 1.4;
}

.chain-card__description {
  grid-area: description;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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
