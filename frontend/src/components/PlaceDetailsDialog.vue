<template>
  <div class="dialog-overlay">
    <div class="dialog-content">
      <button @click="$emit('close')" class="close-button">×</button>
      <button 
        v-if="canDelete" 
        @click="handleDelete" 
        class="delete-button"
      >
        Delete
      </button>
      <!-- Title -->
      <div class="dialog-header">
        <input 
          v-if="isEditing" 
          v-model="editedPlace.name" 
          class="name-input"
          @keyup.enter="toggleEdit"
        />
        <h2 v-else class="place-name">{{ place?.name || 'New Place' }}</h2>
      </div>

      <!-- Images Section First -->
      <div class="images-section">
        <h3>({{ place?.images?.length || 0 }}/3)</h3>
        <div v-if="(place?.images?.length || 0) > 0" class="image-grid">
          <div 
            v-for="(image, index) in (place?.images || [])" 
            :key="index" 
            class="image-container"
            @click="showFullscreen(image)"
          >
            <img :src="image" :alt="'Image ' + (index + 1)" class="place-image" />
            <button @click.stop="removeImage(index)" class="remove-image">×</button>
          </div>
        </div>
        <div v-if="(place?.images?.length || 0) < 3" class="upload-section">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            ref="fileInput"
            class="hidden"
          />
          <button @click="$refs.fileInput.click()" class="add-image-button">
            Add Image
          </button>
        </div>
      </div>

      <!-- Voting Section -->
      <div class="voting-section">
        <button 
          @click="handleVote('down')" 
          :class="['vote-button', { active: hasVoted === 'down' }]"
          :disabled="place?.hasVoted"
        >
          ▼
        </button>
        <span class="vote-count">{{ place?.votes || 0 }}</span>
        <button 
          @click="handleVote('up')" 
          :class="['vote-button', { active: hasVoted === 'up' }]"
          :disabled="place?.hasVoted"
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

      <!-- Details Tab Content -->
      <div v-if="activeTab === 'details'" class="tab-content">
        <div class="description-section">
          <textarea
            v-if="isEditing"
            v-model="editedPlace.description"
            class="description-input"
            rows="4"
            placeholder="Add description here..."
          ></textarea>
          <p v-else class="description-text">{{ place?.description || 'Add description here...' }}</p>
          <button @click="toggleEdit" class="edit-button">
            {{ isEditing ? 'Save' : 'Edit' }}
          </button>
        </div>

        <div class="metadata-section">
          <p class="last-edited">{{ formatDate(place?.lastEdited) }}</p>
          <p class="contact-info">pm for issue ronlim016@gmail.com</p>
        </div>
      </div>

      <!-- Comments Tab Content -->
      <div v-if="activeTab === 'comments'" class="tab-content">
        <div class="comments-section">
          <textarea
            v-model="newComment"
            class="comment-input"
            placeholder="Add a comment..."
            rows="3"
          ></textarea>
          <button @click="addComment" class="add-comment-button">
            Add Comment
          </button>

          <div class="comments-list">
            <div v-for="comment in (place?.comments || [])" :key="comment.id" class="comment">
              <p class="comment-text">{{ comment.text }}</p>
              <p class="comment-date">{{ comment.date }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Fullscreen Image Modal -->
  <div v-if="fullscreenImage" class="fullscreen-overlay" @click="closeFullscreen">
    <img :src="fullscreenImage" alt="Fullscreen view" class="fullscreen-image" />
  </div>
</template>

<script>
import { ref, reactive, watch,computed } from 'vue';
import { supabase } from '../services/supabase';
export default {
  name: 'PlaceDetailsDialog',
  props: {
    place: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'update','delete'],
  setup(props, { emit }) {
    const isEditing = ref(false);
    const hasVoted = ref(null);
    const activeTab = ref('details');
    const newComment = ref('');
    const editedPlace = reactive({ ...props.place });
    const user = ref(null);
    const fullscreenImage = ref(null);

    watch(() => props.place, (newPlace) => {
      Object.assign(editedPlace, newPlace);
    }, { deep: true });

    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user.value = currentUser;
    };
    
    getUser();

    const canDelete = computed(() => {
      if (!props.place || !user.value) return false;
      const isOwner = props.place.user_id === user.value.id;
      const isAdmin = user.value.email === 'your-admin-email@example.com'; // Replace with actual admin email
      return isOwner || isAdmin;
    });

    const handleDelete = async () => {
      if (!canDelete.value) {
        alert('You do not have permission to delete this place');
        return;
      }

      if (confirm('Are you sure you want to delete this place?')) {
        try {
          const { error } = await supabase
            .from('places')
            .delete()
            .eq('id', props.place.id);

          if (error) throw error;
          emit('delete', props.place.id);
          emit('close');
        } catch (error) {
          console.error('Error deleting place:', error);
          alert('Failed to delete place');
        }
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Not edited yet';
      return new Date(dateString).toLocaleDateString();
    };

    const handleVote = (type) => {
      if (props.place?.hasVoted) return;

      const updatedPlace = { ...props.place };
      const voteChange = type === 'up' ? 1 : -1;
      updatedPlace.votes = (updatedPlace.votes || 0) + voteChange;
      updatedPlace.hasVoted = true;
      hasVoted.value = type;
      emit('update', updatedPlace);
    };

    const toggleEdit = () => {
      if (isEditing.value) {
        emit('update', editedPlace);
      }
      isEditing.value = !isEditing.value;
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file && (props.place?.images?.length || 0) < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const updatedPlace = { 
            ...props.place,
            images: [...(props.place?.images || []), e.target.result]
          };
          emit('update', updatedPlace);
        };
        reader.readAsDataURL(file);
      }
    };

    const removeImage = (index) => {
      const updatedImages = [...(props.place?.images || [])];
      updatedImages.splice(index, 1);
      emit('update', { ...props.place, images: updatedImages });
    };

    const addComment = () => {
      if (!newComment.value.trim()) return;
      
      const comment = {
        id: Date.now(),
        text: newComment.value.trim(),
        date: new Date().toLocaleString()
      };

      const updatedPlace = {
        ...props.place,
        comments: [...(props.place?.comments || []), comment]
      };

      emit('update', updatedPlace);
      newComment.value = '';
    };

    const showFullscreen = (image) => {
      fullscreenImage.value = image;
    };

    const closeFullscreen = () => {
      fullscreenImage.value = null;
    };

    return {
      isEditing,
      editedPlace,
      hasVoted,
      activeTab,
      newComment,
      canDelete,
      handleDelete,
      formatDate,
      handleVote,
      toggleEdit,
      handleImageUpload,
      removeImage,
      addComment,
      fullscreenImage,
      showFullscreen,
      closeFullscreen
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
</style>