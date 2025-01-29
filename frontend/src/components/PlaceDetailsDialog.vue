<template>
  <div class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog-content">
      <button @click="closeDialog" class="close-button">×</button>
      
      <!-- Delete Button -->
      <button 
        v-if="canDelete" 
        @click="handleDelete" 
        class="delete-button"
      >
        Delete
      </button>

      <!-- Header Section -->
      <div class="dialog-header">
        <input 
          v-if="isEditing" 
          v-model="editedPlace.name" 
          class="name-input"
          @keyup.enter="saveEdits"
        >
        <h2 v-else class="place-name">{{ place.name || 'Unnamed Place' }}</h2>
      </div>

      <!-- Images Section -->
      <div class="images-section">
        <h3>({{ editedPlace.images?.length || 0 }}/3)</h3>
        <div v-if="editedPlace.images?.length" class="image-grid">
          <div 
            v-for="(image, index) in editedPlace.images" 
            :key="index"
            class="image-container"
          >
            <img 
              :src="image" 
              :alt="`Image ${index + 1}`" 
              class="place-image"
              @click="showFullscreen(image)"
            >
            <button 
              v-if="isEditing"
              @click="removeImage(index)"
              class="remove-image"
            >
              ×
            </button>
          </div>
        </div>
        
        <!-- Image Upload -->
        <div v-if="isEditing && (editedPlace.images?.length || 0) < 3" class="upload-section">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            ref="fileInput"
            class="hidden"
          >
          <button 
            @click="$refs.fileInput.click()"
            class="add-image-button"
          >
            Add Image
          </button>
        </div>
      </div>

      <!-- Voting Section -->
      <div class="voting-section">
        <button 
          @click="handleVote('down')"
          :class="['vote-button', { active: hasVoted === 'down' }]"
          :disabled="place.hasVoted"
        >
          ▼
        </button>
        <span class="vote-count">{{ editedPlace.votes || 0 }}</span>
        <button 
          @click="handleVote('up')"
          :class="['vote-button', { active: hasVoted === 'up' }]"
          :disabled="place.hasVoted"
        >
          ▲
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          :class="['tab-button', { active: activeTab === 'details' }]"
          @click="activeTab = 'details'"
        >
          Details
        </button>
        <button 
          :class="['tab-button', { active: activeTab === 'comments' }]"
          @click="activeTab = 'comments'"
        >
          Comments
        </button>
      </div>

      <!-- Details Tab -->
      <div v-show="activeTab === 'details'" class="tab-content">
        <div class="description-section">
          <!-- Type Selector -->
          <div v-if="isEditing" class="type-selector">
            <label>Category:</label>
            <select v-model="editedPlace.type" class="type-select">
              <option 
                v-for="type in PLACE_TYPES" 
                :key="type.value" 
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Description Editor -->
          <textarea
            v-if="isEditing"
            v-model="editedPlace.description"
            class="description-input"
            rows="4"
            placeholder="Add description..."
          ></textarea>
          <p v-else class="description-text">
            {{ editedPlace.description || 'No description available' }}
          </p>

          <!-- Edit/Save Button -->
          <button 
            v-if="canEdit"
            @click="toggleEdit"
            class="edit-button"
          >
            {{ isEditing ? 'Save' : 'Edit' }}
          </button>
        </div>

        <!-- Metadata -->
        <div class="metadata-section">
          <p class="last-edited">
            Last edited: {{ formattedLastEdited }}
          </p>
        </div>
      </div>

      <!-- Comments Tab -->
      <div v-show="activeTab === 'comments'" class="tab-content">
        <div class="comments-section">
          <textarea
            v-model="newComment"
            class="comment-input"
            placeholder="Add a comment..."
            rows="3"
          ></textarea>
          <button 
            @click="addComment"
            class="add-comment-button"
            :disabled="!newComment.trim()"
          >
            Post Comment
          </button>

          <div class="comments-list">
            <div 
              v-for="comment in editedPlace.comments" 
              :key="comment.id" 
              class="comment"
            >
              <p class="comment-text">{{ comment.text }}</p>
              <p class="comment-date">{{ formatDate(comment.date) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Image -->
    <div 
      v-if="fullscreenImage" 
      class="fullscreen-overlay" 
      @click="closeFullscreen"
    >
      <img :src="fullscreenImage" class="fullscreen-image">
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue';
import { supabase } from '../services/supabase';

export default {
  name: 'PlaceDetailsDialog',
  props: {
    place: { type: Object, required: true },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false }
  },
  emits: ['close', 'update', 'delete'],
  setup(props, { emit }) {
    // State management
    const isEditing = ref(false);
    const activeTab = ref('details');
    const hasVoted = ref(null);
    const newComment = ref('');
    const fullscreenImage = ref(null);
    const editedPlace = reactive({ ...props.place });
    const PLACE_TYPES = [
      { value: 'office', label: '🏛️ Office' },
      { value: 'building', label: '🏢 Building' },
      { value: 'restaurant', label: '🥣 Restaurant' },
      { value: 'shipping', label: '📦 Shipping' },
      { value: 'laundry', label: '👕 Laundry' },
      { value: 'church', label: '⛪ Church' },
      { value: 'store', label: '🏪 Store' },
      { value: 'barber', label: '✂️ Barber' }
    ];

    // Watchers
    watch(() => props.place, (newPlace) => {
      Object.assign(editedPlace, newPlace);
    });

    // Computed properties
    const formattedLastEdited = computed(() => {
      return new Date(editedPlace.lastEdited).toLocaleString();
    });

    // Methods
    const toggleEdit = async () => {
      if (isEditing.value) {
        try {
          const { error } = await supabase
            .from('places')
            .update({
              name: editedPlace.name,
              description: editedPlace.description,
              type: editedPlace.type,
              images: editedPlace.images,
              last_edited: new Date().toISOString()
            })
            .eq('id', editedPlace.id);

          if (error) throw error;
          emit('update', editedPlace);
        } catch (error) {
          console.error('Update error:', error);
          alert('Failed to save changes');
        }
      }
      isEditing.value = !isEditing.value;
    };

  // Inside PlaceDetailsDialog.vue setup()

const handleVote = async (direction) => {
  if (!user.value) {
    emit('request-login');
    return;
  }

  try {
    const voteValue = direction === 'up' ? 1 : -1;
    
    const { data, error } = await supabase
      .from('places')
      .update({ 
        votes: editedPlace.votes + voteValue,
        voted_users: [...(editedPlace.voted_users || []), user.value.id]
      })
      .eq('id', editedPlace.id)
      .select()
      .single();

    if (error) throw error;
    
    editedPlace.votes = data.votes;
    editedPlace.voted_users = data.voted_users;
    hasVoted.value = direction;
    emit('update', editedPlace);
  } catch (error) {
    console.error('Voting error:', error);
    alert('Failed to vote');
  }
};

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this place?')) return;
  
  try {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', editedPlace.id)
      .eq('user_id', user.value.id); // Ensure only owner can delete

    if (error) throw error;
    
    emit('delete', editedPlace.id);
    emit('close');
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete place');
  }
};

// Add image handling
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file size and type
  if (file.size > 5000000) { // 5MB limit
    alert('Image too large. Maximum size is 5MB.');
    return;
  }

  try {
    // Convert to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    // Update place with new image
    const { data, error } = await supabase
      .from('places')
      .update({
        images: [...(editedPlace.images || []), base64].slice(-3) // Keep last 3 images
      })
      .eq('id', editedPlace.id)
      .select()
      .single();

    if (error) throw error;
    
    editedPlace.images = data.images;
    emit('update', editedPlace);
  } catch (error) {
    console.error('Image upload error:', error);
    alert('Failed to upload image');
  }
};
    // Helper methods
    const closeDialog = () => emit('close');
    const showFullscreen = (img) => fullscreenImage.value = img;
    const closeFullscreen = () => fullscreenImage.value = null;
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

    return {
      isEditing,
      activeTab,
      editedPlace,
      PLACE_TYPES,
      newComment,
      hasVoted,
      fullscreenImage,
      formattedLastEdited,
      toggleEdit,
      handleVote,
      handleDelete,
      handleImageUpload,
      removeImage,
      addComment,
      closeDialog,
      showFullscreen,
      closeFullscreen,
      formatDate
    };
  }
};
</script>
<style scoped>
.delete-button {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  z-index: 2000;
}

