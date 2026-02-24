<template>
  <div class="element-with-tooltip-button">
    <slot />
    <TooltipButton v-if="tooltipText" :text="tooltipText" class="ml-3" />
  </div>
</template>

<script setup lang="ts">
import TooltipButton from '@/components/shared/TooltipButton.vue';

interface Props {
  tooltipText: string;
}

const props = withDefaults(defineProps<Props>(), {
  tooltipText: ''
});
</script>

<style scoped>
.element-with-tooltip-button {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  position: relative;
}

.element-with-tooltip-button > :first-child {
  flex: 1;
}
</style>