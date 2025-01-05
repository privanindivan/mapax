<template>
  <div class="app">
    <UserMenu 
      :user="user" 
      @login="showAuthModal = true"
      @logout="handleLogout"
    />
    <button 
      @click="toggleRanking" 
      :class="['ranking-button', { active: showRanking }]"
    >
      ⬆️ Rankings
    </button>

    <!-- Ranking Modal -->
    <div v-if="showRanking" class="ranking-overlay">
      <div class="ranking-content">
        <button @click="showRanking = false" class="close-button">×</button>
        <div class="ranking-list">
          <div v-for="place in sortedPlaces" :key="place.id" class="ranking-item">
            <span class="rank-number">{{ place.rank }}</span>
            <div class="rank-details">
              <h3>{{ place.name }}</h3>
              <p class="votes">{{ place.votes || 0 }} votes</p>
            </div>
            <button @click="selectAndCloseRanking(place.id)" class="view-button">View</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <AuthModal 
      v-if="showAuthModal" 
      @close="showAuthModal = false"
      @auth-success="handleAuthSuccess"
    />

    <MapView
      :markers="markers"
      :is-adding-mode="isAddingMode"
      @marker-click="selectMarker"
      @map-click="handleMapClick"
      @toggle-add-mode="toggleAddMode"
      @location-error="handleLocationError"
    />
    <PlaceDetailsDialog 
      v-if="selectedMarker" 
      :place="selectedMarker"
      :can-delete="canDeletePlace"
      @close="closeDialog"
      @update="updatePlace"
      @delete="handleDelete"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted,watch } from 'vue';
import MapView from './components/MapView.vue';
import PlaceDetailsDialog from './components/PlaceDetailsDialog.vue';
import UserMenu from './components/UserMenu.vue';
import AuthModal from './components/AuthModal.vue';
import { supabase } from './services/supabase';
import { auth } from './services/auth';


