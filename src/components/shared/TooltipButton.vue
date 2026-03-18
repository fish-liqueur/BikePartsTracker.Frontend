<template>
  <q-btn flat
         round
         size="small"
         color="secondary"
         icon="question_mark" >
    <q-tooltip class="text-body2 tooltip-text">{{ text }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
interface Props {
  text: string;
}

withDefaults(defineProps<Props>(), {
  text: ''
});
</script>
