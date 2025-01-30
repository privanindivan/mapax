<template>
  <div class="map-controls">
    <button @click="$emit('get-location')" class="control-button location-button">
      <span class="button-icon">🟢</span>
    </button>
    <button 
      @click="$emit('toggle-add-mode')"
      :class="[
        'control-button',
        'add-button',
        { 'add-button-active': isAddingMode }
      ]"
    >
      <span class="plus-icon">+</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MapControls',
  props: {
    isAddingMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['get-location', 'toggle-add-mode']
}
</script>

<style scoped>
.map-controls {
  position: fixed; /* Change to fixed instead of absolute */
  bottom: env(safe-area-inset-bottom, 20px); 
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  padding: 10px; /* Add padding for better touch area */
}

/* Add media queries for mobile responsiveness */
@media screen and (max-width: 768px) {
  .map-controls {
    bottom: env(safe-area-inset-bottom, 40px);
    right: 50%;
    transform: translateX(50%); /* Center horizontally */
    flex-direction: row; /* Buttons side by side on mobile */
    background: rgba(255, 255, 255, 0.9);
    border-radius: 25px;
    padding: 8px 16px;
  }

  .control-button {
    width: 45px; /* Slightly bigger for mobile touch */
    height: 45px;
  }
}

/* Keep your existing button styles */
.control-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.control-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.add-button-active {
  background: #ff4081;
  color: white;
}

.button-icon {
  font-size: 1.2em;
}

.plus-icon {
  font-size: 1.5em;
  font-weight: bold;
}
</style>