export default {
  name: 'App',
  components: {
    MapView,
    PlaceDetailsDialog,
    UserMenu,
    AuthModal
  },
  setup() {
    const markers = ref([]);
    const selectedMarker = ref(null);
    const isAddingMode = ref(false);
    const showRanking = ref(false);
    const user = ref(null);
    const showAuthModal = ref(false);

    // Computed properties
    const sortedPlaces = computed(() => {
      return [...markers.value]
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .map((place, index) => ({
          ...place,
          rank: index + 1
        }));
    });

    const canDeletePlace = computed(() => {
      if (!selectedMarker.value || !user.value) return false;
      return selectedMarker.value.user_id === user.value.id;
    });

    // Methods
    const loadPlaces = async () => {
  try {
    console.log('Loading places...');
    const response = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (response.error) {
      console.error('Supabase error:', response.error);
      throw response.error;
    }

    if (!response.data) {
      console.log('No places found');
      markers.value = [];
      return;
    }

    console.log('Places loaded:', response.data);
    markers.value = response.data.map(place => ({
      id: place.id,
      lat: place.latitude || 0,
      lng: place.longitude || 0,
      name: place.name || 'Unnamed Place',
      description: place.description || '',
      votes: place.votes || 0,
      images: place.images || [],
      comments: place.comments || [],
      hasVoted: place.has_voted || false,
      lastEdited: place.last_edited || new Date().toISOString(),
      type: place.type || 'default',
      user_id: place.user_id
    }));
  } catch (error) {
    console.error('LoadPlaces error:', error);
    markers.value = [];
  }
};

    const handleAuthSuccess = (userData) => {
      user.value = userData;
      showAuthModal.value = false;
    };

    const handleLogout = async () => {
      await auth.signOut();
      user.value = null;
      selectedMarker.value = null;
      isAddingMode.value = false;
    };

    const toggleRanking = () => {
      showRanking.value = !showRanking.value;
    };

    const selectAndCloseRanking = (id) => {
      selectMarker(id);
      showRanking.value = false;
    };

    const toggleAddMode = (value) => {
      isAddingMode.value = value;
    };

    const selectMarker = (id) => {
      selectedMarker.value = markers.value.find((marker) => marker.id === id);
    };

    const handleMapClick = async (latlng) => {
  if (!user.value) {
    showAuthModal.value = true;
    return;
  }

  if (isAddingMode.value) {
    try {
      console.log('Adding place at:', latlng);
      
      const newPlace = {
        name: 'New Place',
        latitude: latlng.lat,
        longitude: latlng.lng,
        description: 'Add description here...',
        user_id: user.value.id,
        created_by: user.value.email,
        votes: 0,
        images: [],
        comments: [],
        type: 'default' // Add default type
      };

      const { data, error } = await supabase
        .from('places')
        .insert([newPlace])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        alert('Failed to add place. Please try again.');
        return;
      }

      console.log('Place added successfully:', data);

      const newMarker = {
        id: data.id,
        lat: data.latitude,
        lng: data.longitude,
        name: data.name,
        description: data.description,
        votes: 0,
        images: [],
        comments: [],
        lastEdited: data.last_edited,
        type: data.type || 'default'
      };
      
      markers.value.push(newMarker);
      selectedMarker.value = newMarker;
      isAddingMode.value = false;
    } catch (error) {
      console.error('Error details:', error);
      alert('Failed to add place. Please try again.');
    }
  }
};
    const updatePlace = async (updatedPlace) => {
      try {
        const { error } = await supabase
          .from('places')
          .update({
            name: updatedPlace.name,
            description: updatedPlace.description,
            votes: updatedPlace.votes,
            images: updatedPlace.images,
            comments: updatedPlace.comments,
            has_voted: updatedPlace.hasVoted,
            last_edited: new Date()
          })
          .eq('id', updatedPlace.id);

        if (error) throw error;

        const index = markers.value.findIndex(m => m.id === updatedPlace.id);
        if (index !== -1) {
          markers.value[index] = {
            ...updatedPlace,
            lastEdited: new Date().toLocaleString()
          };
          if (selectedMarker.value?.id === updatedPlace.id) {
            selectedMarker.value = markers.value[index];
          }
        }
      } catch (error) {
        console.error('Error updating place:', error);
      }
    };

    const handleLocationError = (error) => {
      alert(error);
    };

    const handleDelete = async (placeId) => {
      markers.value = markers.value.filter(m => m.id !== placeId);
      selectedMarker.value = null;
    };

    // Initialize
 // In your App.vue setup() function
onMounted(async () => {
  try {
    const currentUser = await auth.getUser();
    user.value = currentUser;
    
    if (!currentUser) {
      showAuthModal.value = true; // Show auth modal if no user
    }

    await loadPlaces();

    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user || null;
      if (!session?.user) {
        showAuthModal.value = true; // Show auth modal if user signs out
        selectedMarker.value = null; // Clear selected marker
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    showAuthModal.value = true; // Show auth modal on error
  }
});
// Add a watch for authentication state
watch(() => user.value, (newUser) => {
  if (!newUser) {
    showAuthModal.value = true;
  }
});

    return {
      markers,
      selectedMarker,
      isAddingMode,
      showRanking,
      user,
      showAuthModal,
      sortedPlaces,
      canDeletePlace,
      handleAuthSuccess,
      handleLogout,
      toggleRanking,
      selectAndCloseRanking,
      selectMarker,
      handleMapClick,
      toggleAddMode,
      updatePlace,
      handleLocationError,
      closeDialog: () => selectedMarker.value = null,
      handleDelete
    };
  }
};
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.ranking-button {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 6px 12px;
  background: white;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.ranking-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.ranking-button.active {
  background: #2196F3;
  color: white;
}

.ranking-overlay {
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

.ranking-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.ranking-content .close-button {
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

.ranking-list {
  margin-top: 20px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.rank-number {
  font-size: 24px;
  font-weight: bold;
  color: #2196F3;
  width: 40px;
}

.rank-details {
  flex: 1;
  margin: 0 15px;
}

.rank-details h3 {
  margin: 0;
  font-size: 18px;
}

.votes {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}

.view-button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>