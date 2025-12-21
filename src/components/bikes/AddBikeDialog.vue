<template>
  <q-dialog v-model="localShow" @update:model-value="handleDialogUpdate">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add New Bike</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="bike-form">
          <q-input
            v-model="newBike.name"
            label="Bike Name *"
            placeholder="e.g., Road Bike, Mountain Bike"
            :rules="[val => !!val || 'Bike name is required']"
            outlined
            dense
          />
          <q-input
            v-model="newBike.brand"
            label="Brand *"
            placeholder="e.g., Trek, Specialized"
            :rules="[val => !!val || 'Brand is required']"
            outlined
            dense
          />
          <q-input
            v-model="newBike.model"
            label="Model *"
            placeholder="e.g., Domane, Stumpjumper"
            :rules="[val => !!val || 'Model is required']"
            outlined
            dense
          />
          <q-input
            v-model.number="newBike.year"
            label="Year *"
            type="number"
            :min="1900"
            :max="2030"
            :rules="[val => !!val || 'Year is required']"
            outlined
            dense
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="handleCancel" />
        <q-btn flat label="Add Bike" color="primary" @click="handleSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { CreateBikeDto } from '@/types';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [bikeData: CreateBikeDto];
}>();

const localShow = ref(props.modelValue);
const newBike = ref<CreateBikeDto>({
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear()
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  localShow.value = newValue;
  if (newValue) {
    // Reset form when dialog opens
    resetForm();
  }
});

// Watch for internal changes to localShow
watch(localShow, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleDialogUpdate = (value: boolean) => {
  localShow.value = value;
  if (!value) {
    resetForm();
  }
};

const resetForm = () => {
  newBike.value = {
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear()
  };
};

const handleCancel = () => {
  localShow.value = false;
  resetForm();
};

const handleSubmit = () => {
  // Validate form
  if (!newBike.value.name || !newBike.value.brand || !newBike.value.model || !newBike.value.year) {
    return;
  }

  emit('submit', { ...newBike.value });
  resetForm();
};
</script>

<style scoped lang="css">
.bike-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

