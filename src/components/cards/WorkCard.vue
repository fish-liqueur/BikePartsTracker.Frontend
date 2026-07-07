<template>
  <q-card class="work-card"
          :class="{
            'work-card--needs-attention': work.needsAttention
          }"
          bordered
          :flat="false">
    <q-card-section class="work-card__header">
      <h4> 
        <span v-if="work.needsAttention">
          Time to do it:
        </span>
        {{ work.name }}</h4>
      <div class="flex gap-1">
        <q-chip v-if="work.parentType === 'Part'" 
                :label="relatedPart?.partType"
                color="primary"
                text-color="white"
                size="md"
                class="part-card__chip" />
        <q-chip v-if="relatedBike"
                :label="relatedBike.name"
                color="secondary"
                text-color="white"
                size="md"
                class="part-card__bike-name-chip" />
      </div>
    </q-card-section>
    <q-card-section v-if="work.description">
      <p>{{ work.description }}</p>
    </q-card-section>
    <q-card-section>
      <div class="">
        {{ valuesString }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions align="right">
      <q-btn color="negative"
             outline
             @click="handleDelete">Delete</q-btn>
      <q-btn color="primary"
             outline
             @click="handleEdit">Edit</q-btn>
      <q-btn color="primary"
             :outline="!work.needsAttention"
             @click="handleDoWork">{{ work.needsAttention ? 'I did it!' : 'Do it now' }}</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useBikesStore } from '@/stores/bikesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import type { Work } from '@/types';
import { metersToUnit } from '@/utils/distance';
import { computed } from 'vue';

interface Props {
  work: Work;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  delete: [work: Work];
  doWork: [work: Work];
  edit: [work: Work];
}>();

// const worksStore = useWorksStore();
const partsStore = usePartsStore();
const bikesStore = useBikesStore();
const settingsStore = useUserSettingsStore();

const relatedBike = computed(() => {
  const bikeId = relatedPart.value?.bikeId ?? props.work.parentId;
  return bikesStore.getBikeById(bikeId) ?? null;
});

const relatedPart = computed(() => {
  if (props.work.parentType !== 'Part') {
    return null;
  }
  return partsStore.getPartById(props.work.parentId);
});

const valuesString = computed(() => {
  if (props.work.triggerType === 'Distance') {
    const consumed = props.work.triggerValue - props.work.remainingValue;
    return `${metersToUnit(consumed, settingsStore.distanceUnit)} / ${metersToUnit(props.work.triggerValue, settingsStore.distanceUnit)} ${settingsStore.distanceUnit}`;
  } else {
    return `${props.work.remainingValue} / ${props.work.triggerValue} days`;
  }
});

const handleDelete = () => {
  emit('delete', props.work);
};

const handleDoWork = () => {
  emit('doWork', props.work);
};

const handleEdit = () => {
  emit('edit', props.work);
};
</script>

<style scoped lang="scss">
.work-card {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  &__header-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    & h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
  }
  &__header-item-value {
    font-size: 1.25rem;
  }
  &--needs-attention {
    border: 2px solid var(--q-warning);
  }
  h4 {
    font-size: 1.5rem;

    span {
      color: var(--q-negative);
    }
  }
}
</style>