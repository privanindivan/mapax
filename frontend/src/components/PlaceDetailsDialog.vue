<template>
  <div class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog-content">
      <button @click="closeDialog" class="close-button">×</button>
      
      <!-- Delete Button -->
<!-- In template -->
<button 
  v-if="props.place.user_id === user?.id"  
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
          class="vote-button"
           :disabled="hasVoted"
        >
          ▼
        </button>
        <span class="vote-count">{{ editedPlace.votes || 0 }}</span>
        <button 
          @click="handleVote('up')"
          class="vote-button"
          :disabled="hasVoted" 
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
              <option value="default">📍 Default</option>
              <option value="office">🏛️ Office</option>
              <option value="building">🏢 Building</option>
              <option value="restaurant">🥣 Restaurant</option>
              <option value="shipping">📦 Shipping</option>
              <option value="laundry">👕 Laundry</option>
              <option value="church">⛪ Church</option>
              <option value="store">🏪 Store</option>
              <option value="barber">✂️ Barber</option>
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

// In PlaceDetailsDialog.vue
<template>
  <div class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog-content">
      <button @click="closeDialog" class="close-button">×</button>
      
      <!-- Delete Button -->
<!-- In template -->
<button 
  v-if="props.place.user_id === user?.id"  
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
          class="vote-button"
           :disabled="hasVoted"
        >
          ▼
        </button>
        <span class="vote-count">{{ editedPlace.votes || 0 }}</span>
        <button 
          @click="handleVote('up')"
          class="vote-button"
          :disabled="hasVoted" 
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
              <option value="default">📍 Default</option>
              <option value="office">🏛️ Office</option>
              <option value="building">🏢 Building</option>
              <option value="restaurant">🥣 Restaurant</option>
              <option value="shipping">📦 Shipping</option>
              <option value="laundry">👕 Laundry</option>
              <option value="church">⛪ Church</option>
              <option value="store">🏪 Store</option>
              <option value="barber">✂️ Barber</option>
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

// In PlaceDetailsDialog.vue
<script>
import { ref, reactive, computed, watch } from 'vue'
import { supabase } from '../services/supabase'

export default {
 name: 'PlaceDetailsDialog',
 props: {
   place: { type: Object, required: true },
   canEdit: { type: Boolean, default: false },
   canDelete: { type: Boolean, default: false }
 },
 emits: ['close', 'update', 'delete'],
 
 setup(props, { emit }) {
   const isEditing = ref(false)
   const activeTab = ref('details')
   const newComment = ref('')
   const fullscreenImage = ref(null)
   const fileInput = ref(null)
   const editedPlace = reactive({ ...props.place })
   const hasVoted = ref(false)
const user = ref(supabase.auth.user())

   watch(() => props.place, (newPlace) => {
     Object.assign(editedPlace, newPlace)
   })

const formattedLastEdited = computed(() => {
  if (!editedPlace.last_edited) return 'Not edited'
  const date = new Date(editedPlace.last_edited)
  if (isNaN(date.getTime())) return 'Not edited'
  return date.toLocaleString()
})
   const toggleEdit = async () => {
     if (isEditing.value) {
       try {
         const updates = {
           name: editedPlace.name,
           description: editedPlace.description,
           type: editedPlace.type,
           last_edited: new Date().toISOString()
         }

         const { error } = await supabase
           .from('places')
           .update(updates)
           .eq('id', editedPlace.id)

         if (error) throw error
         emit('update', { ...editedPlace, ...updates })
         isEditing.value = false
       } catch (error) {
         alert('Failed to save changes. Only creator can edit.')
       }
     } else {
       isEditing.value = true
     }
   }

  const handleVote = async (direction) => {
  if (!user.value) {
    alert('Please login to vote')
    return
  }

  if (editedPlace.voted_users?.includes(user.value.id)) {
    alert('You have already voted')
    return
  }

  try {
    const voteValue = direction === 'up' ? 1 : -1
    const { data, error } = await supabase
      .from('places')
      .update({ 
        votes: (editedPlace.votes || 0) + voteValue,
        voted_users: [...(editedPlace.voted_users || []), user.value.id]
      })
      .eq('id', editedPlace.id)
      .select()
      .single()

    if (error) throw error
    editedPlace.votes = data.votes
    editedPlace.voted_users = data.voted_users
    emit('update', editedPlace)
  } catch (error) {
    alert('Failed to vote')
  }
}

   const handleDelete = async () => {
     if (!confirm('Are you sure you want to delete this place?')) return
     
     try {
       const { error } = await supabase
         .from('places')
         .delete()
         .eq('id', editedPlace.id)
         .eq('user_id', props.place.user_id)  // Only owner can delete

       if (error) throw error
       emit('delete', editedPlace.id)
       emit('close')
     } catch (error) {
       alert('Failed to delete place. Only creator can delete.')
     }
   }

   const handleImageUpload = async (event) => {
     const file = event.target.files[0]
     if (!file) return
     
     if (file.size > 5000000) {
       alert('Image too large. Maximum size is 5MB.')
       return
     }
     
     try {
       const base64 = await new Promise((resolve) => {
         const reader = new FileReader()
         reader.onload = () => resolve(reader.result)
         reader.readAsDataURL(file)
       })

       const updatedImages = [...(editedPlace.images || []), base64].slice(-3)
       
       const { error } = await supabase
         .from('places')
         .update({ 
           images: updatedImages,
           last_edited: new Date().toISOString()
         })
         .eq('id', editedPlace.id)
         .eq('user_id', props.place.user_id)

       if (error) throw error
       editedPlace.images = updatedImages
       emit('update', { ...editedPlace })
     } catch (error) {
       alert('Failed to upload image')
     } finally {
       if (fileInput.value) {
         fileInput.value.value = ''
       }
     }
   }

   const removeImage = async (index) => {
     try {
       const updatedImages = [...(editedPlace.images || [])]
       updatedImages.splice(index, 1)

       const { error } = await supabase
         .from('places')
         .update({ images: updatedImages })
         .eq('id', editedPlace.id)
         .eq('user_id', props.place.user_id)

       if (error) throw error
       editedPlace.images = updatedImages
       emit('update', editedPlace)
     } catch (error) {
       alert('Failed to remove image')
     }
   }

   const addComment = async () => {
     if (!newComment.value.trim()) return

     try {
       const comment = {
         id: Date.now(),
         text: newComment.value.trim(),
         date: new Date().toISOString()
       }

       const updatedComments = [...(editedPlace.comments || []), comment]

       const { error } = await supabase
         .from('places')
         .update({ comments: updatedComments })
         .eq('id', editedPlace.id)

       if (error) throw error
       editedPlace.comments = updatedComments
       newComment.value = ''
       emit('update', editedPlace)
     } catch (error) {
       alert('Failed to add comment')
     }
   }

   const closeDialog = () => emit('close')
   const showFullscreen = (img) => fullscreenImage.value = img
   const closeFullscreen = () => fullscreenImage.value = null
   const formatDate = (dateString) => new Date(dateString).toLocaleDateString()

   return {
     isEditing,
     activeTab,
     editedPlace,
     newComment,
     fullscreenImage,
     fileInput,
     formattedLastEdited,
     hasVoted,
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
   }
 }
}
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
  z-index: 2000;
}

