<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Create Part</div>
      </q-card-section>

      <q-card-section>
        <PartTemplatePicker
          :dialog-open="modelValue"
          :form-part-type="formPartTypeForTemplate"
          class="q-mb-md"
          @select="onTemplateSelect"
        />
        <PartForm
          ref="partFormRef"
          :initial-data="initialFormData"
          @update:isValid="(val) => isValid = val"
          @submit="handleSubmit"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat
               label="Cancel"
               color="primary"
               @click="handleCancel" />
        <q-btn
          flat
          label="Create Part"
          color="primary"
          @click="() => partFormRef?.handleSubmit()"
          :disable="!isValid"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useBikesStore } from '@/stores/bikesStore';
import type { BikePart, CreatePartDto, PartFormExposed } from '@/types';
import { PartType } from '@/types';
import PartForm from '@/components/forms/PartForm.vue';
import PartTemplatePicker from '@/components/parts/PartTemplatePicker.vue';
import { mapBikePartToTemplatePrefill } from '@/components/parts/partTemplatePrefill';

interface Props {
  modelValue: boolean;
  targetBikeId?: string | null;
  basicPart?: BikePart | null;
}

const props = withDefaults(defineProps<Props>(), {
  targetBikeId: null,
  basicPart: null
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  create: [data: CreatePartDto];
  cancel: [];
}>();

const bikesStore = useBikesStore();

const isValid = ref(false);
const partFormRef = ref<ComponentPublicInstance & PartFormExposed | null>(null);

const templatePrefill = ref<Partial<CreatePartDto> | null>(null);
/** Preserves the name field when applying or clearing a template. */
const nameSnapshot = ref<string | undefined>(undefined);
const typeSnapshot = ref<PartType | null>(null);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      templatePrefill.value = null;
      nameSnapshot.value = undefined;
      typeSnapshot.value = null;
    }
  }
);

const formPartTypeForTemplate = computed(
  () => partFormRef.value?.formData.partType ?? PartType.Other
);

function snapshotPartFormName(): string {
  return partFormRef.value?.formData.name ?? '';
}

function onTemplateSelect(part: BikePart | null) {
  nameSnapshot.value = snapshotPartFormName();
  typeSnapshot.value = part?.partType ?? null;
  if (!part) {
    templatePrefill.value = null;
    return;
  }
  templatePrefill.value = mapBikePartToTemplatePrefill(part, {});
}

// Compute initial form data when dialog opens
const initialFormData = computed(() => {
  if (!props.modelValue) {
    return undefined;
  }

  const data: Partial<CreatePartDto> = {
    name: '',
    description: '',
    partType: PartType.Other,
    brand: '',
    model: '',
    bikeId: '',
    mileageAtInstallation: 0
  };
  
  // If basicPart is provided, fill form with its values
  if (props.basicPart) {
    data.name = props.basicPart.name || '';
    data.description = props.basicPart.description || '';
    data.partType = props.basicPart.partType || PartType.Other;
    data.brand = props.basicPart.brand || '';
    data.model = props.basicPart.model || '';
    data.bikeId = props.basicPart.bikeId || '';
    data.mileageAtInstallation = props.basicPart.mileageAtInstallation || 0;
  }
  
  // If targetBikeId is provided and matches a bike, set it (overrides basicPart.bikeId if both are provided)
  if (props.targetBikeId) {
    const targetBike = bikesStore.bikes.find(bike => bike.id === props.targetBikeId);
    if (targetBike) {
      data.bikeId = props.targetBikeId;
    }
  }

  if (templatePrefill.value) {
    return {
      ...data,
      ...templatePrefill.value,
      name: nameSnapshot.value ?? data.name
    };
  }

  if (nameSnapshot.value !== undefined) {
    data.name = nameSnapshot.value;
  }

  if (typeSnapshot.value !== null) {
    data.partType = typeSnapshot.value;
  }

  return data;
});

const handleCancel = () => {
  emit('update:modelValue', false);
};

const handleSubmit = (formData: CreatePartDto) => {
  // Create CreatePartDto - include all form fields
  // Note: description is included even though not in CreatePartDto type
  // as BikePart requires it and backend may accept it
  const createData: CreatePartDto = {
    name: formData.name,
    partType: formData.partType,
    brand: formData.brand || undefined,
    model: formData.model || undefined,
    bikeId: formData.bikeId || undefined,
    mileageAtInstallation: formData.mileageAtInstallation
  };
  // Include description if provided (backend may accept it)
  const dataWithDescription = formData.description 
    ? { ...createData, description: formData.description } as any
    : createData;
  emit('create', dataWithDescription);
  emit('update:modelValue', false);
};
</script>


