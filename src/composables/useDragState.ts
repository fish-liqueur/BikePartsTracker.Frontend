import { ref } from 'vue';
import type { Ref } from 'vue';
import type { BikePart } from '@/types';

const draggedPart: Ref<BikePart | null> = ref(null);

export function useDragState() {
  function setDraggedPart(part: BikePart | null) {
    draggedPart.value = part;
  }

  return {
    draggedPart: draggedPart as Readonly<Ref<BikePart | null>>,
    setDraggedPart
  };
}
