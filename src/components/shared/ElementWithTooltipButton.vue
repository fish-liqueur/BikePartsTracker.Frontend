<template>
  <div class="element-with-tooltip-button">
    <slot />
    <TooltipButton v-if="enabled" :text="tooltipText" class="ml-3" />
  </div>
</template>

<script setup lang="ts">
import TooltipButton from '@/components/shared/TooltipButton.vue';
import { computed } from 'vue';
import { useUserSettingsStore } from '@/stores/userSettingsStore';

const userSettingsStore = useUserSettingsStore();

interface Props {
  tooltipText: string;
  showAlways?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tooltipText: '',
  showAlways: false,
});

const enabled = computed(() => {
  return (props.showAlways || userSettingsStore.userSettings?.showTips) && props.tooltipText;
});
</script>

<style scoped>
.element-with-tooltip-button {
  display: flex;
  align-items: start;
  justify-content: space-between;
  position: relative;
}

.element-with-tooltip-button > :first-child {
  flex: 1;
}
</style>