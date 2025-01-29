<template>
  <div class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog-content">
      <button @click="closeDialog" class="close-button">×</button>
      
      <!-- Delete Button - Only visible to owner -->
      <button 
        v-if="isOwner" 
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
        
        <!-- Owner Badge -->
        <span v-if="isOwner" class="owner-badge">👑 Owner</span>
      </div>

      <!-- Images Section -->
      <div class="images-section">
        <h3>Images ({{ editedPlace.images?.length || 0 }}/3)</h3>
        <div v-if="editedPlace.images?.length" class="image-grid">
          <div 
            v-for="(image, index) in editedPlace.images" 
            :key="index"
            class="image-container"
          >
            <img 
              :src="image.url" 
              :alt="`Image ${index + 1}`" 
              class="place-image"
              @click="showFullscreen(image.url)"
            >
            <button 
              v-if="isOwner"
              @click="removeImage(index)"
              class="remove-image"
            >
              ×
            </button>
          </div>
        </div>
        
        <!-- Image Upload - Only for owner -->
        <div v-if="isOwner && (editedPlace.images?.length || 0) < 3" class="upload-section">
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
          :class="['vote-button', { active: userVote === 'down' }]"
          :disabled="loading"
        >
          ▼
        </button>
        <span class="vote-count">{{ editedPlace.votes || 0 }}</span>
        <button 
          @click="handleVote('up')"
          :class="['vote-button', { active: userVote === 'up' }]"
          :disabled="loading"
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

          <!-- Edit/Save Button - Only for owner -->
          <button 
            v-if="isOwner"
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
          <p class="created-by">
            Created by: {{ place.creator_name || 'Anonymous' }}
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
            :disabled="!newComment.trim() || loading"
          >
            Post Comment
          </button>

          <div class="comments-list">
            <div 
              v-for="comment in sortedComments" 
              :key="comment.id" 
              class="comment"
            >
              <p class="comment-text">{{ comment.text }}</p>
              <div class="comment-meta">
                <span class="comment-author">{{ comment.user_name || 'Anonymous' }}</span>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              </div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { supabase } from '../services/supabase';

