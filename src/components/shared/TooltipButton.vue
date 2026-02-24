<template>
  <q-btn flat round size="small" color="secondary" icon="question_mark" >
    <q-tooltip class="text-body2">{{ text }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
interface Props {
  text: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: ''
});
</script>

<style scoped>
.tooltip-text {
  font-size: 1.5rem;
  font-weight: normal;
  color: #fff;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>