.delete-button:hover {
  background: #c82333;
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
  margin-bottom: 20px;
}

.place-name {
  font-size: 24px;
  margin: 0;
}

.name-input {
  width: 100%;
  padding: 8px;
  font-size: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

/* Images */
.images-section {
  margin: 20px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 0;
}

.image-container {
  position: relative;
  padding-top: 100%;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.place-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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
  font-size: 14px;
}
.add-image-button {
  width: 100%;
  padding: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-image-button:hover {
  background: #1976D2;
}

/* Voting Section */
.voting-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 20px 0;
}

.vote-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  transition: transform 0.2s;
}

.vote-button:hover {
  transform: scale(1.2);
}

.vote-count {
  font-size: 20px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

/* Tabs */
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
  transition: all 0.3s;
}

.tab-button.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
}

/* Content */
.tab-content {
  padding: 10px 0;
}

.description-section {
  margin-bottom: 20px;
}

.type-selector {
  margin-bottom: 15px;
}

.type-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.description-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
}

.description-text {
  line-height: 1.5;
  color: #333;
}

.edit-button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background: #43A047;
}

.metadata-section {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.last-edited {
  font-size: 12px;
  color: #666;
}

/* Comments */
.comments-section {
  margin-top: 10px;
}

.comment-input {
  width: 100%;
  padding: 8px;
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
  transition: background-color 0.3s;
}

.add-comment-button:hover {
  background: #1976D2;
}

.add-comment-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  margin-top: 20px;
}

.comment {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.comment:last-child {
  border-bottom: none;
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

/* Fullscreen Image */
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
}

.hidden {
  display: none;
}
</style>
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
  z-index: 2000;
}

.delete-button:hover {
  background: #c82333;
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
  margin-bottom: 20px;
}

.place-name {
  font-size: 24px;
  margin: 0;
}

.name-input {
  width: 100%;
  padding: 8px;
  font-size: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

/* Images */
.images-section {
  margin: 20px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 0;
}

.image-container {
  position: relative;
  padding-top: 100%;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.place-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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
  font-size: 14px;
}
.add-image-button {
  width: 100%;
  padding: 8px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-image-button:hover {
  background: #1976D2;
}

/* Voting Section */
.voting-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 20px 0;
}

.vote-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  transition: transform 0.2s;
}

.vote-button:hover {
  transform: scale(1.2);
}

.vote-count {
  font-size: 20px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

/* Tabs */
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
  transition: all 0.3s;
}

.tab-button.active {
  color: #2196F3;
  border-bottom-color: #2196F3;
}

/* Content */
.tab-content {
  padding: 10px 0;
}

.description-section {
  margin-bottom: 20px;
}

.type-selector {
  margin-bottom: 15px;
}

.type-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.description-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 100px;
}

.description-text {
  line-height: 1.5;
  color: #333;
}

.edit-button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background: #43A047;
}

.metadata-section {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.last-edited {
  font-size: 12px;
  color: #666;
}

/* Comments */
.comments-section {
  margin-top: 10px;
}

.comment-input {
  width: 100%;
  padding: 8px;
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
  transition: background-color 0.3s;
}

.add-comment-button:hover {
  background: #1976D2;
}

.add-comment-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  margin-top: 20px;
}

.comment {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.comment:last-child {
  border-bottom: none;
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

/* Fullscreen Image */
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
}

.hidden {
  display: none;
}
</style>
