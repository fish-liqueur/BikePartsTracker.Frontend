<template>
  <LayoutWidgetGeneral :is-loading="isHistoryLoading" class="part-history-widget container">
    <template #header>
      <h2 v-if="title">{{ title }}</h2>
    </template>
    
    <template #default>
      <div class="part-history-widget__output">
        <PartHistoryCard v-for="history in historyItems"
                         :key="history.id"
                         :history="history"
                         @delete="handleDeleteHistory" />
      </div>
    </template>
  </LayoutWidgetGeneral>  
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePartsStore } from '@/stores/partsStore';
import LayoutWidgetGeneral from '@/components/layouts/LayoutWidgetGeneral.vue';
import PartHistoryCard from '@/components/cards/PartHistoryCard.vue';
import { useQuasar } from 'quasar';
import { useLayout } from '@/composables/useLayout';

interface Props {
  partId: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
});

const partsStore = usePartsStore();
const $q = useQuasar();
const { partHistories, isHistoryLoading } = storeToRefs(partsStore);
const {
  showSuccess, showError 
} = useLayout();

const historyItems = computed(() => partHistories.value[props.partId] ?? []);

watch(
  () => props.partId,
  async (id) => {
    if (id) await partsStore.ensurePartHistory(id);
  },
  { immediate: true }
);

const handleDeleteHistory = (historyId: string) => {
  try {
    $q.dialog({
      title: 'Do you want to delete this history record for this part?',
      message: 'All data will be lost for good.',
      cancel: true,
      persistent: false
    }).onOk(async () => {
      console.log('Deleting history:', historyId);
      showSuccess('History record deleted successfully');
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete the ride';
    showError(message);
  }
};
</script>

<style scoped lang="scss">
.part-history-widget {
  &__output {
    flex: 1 1 auto;
    overflow-y: auto;
    width: 100%;
    align-self: stretch;
  }
}
</style>
