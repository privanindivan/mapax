# First, in your supabase.js file:
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

# Then, the PlaceDetails.vue component:
<template>
  <div v-if="place" class="place-details">
    <div class="header">
      <h3>{{ place.name }}</h3>
      <div class="actions">
        <button v-if="canEdit" @click="toggleEdit">
          {{ isEditing ? 'Save' : 'Edit' }}
        </button>
        <button v-if="canDelete" @click="handleDelete" class="delete-btn">
          Delete
        </button>
      </div>
    </div>

    <div class="images">
      <div v-for="(image, index) in place.images" :key="index" class="image-wrapper">
        <img :src="image" :alt="place.name" />
        <button v-if="isEditing" @click="removeImage(index)" class="remove-btn">×</button>
      </div>
      
      <div v-if="isEditing && (!place.images || place.images.length < 3)" class="upload-wrapper">
        <input 
          type="file" 
          @change="handleImageUpload"
          accept="image/*"
          ref="fileInput"
          class="hidden"
        />
        <button @click="$refs.fileInput.click()" class="upload-btn">
          Add Image
        </button>
      </div>
    </div>

    <div class="details">
      <div v-if="isEditing">
        <input v-model="editedPlace.name" placeholder="Name" />
        <select v-model="editedPlace.type">
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
        <textarea 
          v-model="editedPlace.description" 
          placeholder="Description"
          rows="4"
        ></textarea>
      </div>
      <div v-else>
        <p>{{ place.description }}</p>
      </div>
    </div>

    <div class="votes">
      <button @click="handleVote('up')" :disabled="hasVoted">▲</button>
      <span>{{ place.votes || 0 }}</span>
      <button @click="handleVote('down')" :disabled="hasVoted">▼</button>
    </div>

    <div class="comments">
      <textarea 
        v-model="newComment" 
        placeholder="Add a comment..."
        rows="3"
      ></textarea>
      <button 
        @click="addComment"
        :disabled="!newComment.trim()"
      >
        Post
      </button>

      <div class="comments-list">
        <div v-for="comment in sortedComments" :key="comment.id" class="comment">
          <p>{{ comment.text }}</p>
          <span>{{ formatDate(comment.date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { supabase } from '../supabase'

export default {
  name: 'PlaceDetails',
  
  props: {
    place: {
      type: Object,
      required: true
    },
    userId: {
      type: String,
      default: null
    }
  },

  emits: ['update', 'delete'],

  setup(props, { emit }) {
    const isEditing = ref(false)
    const editedPlace = ref({ ...props.place })
    const newComment = ref('')
    const fileInput = ref(null)
    const hasVoted = ref(false)

    // Computed
    const canEdit = computed(() => 
      props.userId && props.userId === props.place.user_id
    )

    const canDelete = computed(() => 
      props.userId && props.userId === props.place.user_id
    )

    const sortedComments = computed(() => {
      const comments = props.place.comments || []
      return [...comments].sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    // Methods
    const toggleEdit = async () => {
      if (isEditing.value) {
        try {
          const { error } = await supabase
            .from('places')
            .update({
              name: editedPlace.value.name,
              description: editedPlace.value.description,
              type: editedPlace.value.type,
              last_edited: new Date().toISOString()
            })
            .eq('id', props.place.id)

          if (error) throw error

          emit('update', { ...editedPlace.value })
          isEditing.value = false
        } catch (error) {
          console.error('Update error:', error)
          alert('Failed to save changes')
        }
      } else {
        editedPlace.value = { ...props.place }
        isEditing.value = true
      }
    }

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this place?')) return

      try {
        const { error } = await supabase
          .from('places')
          .delete()
          .eq('id', props.place.id)

        if (error) throw error

        emit('delete', props.place.id)
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete place')
      }
    }

    const handleImageUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      try {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })

        const images = [...(props.place.images || []), base64].slice(-3)

        const { error } = await supabase
          .from('places')
          .update({ images })
          .eq('id', props.place.id)

        if (error) throw error

        emit('update', { ...props.place, images })
      } catch (error) {
        console.error('Image upload error:', error)
        alert('Failed to upload image')
      } finally {
        if (fileInput.value) {
          fileInput.value.value = ''
        }
      }
    }

    const removeImage = async (index) => {
      try {
        const images = [...(props.place.images || [])]
        images.splice(index, 1)

        const { error } = await supabase
          .from('places')
          .update({ images })
          .eq('id', props.place.id)

        if (error) throw error

        emit('update', { ...props.place, images })
      } catch (error) {
        console.error('Remove image error:', error)
        alert('Failed to remove image')
      }
    }

    const handleVote = async (direction) => {
      if (hasVoted.value) return

      try {
        const voteValue = direction === 'up' ? 1 : -1
        const { data, error } = await supabase
          .rpc('increment_votes', { 
            place_id: props.place.id, 
            increment: voteValue 
          })

        if (error) throw error

        hasVoted.value = true
        emit('update', { ...props.place, votes: data.votes })
      } catch (error) {
        console.error('Vote error:', error)
        alert('Failed to vote')
      }
    }

    const addComment = async () => {
      if (!newComment.value.trim()) return

      try {
        const comment = {
          id: Date.now(),
          text: newComment.value.trim(),
          date: new Date().toISOString(),
          user_id: props.userId
        }

        const comments = [...(props.place.comments || []), comment]

        const { error } = await supabase
          .from('places')
          .update({ comments })
          .eq('id', props.place.id)

        if (error) throw error

        newComment.value = ''
        emit('update', { ...props.place, comments })
      } catch (error) {
        console.error('Comment error:', error)
        alert('Failed to add comment')
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      isEditing,
      editedPlace,
      newComment,
      fileInput,
      hasVoted,
      canEdit,
      canDelete,
      sortedComments,
      toggleEdit,
      handleDelete,
      handleImageUpload,
      removeImage,
      handleVote,
      addComment,
      formatDate
    }
  }
}
</script>

<style scoped>
.place-details {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.image-wrapper {
  position: relative;
  padding-top: 100%;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.upload-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
}

.details {
  margin-bottom: 20px;
}

.votes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.comments textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.comments-list {
  margin-top: 20px;
}

.comment {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.comment span {
  font-size: 12px;
  color: #666;
}

.hidden {
  display: none;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #2196F3;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

input,
select,
textarea {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
