import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { Quasar } from 'quasar';
import ChainCycleWidget from '../ChainCycleWidget.vue';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
import { usePartsStore } from '@/stores/partsStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { chainCyclesService } from '@/services/chainCyclesService';
import type { Bike, ChainCycle } from '@/types';

const showSuccess = vi.fn();
const showError = vi.fn();

vi.mock('@/services/chainCyclesService', () => ({
  chainCyclesService: {
    getChainCycles: vi.fn(),
    createChainCycle: vi.fn(),
    updateChainCycle: vi.fn(),
    deleteChainCycle: vi.fn(),
    fillEmptySlots: vi.fn(),
  },
}));

vi.mock('@/composables/useLayout', () => ({
  useLayout: () => ({
    showSuccess,
    showError,
    withAjaxBar: <T>(p: Promise<T>) => p,
  }),
}));

const bike: Bike = {
  id: 'bike-1',
  name: 'Trail Bike',
  description: '',
  type: 'Gravel' as never,
  parts: [],
  totalDistance: 10000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function seedCycle(cycle: ChainCycle) {
  useChainCyclesStore().setChainCyclesForBike(bike.id, [cycle]);
}

function mountWidget(): VueWrapper {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserSettingsStore().$patch({
    userSettings: {
      defaultChainCycleLength: 3,
      defaultChainCycleIntervalMetres: 700_000,
    } as never,
  });
  return mount(ChainCycleWidget, {
    props: { bikeContext: bike },
    global: {
      plugins: [Quasar, pinia],
      stubs: {
        ChainCard: true,
        ChainCardEmpty: true,
        InstallChainDialog: true,
        FillEmptySlotsDialog: false,
        ElementWithTooltipButton: { template: '<div><slot /></div>' },
        DateTimePicker: true,
        'q-btn': {
          props: ['label'],
          template: '<button type="button" v-bind="$attrs">{{ label }}</button>',
        },
        'q-radio': true,
        'q-dialog': {
          props: ['modelValue'],
          template: '<div v-if="modelValue"><slot /></div>',
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-option-group': {
          props: ['modelValue', 'options'],
          emits: ['update:modelValue'],
          template: `
            <div data-testid="active-choices">
              <button
                v-for="opt in options"
                :key="opt.value"
                type="button"
                @click="$emit('update:modelValue', opt.value)"
              >{{ opt.label }}</button>
            </div>
          `,
        },
      },
    },
  });
}

describe('ChainCycleWidget fill empty slots (ADR-0010)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // FE-01
  it('shows Fill empty slots when there is an empty slot and hides when full', async () => {
    const wrapper = mountWidget();
    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', null],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="fill-empty-slots"]').exists()).toBe(true);

    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', 'p2'],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="fill-empty-slots"]').exists()).toBe(false);
  });

  // FE-02
  it('with active chain calls fill-empty-slots once without opening setup dialog', async () => {
    vi.mocked(chainCyclesService.fillEmptySlots).mockResolvedValue({
      chainCycle: {
        id: 'cycle-1',
        bikeId: bike.id,
        chains: ['p1', 'new1'],
        activeChainId: 'p1',
        intervalMetres: 700_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdParts: [{
        id: 'new1', name: 'Trail Bike chain 2', partType: 'Chain' as never, bikeId: bike.id,
      }],
      affectedPartIds: ['new1'],
    });

    const wrapper = mountWidget();
    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', null],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();

    await wrapper.get('[data-testid="fill-empty-slots"]').trigger('click');
    await flushPromises();

    expect(chainCyclesService.fillEmptySlots).toHaveBeenCalledTimes(1);
    expect(chainCyclesService.fillEmptySlots).toHaveBeenCalledWith('cycle-1', {});
    expect(wrapper.find('[data-testid="active-choices"]').exists()).toBe(false);
    expect(showSuccess).toHaveBeenCalled();
  });

  // FE-03
  it('without active opens dialog; Confirm sends first new slot + install date', async () => {
    vi.mocked(chainCyclesService.fillEmptySlots).mockResolvedValue({
      chainCycle: {
        id: 'cycle-1',
        bikeId: bike.id,
        chains: ['n0', 'n1'],
        activeChainId: 'n0',
        intervalMetres: 700_000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdParts: [],
      affectedPartIds: [],
    });

    const wrapper = mountWidget();
    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: [null, null],
      activeChainId: null,
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();

    await wrapper.get('[data-testid="fill-empty-slots"]').trigger('click');
    await flushPromises();

    expect(chainCyclesService.fillEmptySlots).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Which new chain is on the bike now?');

    const confirmBtn = wrapper.findAll('button').find(b => b.text() === 'Confirm');
    expect(confirmBtn).toBeTruthy();
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(chainCyclesService.fillEmptySlots).toHaveBeenCalledTimes(1);
    const [, dto] = vi.mocked(chainCyclesService.fillEmptySlots).mock.calls[0];
    expect(dto?.activeNewSlotIndex).toBe(0);
    expect(dto?.installationDate).toBeTruthy();
  });

  // FE-05
  it('applies response to parts and cycle stores (single endpoint)', async () => {
    const created = {
      id: 'new1', name: 'Trail Bike chain 2', partType: 'Chain' as never, bikeId: bike.id,
    };
    const updatedCycle: ChainCycle = {
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', 'new1'],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(chainCyclesService.fillEmptySlots).mockResolvedValue({
      chainCycle: updatedCycle,
      createdParts: [created],
      affectedPartIds: ['new1'],
    });

    const wrapper = mountWidget();
    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', null],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();
    await wrapper.get('[data-testid="fill-empty-slots"]').trigger('click');
    await flushPromises();

    expect(usePartsStore().parts.some(p => p.id === 'new1')).toBe(true);
    expect(useChainCyclesStore().getChainCyclesForBike(bike.id)[0].chains[1]).toBe('new1');
  });

  // FE-06
  it('on API error shows toast and does not partially update cycle', async () => {
    vi.mocked(chainCyclesService.fillEmptySlots).mockRejectedValue(new Error('boom'));

    const wrapper = mountWidget();
    seedCycle({
      id: 'cycle-1',
      bikeId: bike.id,
      chains: ['p1', null],
      activeChainId: 'p1',
      intervalMetres: 700_000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await flushPromises();
    await wrapper.get('[data-testid="fill-empty-slots"]').trigger('click');
    await flushPromises();

    expect(showError).toHaveBeenCalled();
    expect(useChainCyclesStore().getChainCyclesForBike(bike.id)[0].chains[1]).toBeNull();
  });
});
