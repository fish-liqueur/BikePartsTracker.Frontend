<template>
  <div class="view-container">
    <div class="view-content">
      <p>Manage your bike collection here.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Bikes view - placeholder for bike management
</script>

<style scoped>
.view-container {
  min-height: 100%;
  background-color: #f8fafc;
  padding: 32px;
}

.view-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-content p {
  color: #4a5568;
  font-size: 1rem;
  margin: 0;
}

@media (max-width: 768px) {
  .view-container {
    padding: 20px;
  }
}
</style>

