import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { Quasar } from 'quasar';
import { nextTick } from 'vue';
import MaintenanceTasksWidget from '../MaintenanceTasksWidget.vue';
import { useMaintenanceTasksStore } from '@/stores/maintenanceTasksStore';
import { maintenanceTasksService } from '@/services/maintenanceTasksService';
import type { Bike, BikePart, MaintenanceTask } from '@/types';
import { ApiError } from '@/services/api';

const showSuccess = vi.fn();
const showError = vi.fn();

type DialogChain = {
  onOk: (fn: () => void) => DialogChain;
  onCancel: (fn: () => void) => DialogChain;
};

const dialogMock = vi.fn((): DialogChain => {
  let okFn: (() => void) | null = null;
  const chain: DialogChain = {
    onOk: (fn: () => void) => {
      okFn = fn;
      (chain as DialogChain & { _runOk?: () => void })._runOk = () => okFn?.();
      return chain;
    },
    onCancel: () => chain,
  };
  return chain;
});

vi.mock('@/services/maintenanceTasksService', () => ({
  maintenanceTasksService: {
    getMaintenanceTasks: vi.fn(),
    createMaintenanceTask: vi.fn(),
    updateMaintenanceTask: vi.fn(),
    deleteMaintenanceTask: vi.fn(),
    acknowledgeMaintenanceTask: vi.fn(),
  },
}));

vi.mock('@/composables/useLayout', () => ({
  useLayout: () => ({
    showSuccess,
    showError,
    withAjaxBar: <T>(p: Promise<T>) => p,
  }),
}));

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('quasar')>();
  return {
    ...actual,
    useQuasar: () => ({
      dialog: dialogMock,
    }),
  };
});

function stubTask(overrides: Partial<MaintenanceTask> = {}): MaintenanceTask {
  return {
    id: 'task-1',
    name: 'Lube',
    description: null,
    startDate: new Date('2026-01-01T00:00:00Z'),
    type: 'Repeating',
    triggerType: 'Distance',
    parentType: 'Part',
    parentId: 'part-1',
    triggerValue: 1000,
    isActive: true,
    consumedValue: 0,
    remainingValue: 1000,
    needsAttention: false,
    ...overrides,
  };
}

const part: BikePart = {
  id: 'part-1',
  name: 'Chain',
  partType: 'Chain',
  bikeId: 'bike-1',
  isActive: true,
} as BikePart;

