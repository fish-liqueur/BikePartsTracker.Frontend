import {
  describe, it, expect, vi, beforeEach, afterEach 
} from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import FillEmptySlotsDialog from '../FillEmptySlotsDialog.vue';

describe('FillEmptySlotsDialog (ADR-0010 FE-03/04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountDialog = () =>
    mount(FillEmptySlotsDialog, {
      props: {
        modelValue: true,
        bikeName: 'Trail Bike',
        emptySlotIndices: [0, 2],
      },
      global: {
        plugins: [Quasar],
        stubs: {
          DateTimePicker: {
            template: '<input data-testid="install-time" />',
            props: ['modelValue'],
          },
          'q-dialog': { template: '<div><slot /></div>', props: ['modelValue'] },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-card-actions': { template: '<div><slot /></div>' },
          'q-option-group': {
            props: ['modelValue', 'options'],
            emits: ['update:modelValue'],
            template: `
              <div>
                <button
                  v-for="opt in options"
                  :key="opt.value"
                  :data-testid="'choice-' + opt.value"
                  @click="$emit('update:modelValue', opt.value)"
                >{{ opt.label }}</button>
              </div>
            `,
          },
          'q-btn': {
            props: ['label'],
            template: '<button @click="$emit(\'click\')">{{ label }}</button>',
          },
        },
      },
    });

  it('defaults to first new chain and shows install control', async () => {
    const wrapper = mountDialog();
    await flushPromises();
    expect(wrapper.text()).toContain('Trail Bike chain 1');
    expect(wrapper.text()).toContain('Trail Bike chain 3');
    expect(wrapper.find('[data-testid="install-time"]').exists()).toBe(true);
  });

  it('None yet hides install control and emits null active index', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="choice-none"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="install-time"]').exists()).toBe(false);

    await wrapper.findAll('button').find(b => b.text() === 'Confirm')!.trigger('click');
    const confirm = wrapper.emitted('confirm')?.[0]?.[0] as {
      activeNewSlotIndex: number | null;
      installationDate: Date | null;
    };
    expect(confirm.activeNewSlotIndex).toBeNull();
    expect(confirm.installationDate).toBeNull();
  });

  it('selecting another slot emits that index', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-testid="choice-2"]').trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find(b => b.text() === 'Confirm')!.trigger('click');
    const confirm = wrapper.emitted('confirm')?.[0]?.[0] as {
      activeNewSlotIndex: number | null;
    };
    expect(confirm.activeNewSlotIndex).toBe(2);
  });
});
