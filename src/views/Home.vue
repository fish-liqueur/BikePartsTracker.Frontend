<template>
  <div class="dashboard-container">
    <main class="dashboard-main">
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>Total Bikes</h3>
          <p class="stat-number">{{ bikesCount }}</p>
        </div>
        <div class="stat-card">
          <h3>Active Parts</h3>
          <p class="stat-number">{{ totalParts }}</p>
        </div>
        <div class="stat-card">
          <h3>Maintenance Due</h3>
          <p class="stat-number">{{ maintenanceDue }}</p>
        </div>
      </div>

      <div class="dashboard-actions">
        <button @click="showAddBikeModal = true" class="action-button primary">
          <span class="icon">+</span>
          Add New Bike
        </button>
        <button @click="showAddPartModal = true" class="action-button secondary">
          <span class="icon">🔧</span>
          Add Part
        </button>
        <button @click="showMaintenanceModal = true" class="action-button secondary">
          <span class="icon">📝</span>
          Log Maintenance
        </button>
      </div>

      <div class="bikes-section">
        <h2>Your Bikes</h2>
        <div v-if="isLoading" class="loading">
          Loading bikes...
        </div>
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        <div v-else-if="bikes.length === 0" class="empty-state">
          <p>No bikes yet. Add your first bike to get started!</p>
        </div>
        <div v-else class="bikes-grid">
          <div
            v-for="bike in bikes"
            :key="bike.id"
            class="bike-card"
            @click="selectBike(bike)"
          >
            <div class="bike-header">
              <h3 class="bike-name">{{ bike.name }}</h3>
              <span class="bike-type">{{ bike.type }}</span>
            </div>
            <div class="bike-details">
              <p class="bike-parts">{{ bike.parts?.length || 0 }} parts</p>
            </div>
            <div class="bike-actions">
              <button @click.stop="editBike(bike)" class="edit-button">Edit</button>
              <button @click.stop="deleteBike(bike.id)" class="delete-button">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Bike Modal -->
    <div v-if="showAddBikeModal"
         class="modal-overlay"
         @click="showAddBikeModal = false">
      <div class="modal" @click.stop>
        <h3>Add New Bike</h3>
        <form @submit.prevent="handleAddBike" class="modal-form">
          <div class="form-group">
            <label for="bikeName">Bike Name</label>
            <input
              id="bikeName"
              v-model="newBike.name"
              type="text"
              required
              placeholder="e.g., Road Bike, Mountain Bike"
            />
          </div>
          <div class="form-group">
            <label for="bikeType">Bike Type</label>
            <select
              id="bikeType"
              v-model="newBike.type"
              required
            >
              <option :value="BikeType.Road">Road</option>
              <option :value="BikeType.Mountain">Mountain</option>
              <option :value="BikeType.Gravel">Gravel</option>
              <option :value="BikeType.EBike">E-Bike</option>
              <option :value="BikeType.City">City</option>
              <option :value="BikeType.Touring">Touring</option>
              <option :value="BikeType.Cargo">Cargo</option>
              <option :value="BikeType.Fixed">Fixed</option>
              <option :value="BikeType.Rat">Rat</option>
              <option :value="BikeType.Other">Other</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button"
                    @click="showAddBikeModal = false"
                    class="cancel-button">
              Cancel
            </button>
            <button type="submit" class="submit-button">Add Bike</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, onMounted 
} from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useLayout } from '@/composables/useLayout';
import type { Bike, CreateBikeDto } from '@/types';
import { BikeType } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const bikesStore = useBikesStore();
const {
  showSuccess, showError, withAjaxBar, startAjaxBar, stopAjaxBar 
} = useLayout();

// Reactive state
const showAddBikeModal = ref(false);
const showAddPartModal = ref(false);
const showMaintenanceModal = ref(false);
const newBike = ref<CreateBikeDto>({
  name: '',
  type: BikeType.Other
});

// Computed properties
const currentUser = computed(() => authStore.currentUser);
const bikes = computed(() => bikesStore.bikes);
const bikesCount = computed(() => bikesStore.bikesCount);
const isLoading = computed(() => bikesStore.isLoading);
const error = computed(() => bikesStore.error);

// Mock stats for now - these would come from API calls
const totalParts = computed(() => {
  return bikes.value.reduce((total, bike) => total + (bike.parts?.length || 0), 0);
});

const maintenanceDue = computed(() => {
  // This would be calculated based on maintenance schedules
  return 0;
});

// Methods
const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const selectBike = (bike: Bike) => {
  bikesStore.setCurrentBike(bike);
  router.push(`/bikes/${bike.id}`);
};

const editBike = (bike: Bike) => {
  startAjaxBar();
  setTimeout(() => {
    stopAjaxBar();
  }, 2000);
  // bikesStore.setCurrentBike(bike);
  // router.push(`/bikes/${bike.id}/edit`);
};

const deleteBike = async (bikeId: string) => {
  if (confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
    try {
      // Example: Wrap async operation with ajax-bar (loading indicator)
      await withAjaxBar(bikesStore.deleteBike(bikeId));
      showSuccess('Bike deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete bike:', err);
      showError(err.message || 'Failed to delete bike');
    }
  }
};

const handleAddBike = async () => {
  try {
    // Example: Wrap async operation with ajax-bar
    await withAjaxBar(bikesStore.createBike(newBike.value));
    showAddBikeModal.value = false;
    // Reset form
    newBike.value = {
      name: '',
      type: BikeType.Other
    };
    showSuccess('Bike added successfully');
  } catch (err: any) {
    console.error('Failed to create bike:', err);
    showError(err.message || 'Failed to create bike');
  }
};

// Lifecycle
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  try {
    await bikesStore.ensureBikes();
  } catch (err) {
    console.error('Failed to fetch bikes:', err);
  }
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
  background-color: #f8fafc;
}

.dashboard-header {
  background: white;
  padding: 20px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-title {
  color: #1a202c;
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  color: #4a5568;
  font-weight: 500;
}

.logout-button {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background: #c53030;
}

.dashboard-main {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  color: #4a5568;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-number {
  color: #1a202c;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.primary {
  background: #667eea;
  color: white;
}

.action-button.primary:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.action-button.secondary:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.icon {
  font-size: 1rem;
}

.bikes-section h2 {
  color: #1a202c;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 48px;
  color: #718096;
}

.error {
  color: #e53e3e;
}

.bikes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.bike-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.bike-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.bike-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.bike-name {
  color: #1a202c;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.bike-type {
  background: #edf2f7;
  color: #4a5568;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.bike-details {
  margin-bottom: 20px;
}

.bike-parts {
  color: #718096;
  font-size: 0.75rem;
  margin: 0;
}

.bike-actions {
  display: flex;
  gap: 8px;
}

.edit-button, .delete-button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button {
  background: #4299e1;
  color: white;
}

.edit-button:hover {
  background: #3182ce;
}

.delete-button {
  background: #e53e3e;
  color: white;
}

.delete-button:hover {
  background: #c53030;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  color: #1a202c;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 24px 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.cancel-button, .submit-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button {
  background: #e2e8f0;
  color: #4a5568;
}

.cancel-button:hover {
  background: #cbd5e0;
}

.submit-button {
  background: #667eea;
  color: white;
}

.submit-button:hover {
  background: #5a67d8;
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .dashboard-main {
    padding: 20px;
  }
  
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
  
  .dashboard-actions {
    flex-direction: column;
  }
  
  .bikes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
