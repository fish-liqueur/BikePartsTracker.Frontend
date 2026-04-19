<template>
  <div class="view-container">
    <div v-if="isLoading" class="loading-container">
      <q-spinner color="primary" size="3em" />
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else>
      <div v-if="showHeaderRow" class="layout-view-general__header">
        <div class="layout-view-general__header-main">
          <slot name="header" />
        </div>
        <div v-if="$slots.headerFilter" class="layout-view-general__header-filter">
          <q-btn flat
                 round
                 dense
                 icon="filter_list"
                 aria-label="Open filters">
            <q-menu anchor="bottom right"
                    self="top right"
                    :offset="[0, 8]">
              <div class="layout-view-general__filter-menu q-pa-md">
                <slot name="headerFilter" />
              </div>
            </q-menu>
          </q-btn>
        </div>
      </div>
      <div class="layout-view-general__main">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

withDefaults(defineProps<{
  isLoading?: boolean;
  loadingMessage?: string;
}>(),
{
  isLoading: false,
  loadingMessage: 'Loading...',
});

const slots = useSlots();

const showHeaderRow = computed(() => !!(slots.header || slots.headerFilter));
</script>

<style scoped lang="css">
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.layout-view-general__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
}

.layout-view-general__header-main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.layout-view-general__header-filter {
  flex-shrink: 0;
  margin-left: 12px;
}

.layout-view-general__filter-menu {
  min-width: 200px;
}

@media (max-width: 768px) {
  .layout-view-general__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .layout-view-general__header-filter {
    align-self: flex-end;
    margin-left: 0;
  }
}

.layout-view-general__header-main > :deep(h1) {
  margin: 0;
  font-size: 2rem;
  line-height: normal;
  font-weight: 600;
  color: #1a202c;
}
</style>