.delete-button:hover {
  background: #c82333;
}
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 40px 20px 20px 20px; 
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-header {
  margin-bottom: 10px;
}

.place-name {
  font-size: 24px;
  margin: 0;
}

/* Images section styles */
.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 14px;
  padding: 0;
}

.remove-image:hover {
  background: rgba(0, 0, 0, 0.7);
}

.images-section {
  margin: 10px 0 20px 0;
  max-width: 100%;
}

.images-section h3 {
  margin-bottom: 10px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
  align-items: center; 
}
.image-container {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s;
  padding-top: 75%; /* This creates a consistent aspect ratio */
}

.image-container:hover {
  transform: scale(1.02);
}

.place-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
}


.add-image-button {
  width: 100%;
  padding: 10px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
}

.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2500;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  background: none;
}

/* Voting section styles */
.voting-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.vote-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
}

.vote-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-button.active {
  color: #2196F3;
}

.vote-count {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  min-width: 30px;
  text-align: center;
}

/* Tabs styles */
.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
}

/* Content styles */
.description-section {
  margin-bottom: 20px;
}

.description-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  resize: vertical;
}

.description-text {
  margin-bottom: 10px;
  line-height: 1.5;
}

.edit-button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.last-edited {
  font-size: 14px;
  color: #666;
}

.hidden {
  display: none;
}

/* Comments styles */
.comments-section {
  margin-top: 10px;
}

.comment-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  resize: vertical;
}

.add-comment-button {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comments-list {
  margin-top: 20px;
}

.comment {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.comment-text {
  margin: 0;
  line-height: 1.4;
}

.comment-date {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.type-select {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}
</style>

.hidden { display: none; }
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}
