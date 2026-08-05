import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { Quasar } from 'quasar';
import { nextTick } from 'vue';
import RidesWidget from '../RidesWidget.vue';
import { useRidesStore } from '@/stores/ridesStore';
import { ridesService } from '@/services/ridesService';
import type { Ride } from '@/types';

vi.mock('@/services/ridesService', () => ({
  ridesService: {
    getRides: vi.fn(),
    createRide: vi.fn(),
    updateRide: vi.fn(),
    deleteRide: vi.fn(),
    importFromStrava: vi.fn(),
  },
}));

vi.mock('@/composables/useLayout', () => ({
  useLayout: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    withAjaxBar: <T>(p: Promise<T>) => p,
  }),
}));

const stubRide = (id: string, name: string): Ride => ({
  id,
  name,
  description: null,
  type: 'Ride',
  gearId: null,
  bikeId: null,
  stravaActivityId: null,
  distance: 1000,
  recordedDistance: 1000,
  isActive: true,
  startDateLocal: new Date().toISOString(),
} as unknown as Ride);

describe('RidesWidget (ADR-0001 F-02b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refetches rides immediately while mounted when rides become dirty (no toast path)', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const initial = [stubRide('ride-1', 'First')];
    const afterImport = [stubRide('ride-1', 'First'), stubRide('ride-2', 'New from Strava')];

    vi.mocked(ridesService.getRides)
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(afterImport);

    const wrapper = mount(RidesWidget, {
      props: { title: 'Rides' },
      global: {
        plugins: [Quasar, pinia],
        stubs: {
          LayoutWidgetGeneral: {
            template: '<div><slot name="header-left" /><slot name="header-right" /><slot /></div>',
          },
          RidesTableContainer: true,
          AddRideDialog: true,
          EditRideDialog: true,
          SyncRidesDialog: true,
          'q-btn': true,
        },
      },
    });

    await flushPromises();
    expect(ridesService.getRides).toHaveBeenCalledTimes(1);

    const ridesStore = useRidesStore();
    expect(ridesStore.rides).toHaveLength(1);

    // Simulate SignalR entitiesAffected → markRidesDirty (quiet).
    ridesStore.markRidesDirty(['ride-2']);
    await nextTick();
    await flushPromises();

    expect(ridesService.getRides).toHaveBeenCalledTimes(2);
    expect(ridesStore.rides).toHaveLength(2);
    expect(ridesStore.rides.map((r) => r.id)).toContain('ride-2');
    expect(ridesStore.ridesDirty.size).toBe(0);

    wrapper.unmount();
  });
});
