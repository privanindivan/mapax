<template>
    <div class="marker-popup">
      <div class="popup-header">
        <h3>{{ name || 'New Place' }}</h3>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>
      <div class="popup-content">
        <p>{{ description || 'Add description' }}</p>
        <div class="popup-footer">
          <button class="edit-button" @click="$emit('edit')">Edit</button>
          <span class="last-updated">Last updated: {{ lastEdited || 'Not edited' }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MarkerPopup',
    props: {
      name: String,
      description: String,
      lastEdited: String
    },
    emits: ['close', 'edit']
  }
  </script>
  
  <style scoped>
  .marker-popup {
    min-width: 200px;
    padding: 10px;
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    padding: 0 5px;
  }
  
  .edit-button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .popup-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }
  
  .last-updated {
    font-size: 0.8em;
    color: #666;
  }
  </style>