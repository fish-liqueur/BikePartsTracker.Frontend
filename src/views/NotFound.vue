<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">
        <q-icon name="error_outline" size="120px" color="grey-6" />
      </div>
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">Page Not Found</h2>
      <p class="not-found-message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <q-btn
        color="primary"
        label="Go to Home"
        icon="home"
        to="/home"
        size="lg"
        class="q-mt-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 Not Found page
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  background-color: #f8fafc;
  padding: 32px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.not-found-icon {
  margin-bottom: 24px;
}

.not-found-title {
  color: #1a202c;
  font-size: 6rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.not-found-subtitle {
  color: #4a5568;
  font-size: 2rem;
  font-weight: 600;
  margin: 16px 0;
}

.not-found-message {
  color: #718096;
  font-size: 1.125rem;
  margin: 16px 0 32px 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .not-found-container {
    padding: 20px;
  }

  .not-found-title {
    font-size: 4rem;
  }

  .not-found-subtitle {
    font-size: 1.5rem;
  }

  .not-found-message {
    font-size: 1rem;
  }
}
</style>

