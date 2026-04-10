<template>
  <div class="chain-card-empty"
       :class="{ 'chain-card-empty--drag-over': isDragOver, 'chain-card-empty--drag-active': isChainBeingDragged }"
       @dragenter.prevent="handleDragEnter"
       @dragover.prevent="handleDragOver"
       @dragleave="handleDragLeave"
       @drop.prevent="handleDrop">
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
  ref, computed
} from 'vue';
import { useLayout } from '@/composables/useLayout';
import { useDragState } from '@/composables/useDragState';
import AddChainDialog from '@/components/parts/AddСhainDialog.vue';
import {
  PartType, type Bike, type CreatePartDto 
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
  onChainDrop: [chainId: string, chainCycleId: string, index: number];
}>();

const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSuccess, showError, withAjaxBar 
} = useLayout();

const { draggedPart } = useDragState();

const showAddChainDialog = ref(false);
const isDragOver = ref(false);
let dragEnterCounter = 0;

const isChainBeingDragged = computed(() =>
  draggedPart.value?.partType === PartType.Chain
);

const handleClickCard = () => {
  showAddChainDialog.value = true;
};

const handleDragEnter = () => {
  if (!isChainBeingDragged.value) return;
  dragEnterCounter++;
  isDragOver.value = true;
};

const handleDragOver = (event: DragEvent) => {
  if (!isChainBeingDragged.value) {
    event.dataTransfer && (event.dataTransfer.dropEffect = 'none');
    return;
  }
  event.dataTransfer && (event.dataTransfer.dropEffect = 'move');
};

const handleDragLeave = () => {
  dragEnterCounter--;
  if (dragEnterCounter <= 0) {
    dragEnterCounter = 0;
    isDragOver.value = false;
  }
};

const handleDrop = () => {
  isDragOver.value = false;
  dragEnterCounter = 0;

  if (!draggedPart.value || draggedPart.value.partType !== PartType.Chain) return;

  emit('onChainDrop', draggedPart.value.id, props.chainCycleId, props.index);
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
  border-radius: 1rem;
  padding: .5rem;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.chain-card-empty--drag-active {
  background-color: #b8e6c8;
  box-shadow: 0 0 0 2px rgba(33, 186, 69, 0.4);
}

.chain-card-empty--drag-over {
  background-color: #90d4a6;
  box-shadow: 0 0 0 3px var(--q-positive, #21ba45);
}

.chain-card-empty__border {
  height: 100%;
  border: 1px dashed #666;
  border-radius: 1rem;
  padding: .25rem;
  transition: border-color 0.2s ease;
}

.chain-card-empty--drag-active .chain-card-empty__border {
  border-color: var(--q-positive, #21ba45);
}

.chain-card-empty--drag-over .chain-card-empty__border {
  border-color: var(--q-positive, #21ba45);
  border-style: solid;
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
