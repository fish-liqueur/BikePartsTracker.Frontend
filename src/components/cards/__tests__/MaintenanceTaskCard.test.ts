import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { Quasar } from 'quasar';
import MaintenanceTaskCard from '../MaintenanceTaskCard.vue';
import type { MaintenanceTask } from '@/types';

function stubTask(overrides: Partial<MaintenanceTask> = {}): MaintenanceTask {
  return {
    id: 'task-1',
    name: 'Lube chain',
    description: null,
    startDate: new Date(),
    type: 'Repeating',
    triggerType: 'Time',
    parentType: 'Bike',
    parentId: 'bike-1',
    triggerValue: 30,
    isActive: true,
    consumedValue: 0,
    remainingValue: 30,
    needsAttention: false,
    ...overrides,
  };
}

function mountCard(task: MaintenanceTask) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(MaintenanceTaskCard, {
    props: { maintenanceTask: task },
    global: {
      plugins: [Quasar, pinia],
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-separator': true,
        'q-chip': true,
        'q-btn': { template: '<button type="button"><slot /></button>' },
      },
    },
  });
}

describe('MaintenanceTaskCard (ADR 0011 FE-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "I did it!" when needsAttention', () => {
    const wrapper = mountCard(stubTask({
      needsAttention: true, remainingValue: 0, consumedValue: 30 
    }));
    expect(wrapper.text()).toContain('I did it!');
    expect(wrapper.text()).not.toContain('Do it now');
  });

  it('shows "Do it now" when not due', () => {
    const wrapper = mountCard(stubTask({ needsAttention: false }));
    expect(wrapper.text()).toContain('Do it now');
    expect(wrapper.text()).not.toContain('I did it!');
  });
});
