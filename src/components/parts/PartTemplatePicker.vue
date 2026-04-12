<template>
  <div class="part-template-picker">
    <div class="text-subtitle2 q-mb-xs">Use existing part as a template</div>
    <div class="display-flex gap-2 flex-align-center flex-wrap">
      <q-toggle
        v-model="filterByFormTypeOnly"
        :label="filterToggleLabel"
        color="primary"
        dense
      />
      <q-select
        v-model="selectedPartId"
        class="flex-1"
        style="min-width: 12rem"
        :options="filteredParts"
        label="Existing part"
        filled
        clearable
        option-label="name"
        emit-value
        map-options
        option-value="id"
      >
      <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption>{{ scope.opt.description }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="!filterByFormTypeOnly" avatar>
              <q-chip :label="scope.opt.partType"
                :color="scope.opt.partType === formPartType ? 'primary' : 'secondary'"
                text-color="white"
                size="md" />
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              No matching parts
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { usePartsStore } from '@/stores/partsStore';
import type { BikePart } from '@/types';
import { PartType } from '@/types';
import { partTypeOptions } from '@/components/shared/partTypeOptions';

const props = defineProps<{
  /** Current part type in the form — used when “only this type” is on. */
  formPartType: PartType;
  /** When true, reset selection (e.g. dialog opened). */
  dialogOpen: boolean;
}>();

const emit = defineEmits<{
  select: [part: BikePart | null];
}>();

const partsStore = usePartsStore();

const filterByFormTypeOnly = ref(true);
/** Selected part id for q-select (`emit-value` + `option-value="id"`). */
const selectedPartId = ref<string | null>(null);

const typeLabel = computed(() => {
  return partTypeOptions.find((o) => o.value === props.formPartType)?.label ?? 'this type';
});

const filterToggleLabel = computed(() =>
  filterByFormTypeOnly.value ? `Only ${typeLabel.value}` : 'All part types'
);

const partById = computed(() => {
  const map = new Map<string, BikePart>();
  for (const p of partsStore.parts) {
    map.set(p.id, p);
  }
  return map;
});

const filteredParts = computed(() => {
  let list = [...partsStore.parts];
  if (filterByFormTypeOnly.value) {
    list = list.filter((p) => p.partType === props.formPartType);
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
});

watch(selectedPartId, (id) => {
  emit('select', id ? partById.value.get(id) ?? null : null);
});

watch(
  () => props.dialogOpen,
  (open) => {
    if (open) {
      selectedPartId.value = null;
      filterByFormTypeOnly.value = true;
      void partsStore.ensureParts();
    }
  },
  { immediate: true }
);

watch(filteredParts, (list) => {
  if (selectedPartId.value && !list.some((p) => p.id === selectedPartId.value)) {
    selectedPartId.value = null;
  }
});
</script>

<style scoped>
.part-template-picker {
  border: 1px solid #ccc;
  border-radius: .5rem;
  padding: .5rem;
}
</style>