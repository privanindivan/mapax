<template>
  <div class="app">
    <button 
      @click="toggleRanking" 
      :class="['ranking-button', { active: showRanking }]"
    >
      ⬆️ Rankings
    </button>
    
    <UserMenu 
      :user="user" 
      @login="showAuthModal = true"
      @logout="handleLogout"
    />

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

    <MapView
      ref="mapRef"
      :markers="markers"
      :is-adding-mode="isAddingMode"
      :is-authenticated="!!user"
      @marker-click="selectMarker"
      @map-click="handleMapClick"
      @toggle-add-mode="toggleAddMode"
      @location-error="handleLocationError"
    />

    <PlaceDetailsDialog 
      v-if="selectedMarker" 
      :place="selectedMarker"
      :can-edit="!!user"
      :can-delete="canDeletePlace"
      @close="closeDialog"
      @update="updatePlace"
      @delete="handleDelete"
      @request-login="showAuthModal = true"
    />

    <AuthModal 
      v-if="showAuthModal" 
      @close="showAuthModal = false"
      @auth-success="handleAuthSuccess"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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
const mapRef = ref(null);

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
    const marker = markers.value.find(m => m.id === id);
    if (marker && mapRef.value) {
      mapRef.value.setView([marker.lat, marker.lng], 18);
    }
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
isAddingMode.value = false; // Reset add mode
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
        votes: 0
      };

      const { data, error } = await supabase
        .from('places')
        .insert([newPlace])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const newMarker = {
        id: data.id,
        lat: data.latitude,
        lng: data.longitude,
        name: data.name,
        description: data.description,
        votes: data.votes || 0,
        user_id: data.user_id
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
    // Check for redirect response first
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      user.value = session.user;
      await loadPlaces();
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        user.value = session?.user || null;
        await loadPlaces();
        showAuthModal.value = false;
      } else if (event === 'SIGNED_OUT') {
        user.value = null;
        markers.value = [];
        selectedMarker.value = null;
      }
    });

    // Cleanup on unmount
    onBeforeUnmount(() => {
      subscription.unsubscribe();
    });

  } catch (error) {
    console.error('Auth setup error:', error);
  }
});

// Remove the separate watch as we're handling it in onAuthStateChange

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
      handleDelete,
 mapRef,
    };
  }
};
</script>

<style scoped>
.app {
  font-weight: bold !important;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.ranking-button {
background-color: white !important;
  color: #333 !important; 
  position: fixed;
  top: 10px;
  left: 10px;  /* Move it right to not overlap with other controls */
  z-index: 1000;
  padding: 4px 8px;  /* Smaller padding */
  background: white;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;  /* Smaller font */
  transition: all 0.3s ease;
}


/* For the hover state */
.ranking-button:hover {
  background-color: rgb(239, 40, 40) !important;
  transform: none !important; /* Remove any transform on hover */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* For the active state */
.ranking-button.active {
   background-color: white !important;
  color: #333 !important;
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
  width: 90%;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  color: #333;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.ranking-content .close-button:hover {
  background: rgba(0, 0, 0, 0.2);
}

.ranking-list {
  margin-top: 20px;
  padding-right: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  margin-bottom: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.rank-number {
  font-size: 24px !important;
  font-weight: bold !important;
  color: #2196F3 !important;
  width: 40px !important;
  text-align: center !important;
}

.rank-details {
  flex: 1 !important;
  margin: 0 15px !important;
}

.rank-details h3 {
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: bold !important;
}

.votes {
  margin: 5px 0 0 !important;
  font-size: 14px !important;
  font-weight: bold !important;
  color: #666 !important;
}

.view-button {
  padding: 8px 16px !important;
  background: #4CAF50 !important;
  color: white !important;
  border: none !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  font-size: 14px !important;
}
.view-button:hover {
  background: #45a049 !important;
  transform: translateY(-1px) !important;
}
user-menu {
  margin-right: 10px;
}
</style>
