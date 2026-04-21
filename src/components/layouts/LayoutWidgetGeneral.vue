<!-- eslint-disable @typescript-eslint/no-unused-vars -->

<template>
  <div class="widget">
    <div v-if="isLoading" class="loading-container">
      <q-spinner color="primary" size="3em" />
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else>
      <div v-if="showHeaderRow" class="widget-header">
        <div v-if="showHeaderPartials" class="widget-header__main">
          <div class="widget-header__main-left widget-header__ui-group">
            <slot name="header-left" />
          </div>
          <div class="widget-header__main-right widget-header__ui-group">
            <slot name="header-right" />
          </div>
        </div>
        <div v-else class="widget-header__main">
          <slot name="header" />
        </div>
        <div v-if="showHeaderFilter" class="widget-header__filter">
          <q-btn flat
                 round
                 dense
                 icon="filter_list"
                 aria-label="Open filters">
            <q-menu anchor="bottom right"
                    self="top right"
                    :offset="[0, 8]">
              <div class="widget-header__filter-menu q-pa-md">
                <slot name="header-filter" />
              </div>
            </q-menu>
          </q-btn>
        </div>
      </div>
      <div class="widget-body">
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

const showHeaderRow = computed(() => !!(slots.header || slots['header-filter'] || showHeaderPartials));
const showHeaderPartials = computed(() => !!(slots['header-left'] || slots['header-right']));
const showHeaderFilter = computed(() => !!slots['header-filter']);
</script>

<style scoped lang="scss">
.widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    border-bottom: 1px solid #e2e8f0;

    &__main {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    &__filter {
      flex-shrink: 0;
      margin-left: 12px;
    }

    &__filter-menu {
      min-width: 200px;
    }

    &__ui-group {
      display: flex;
      gap: 1rem;
    }

    & :deep(h2) {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a202c;
    }
  }

  &-body {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  max-height: 100%;
}

@media (max-width: 768px) {
  .widget {
    &-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
    }

    &-header__filter {
      align-self: flex-end;
      margin-left: 0;
    }
  }
}
</style>