export default {
  name: 'PlaceDetailsDialog',
  props: {
    place: { type: Object, required: true },
    userId: { type: String, required: true }
  },
  emits: ['close', 'update', 'delete'],
  
  setup(props, { emit }) {
    const loading = ref(false);
    const isEditing = ref(false);
    const activeTab = ref('details');
    const userVote = ref(null);
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
      { value: 'barber', label: '✂️ Barber' },
      { value: 'personal', label: '👤 Personal' }
    ];

    // Computed properties
    const isOwner = computed(() => props.userId === editedPlace.creator_id);
    
    const formattedLastEdited = computed(() => {
      return new Date(editedPlace.last_edited).toLocaleString();
    });

    const sortedComments = computed(() => {
      return [...(editedPlace.comments || [])].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    });

    // Load user's previous vote
    onMounted(async () => {
      const { data } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('place_id', props.place.id)
        .eq('user_id', props.userId)
        .single();
      
      if (data) {
        userVote.value = data.vote_type;
      }
    });

    // Methods
    const toggleEdit = async () => {
      if (isEditing.value) {
        loading.value = true;
        try {
          const { error } = await supabase
            .from('places')
            .update({
              name: editedPlace.name,
              description: editedPlace.description,
              type: editedPlace.type,
              last_edited: new Date().toISOString()
            })
            .eq('id', editedPlace.id);

          if (error) throw error;
          emit('update', editedPlace);
        } catch (error) {
          console.error('Update error:', error);
          alert('Failed to save changes');
        } finally {
          loading.value = false;
        }
      }
      isEditing.value = !isEditing.value;
    };

    const handleVote = async (direction) => {
      if (loading.value) return;
      loading.value = true;

      try {
        const voteChange = userVote.value === direction ? -1 : 1;
        
        // Update votes table
        if (userVote.value) {
          await supabase
            .from('votes')
            .delete()
            .eq('place_id', editedPlace.id)
            .eq('user_id', props.userId);
        }
        
        if (userVote.value !== direction) {
          await supabase
            .from('votes')
            .insert({
              place_id: editedPlace.id,
              user_id: props.userId,
              vote_type: direction
            });
        }

        // Update place votes count
        const { error } = await supabase
          .from('places')
          .update({ 
            votes: editedPlace.votes + voteChange
          })
          .eq('id', editedPlace.id);

        if (error) throw error;
        
        editedPlace.votes += voteChange;
        userVote.value = userVote.value === direction ? null : direction;
        emit('update', editedPlace);
      } catch (error) {
        console.error('Voting error:', error);
        alert('Voting failed');
      } finally {
        loading.value = false;
      }
    };

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this place? This action cannot be undone.')) return;
      
      loading.value = true;
      try {
        // Delete related records first
        await supabase
          .from('votes')
          .delete()
          .eq('place_id', editedPlace.id);
        
        await supabase
          .from('comments')
          .delete()
          .eq('place_id', editedPlace.id);

        // Delete images from storage
        for (const image of editedPlace.images || []) {
          await supabase.storage
            .from('place-images')
            .remove([image.path]);
        }

        // Finally delete the place
        const { error } = await supabase
          .from('places')
          .delete()
          .eq('id', editedPlace.id);

        if (error) throw error;
        emit('delete', editedPlace.id);
        closeDialog();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete place');
      } finally {
        loading.value = false;
      }
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      loading.value = true;
      try {
        // Upload to storage
        const filename = `${editedPlace.id}/${Date.now()}-${file.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('place-images')
          .upload(filename, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('place-images')
          .getPublicUrl(filename);

        // Update place record
        const newImage = {
          url: publicUrl,
          path: filename
        };

        const images = [...(editedPlace.images || []), newImage];
        const { error } = await supabase
          .from('places')
          .update({ images })
          .eq('id', editedPlace.id);

        if (error) throw error;

        editedPlace.images = images;
        emit('update', editedPlace);
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image');
      } finally {
        loading.value = false;
      }
    };

    const removeImage = async (index) => {
      loading.value = true;
      try {
        const imageToRemove = editedPlace.images[index];
        
        // Delete from storage
        await supabase.storage
          .from('place-images')
          .remove([imageToRemove.path]);

        // Update place record
        const images = editedPlace.images.filter((_, i) => i !== index);
        const { error } = await supabase
          .from('places')
          .update({ images })
          .eq('id', editedPlace.id);

        if (error) throw error;

        editedPlace.images = images;
        emit('update', editedPlace);
      } catch (error) {
        console.error('Image removal error:', error);
        alert('Failed to remove image');
      } finally {
        loading.value = false;
      }
    };

    const addComment = async () => {
      if (!newComment.value.trim() || loading.value) return;
      
      loading.value = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const comment = {
          text: newComment.value.trim(),
          user_id: user.id,
          user_name: user.user_metadata.full_name || 'Anonymous',
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('comments')
          .insert({
            place_id: editedPlace.id,
            ...comment
          });

        if (error) throw error;

        editedPlace.comments = [...(editedPlace.comments || []), comment];
        newComment.value = '';
        emit('update', editedPlace);
      } catch (error) {
        console.error('Comment error:', error);
        alert('Failed to add comment');
      } finally {
        loading.value = false;
      }
    };

    // Helper methods
    const closeDialog = () => emit('close');
    const showFullscreen = (img) => fullscreenImage.value = img;
    const closeFullscreen = () => fullscreenImage.value = null;
    const formatDate = (dateString) => new Date(dateString).toLocaleString();
return {
      loading,
      isEditing,
      activeTab,
      editedPlace,
      PLACE_TYPES,
      newComment,
      userVote,
      fullscreenImage,
      isOwner,
      formattedLastEdited,
      sortedComments,
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
  max-width: 600px;
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
}

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
}

.dialog-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.name-input {
  width: 100%;
  padding: 8px;
  font-size: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.owner-badge {
  background: #ffd700;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 14px;
}

.type-selector {
  margin-bottom: 15px;
}

.type-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.image-container {
  position: relative;
  padding-top: 75%;
}

.place-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden {
  display: none;
}

.add-image-button {
  width: 100%;
  padding: 10px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.voting-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.vote-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.vote-button.active {
  color: #2196F3;
}

.vote-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-count {
  font-size: 20px;
  font-weight: bold;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-button {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: #666;
}

.tab-button.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
}

.description-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
}

.edit-button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.metadata-section {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.comment-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
}

.add-comment-button {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.add-comment-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.comment-meta {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  display: flex;
  justify-content: space-between;
}

.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2500;
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}
</style>
