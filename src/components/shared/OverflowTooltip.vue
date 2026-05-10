<template>
  <div ref="el" class="ellipsis">
    {{ text }}
  
    <q-tooltip v-if="isOverflowing">
      {{ text }}
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

interface Props {
  text: string
}

defineProps<Props>();

const el = ref<HTMLElement | null>(null);
const isOverflowing = ref<boolean>(false);

let resizeObserver: ResizeObserver | null = null;

const checkOverflow = (): void => {
  if (!el.value) return;

  isOverflowing.value =
    el.value.scrollWidth > el.value.clientWidth;
};

onMounted(async () => {
  await nextTick();
  checkOverflow();

  resizeObserver = new ResizeObserver(() => {
    checkOverflow();
  });

  if (el.value) {
    resizeObserver.observe(el.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.ellipsis {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>