const bike: Bike = {
  id: 'bike-1',
  name: 'Road',
  description: '',
  type: 'Road' as never,
  parts: [],
  totalDistance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function runLastDialogOk() {
  const last = dialogMock.mock.results[dialogMock.mock.results.length - 1]?.value as (DialogChain & { _runOk?: () => void }) | undefined;
  last?._runOk?.();
}

function mountWidget(props: Record<string, unknown> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(MaintenanceTasksWidget, {
    props: {
      part, parentType: 'Part', title: 'Works', ...props 
    },
    global: {
      plugins: [Quasar, pinia],
      stubs: {
        LayoutWidgetGeneral: {
          template: '<div><slot name="header-left" /><slot name="header-right" /><slot /></div>',
        },
        MaintenanceTaskCard: {
          props: ['maintenanceTask'],
          emits: ['doMaintenanceTask', 'edit', 'delete'],
          template: `
            <div data-testid="task-card">
              <button data-testid="do-btn" @click="$emit('doMaintenanceTask', maintenanceTask)">Do</button>
            </div>
          `,
        },
        AddMaintenanceTaskDialog: {
          props: ['modelValue', 'basicMaintenanceTask'],
          template: '<div data-testid="add-dialog" v-if="modelValue" :data-prefill="JSON.stringify(basicMaintenanceTask)" />',
        },
        EditMaintenanceTaskDialog: true,
        'q-btn': {
          props: ['label'],
          template: '<button type="button" @click="$attrs.onClick">{{ label }}</button>',
        },
        'q-toggle': {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<button data-testid="exclude-parts-toggle" type="button" @click="$emit(\'update:modelValue\', !modelValue)">toggle</button>',
        },
        'q-select': true,
        'q-icon': true,
      },
    },
  });
}

describe('MaintenanceTasksWidget acknowledge (ADR 0011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-04: due task acknowledges with force false and no confirm', async () => {
    const due = stubTask({
      needsAttention: true, remainingValue: 0, consumedValue: 1000 
    });
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([due]);
    vi.mocked(maintenanceTasksService.acknowledgeMaintenanceTask).mockResolvedValue({
      maintenanceTask: {
        ...due, needsAttention: false, consumedValue: 0, remainingValue: 1000 
      },
      affected: {
        affectedRideIds: [],
        affectedPartIds: [],
        affectedBikeIds: [],
        affectedMaintenanceTaskIds: [due.id],
      },
    });

    const wrapper = mountWidget();
    await flushPromises();
    const store = useMaintenanceTasksStore();
    const markDirty = vi.spyOn(store, 'markMaintenanceTasksDirty');

    await wrapper.get('[data-testid="do-btn"]').trigger('click');
    await flushPromises();

    expect(dialogMock).not.toHaveBeenCalled();
    expect(maintenanceTasksService.acknowledgeMaintenanceTask).toHaveBeenCalledWith(due.id, { force: false });
    expect(showSuccess).toHaveBeenCalled();
    expect(markDirty).toHaveBeenCalledWith([due.id]);
  });

  it('FE-02/FE-03: early path confirms; Cancel skips API; Confirm uses force true', async () => {
    const early = stubTask({ needsAttention: false });
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([early]);

    const wrapper = mountWidget();
    await flushPromises();

    await wrapper.get('[data-testid="do-btn"]').trigger('click');
    await flushPromises();

    expect(dialogMock).toHaveBeenCalledTimes(1);
    expect(maintenanceTasksService.acknowledgeMaintenanceTask).not.toHaveBeenCalled();

    vi.mocked(maintenanceTasksService.acknowledgeMaintenanceTask).mockResolvedValue({
      maintenanceTask: early,
      affected: {
        affectedRideIds: [],
        affectedPartIds: [],
        affectedBikeIds: [],
        affectedMaintenanceTaskIds: [early.id],
      },
    });
    runLastDialogOk();
    await flushPromises();

    expect(maintenanceTasksService.acknowledgeMaintenanceTask).toHaveBeenCalledWith(early.id, { force: true });
  });

  it('FE-06: failure shows error toast and does not open create-another', async () => {
    const due = stubTask({ needsAttention: true, type: 'OneTime' });
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([due]);
    vi.mocked(maintenanceTasksService.acknowledgeMaintenanceTask).mockRejectedValue(new ApiError('Already completed', { code: 'MAINTENANCE_TASK_ALREADY_COMPLETED', status: 409 }),);

    const wrapper = mountWidget();
    await flushPromises();
    await wrapper.get('[data-testid="do-btn"]').trigger('click');
    await flushPromises();

    expect(showError).toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
    expect(dialogMock).not.toHaveBeenCalled();
  });

  it('FE-07: OneTime success prompts create-another and prefills add dialog', async () => {
    const due = stubTask({
      needsAttention: true,
      type: 'OneTime',
      name: 'Bleed brakes',
      triggerValue: 5000,
    });
    const completed = {
      ...due, isActive: false, needsAttention: false 
    };
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([due]);
    vi.mocked(maintenanceTasksService.acknowledgeMaintenanceTask).mockResolvedValue({
      maintenanceTask: completed,
      affected: {
        affectedRideIds: [],
        affectedPartIds: [],
        affectedBikeIds: [],
        affectedMaintenanceTaskIds: [due.id],
      },
    });

    const wrapper = mountWidget();
    await flushPromises();
    await wrapper.get('[data-testid="do-btn"]').trigger('click');
    await flushPromises();

    expect(showSuccess).toHaveBeenCalled();
    expect(dialogMock).toHaveBeenCalledTimes(1);
    runLastDialogOk();
    await nextTick();
    await flushPromises();

    const addDialog = wrapper.find('[data-testid="add-dialog"]');
    expect(addDialog.exists()).toBe(true);
    const prefill = JSON.parse(addDialog.attributes('data-prefill') ?? '{}');
    expect(prefill.name).toBe('Bleed brakes');
    expect(prefill.type).toBe('OneTime');
    expect(prefill.parentId).toBe('part-1');
    expect(prefill.triggerValue).toBe(5000);
    expect(prefill.isActive).toBe(true);
  });

  it('FE-08: dirty maintenance tasks refetch while mounted', async () => {
    const initial = [stubTask()];
    const refreshed = [stubTask({ name: 'Updated' })];
    vi.mocked(maintenanceTasksService.getMaintenanceTasks)
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(refreshed);

    mountWidget();
    await flushPromises();
    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenCalledTimes(1);

    const store = useMaintenanceTasksStore();
    store.markMaintenanceTasksDirty(['task-1']);
    await nextTick();
    await flushPromises();

    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenCalledTimes(2);
    expect(store.maintenanceTasksDirty).toBe(false);
  });

  it('FE-09: Part surface loads with relatedToPartId', async () => {
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([]);
    mountWidget({ part, parentType: 'Part' });
    await flushPromises();

    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenCalledWith(expect.objectContaining({ relatedToPartId: 'part-1', isActive: true }),);
  });

  it('FE-10: Bike surface loads with bikeId; toggle sends excludePartParents', async () => {
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([]);
    const wrapper = mountWidget({
      part: undefined, bike, parentType: 'Bike', allWorks: false 
    });
    await flushPromises();

    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenCalledWith(expect.objectContaining({ bikeId: 'bike-1', isActive: true }),);

    await wrapper.get('[data-testid="exclude-parts-toggle"]').trigger('click');
    await flushPromises();

    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenLastCalledWith(expect.objectContaining({
      bikeId: 'bike-1',
      isActive: true,
      excludePartParents: true,
    }));
  });

  it('FE-11: Works page loads isActive true without parent filter', async () => {
    vi.mocked(maintenanceTasksService.getMaintenanceTasks).mockResolvedValue([]);
    mountWidget({
      part: undefined, bike: undefined, allWorks: true, title: 'Works'
    });
    await flushPromises();

    expect(maintenanceTasksService.getMaintenanceTasks).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }),);
    const call = vi.mocked(maintenanceTasksService.getMaintenanceTasks).mock.calls[0][0];
    expect(call?.bikeId).toBeUndefined();
    expect(call?.relatedToPartId).toBeUndefined();
  });
});
