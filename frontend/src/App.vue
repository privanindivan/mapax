<template>
  <div class="app">
    <button 
      @click="toggleRanking" 
      :class="['ranking-button', { active: showRanking }]"
style="z-index: 1000; padding: 8px 12px; font-size: 14px"
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
        
        <!-- Category Filters -->
        <div class="category-filters">
          <button
            @click="selectedCategory = null"
            :class="{ active: !selectedCategory }"
          >
            🌟 All
          </button>
          <button
            v-for="(typeData, typeKey) in PLACE_TYPES"
            :key="typeKey"
            @click="selectedCategory = typeKey"
            :class="{ active: selectedCategory === typeKey }"
          >
            {{ typeData.icon }} {{ typeData.label }}
          </button>
        </div>

        <div class="ranking-list">
          <div v-for="place in sortedPlaces" :key="place.id" class="ranking-item">
            <span class="rank-number">{{ place.rank }}</span>
            <div class="rank-details">
              <h3>{{ place.name }}</h3>
              <p class="votes">{{ place.votes || 0 }} votes</p>
              <span class="category-tag">
                {{ PLACE_TYPES[place.type]?.icon || '📍' }}
              </span>
            </div>
            <button @click="selectAndCloseRanking(place.id)" class="view-button">
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    <MapView
      ref="mapRef"
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
import { ref, computed, onMounted } from 'vue';
import MapView from './components/MapView.vue';
import PlaceDetailsDialog from './components/PlaceDetailsDialog.vue';
import UserMenu from './components/UserMenu.vue';
import AuthModal from './components/AuthModal.vue';
import { supabase } from './services/supabase';

const PLACE_TYPES = {
  office: { icon: '🏛️', label: 'Office' },
  building: { icon: '🏢', label: 'Building' },
  restaurant: { icon: '🥣', label: 'Restaurant' },
  shipping: { icon: '📦', label: 'Shipping' },
  laundry: { icon: '👕', label: 'Laundry' },
  church: { icon: '⛪', label: 'Church' },
  store: { icon: '🏪', label: 'Store' },
  barber: { icon: '✂️', label: 'Barber' },
  default: { icon: '📍', label: 'Other' }
};

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
    const selectedCategory = ref(null);

const handleMapError = () => {
  if (mapRef.value) {
    console.log('Refreshing map...');
    mapRef.value.refreshMap(); // Correct method name
  }
};

   const loadPlaces = async () => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    markers.value = data.map(place => ({
      ...place,
      lat: place.latitude,
      lng: place.longitude,
      images: place.images || [],
      votes: place.votes || 0
    }));
    
    // Add delayed map refresh
    setTimeout(() => {
      if (mapRef.value?.refreshMap) {
        mapRef.value.refreshMap();
      }
    }, 100);
  } catch (error) {
    console.error('Load error:', error);
  }
};

const updatePlace = async (updatedPlace) => {
  try {
    // Update local state first
    const index = markers.value.findIndex(p => p.id === updatedPlace.id);
    if (index !== -1) {
      markers.value = markers.value.map(marker => 
        marker.id === updatedPlace.id ? {
          ...marker,
          ...updatedPlace,
          lat: updatedPlace.latitude || updatedPlace.lat,
          lng: updatedPlace.longitude || updatedPlace.lng,
          votes: updatedPlace.votes,
          voted_users: updatedPlace.voted_users
        } : marker
      );
    }

    // Get fresh data from server
    const { data: freshData, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', updatedPlace.id)
      .single();

    if (error) throw error;

    // Update with fresh data
    markers.value = markers.value.map(marker => 
      marker.id === updatedPlace.id ? {
        ...marker,
        ...freshData,
        lat: freshData.latitude,
        lng: freshData.longitude,
        votes: freshData.votes,
        voted_users: freshData.voted_users
      } : marker
    );

  } catch (error) {
    console.error('Update error:', error);
    await loadPlaces(); // Fallback to full refresh
  }
};

    const handleDelete = async (id) => {
      try {
        markers.value = markers.value.filter(p => p.id !== id);
        selectedMarker.value = null;
        await loadPlaces();
        handleMapError(); // Force refresh after delete
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete place');
        handleMapError(); // Try to recover from error
      }
    };



    const handleMapClick = async (latlng) => {
      if (!user.value) {
        showAuthModal.value = true;
        isAddingMode.value = false;
        return;
      }

      if (isAddingMode.value) {
        try {
          const newPlace = {
            name: 'New Place',
            latitude: latlng.lat,
            longitude: latlng.lng,
            user_id: user.value.id,
            votes: 0,
            images: [],
            comments: [],
            type: 'default',
            voted_users: [],
            created_at: new Date().toISOString()
          };

          const { data, error } = await supabase
            .from('places')
            .insert([newPlace])
            .select()
            .single();

          if (error) throw error;

          markers.value = [...markers.value, {
            ...data,
            lat: data.latitude,
            lng: data.longitude
          }];
          
          isAddingMode.value = false;
          selectMarker(data.id);
          handleMapError() ;
        } catch (error) {
          console.error('Add error:', error);
          alert('Failed to add place');
        }
      }
    };



 const selectMarker = (id) => {
  selectedMarker.value = markers.value.find(m => m.id === id);
  if (selectedMarker.value && mapRef.value) {
    mapRef.value.setMapView([
      selectedMarker.value.lat,
      selectedMarker.value.lng
    ]);
    setTimeout(() => mapRef.value.refreshMap(), 300);
  }
};

    const selectAndCloseRanking = (id) => {
      const marker = markers.value.find(m => m.id === id);
      if (marker && mapRef.value) {
        mapRef.value.setMapView([marker.lat, marker.lng], 18);
        setTimeout(() => {
          const event = new CustomEvent('viewDetails', { detail: id });
          window.dispatchEvent(event);
        }, 100);
      }
      showRanking.value = false;
    };

    const handleLogout = async () => {
      await supabase.auth.signOut();
      user.value = null;
      selectedMarker.value = null;
      isAddingMode.value = false;
      await loadPlaces();
    };

    const handleAuthSuccess = (userData) => {
      user.value = userData;
      showAuthModal.value = false;
      loadPlaces();
    };

    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user.value = session.user;
      }
      await loadPlaces();
    });

const sortedPlaces = computed(() => {
  return [...markers.value]
    .filter(m => !selectedCategory.value || m.type === selectedCategory.value)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .map((place, index) => ({
      ...place,
      rank: index + 1
    }));
});

const canDeletePlace = computed(() => {
  return selectedMarker.value?.user_id === user.value?.id;
});
   return {
      markers,
      selectedMarker,
      sortedPlaces,
      isAddingMode,
      showRanking,
      showAuthModal,
      user,
      mapRef,
      selectedCategory,
      PLACE_TYPES,
      canDeletePlace,
      updatePlace,
      handleMapClick,
      selectMarker,
      handleAuthSuccess,
      handleLogout,
      handleDelete,
      selectAndCloseRanking,
      handleLocationError: (err) => alert(err),
      toggleRanking: () => showRanking.value = !showRanking.value,
      toggleAddMode: (val) => isAddingMode.value = val,
      closeDialog: () => selectedMarker.value = null,
      handleMapError
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
  left: 10px;
  z-index: 1000;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  transition: all 0.3s ease;
}

.ranking-button:hover {
  background-color: rgb(239, 40, 40) !important;
  transform: none !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

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
  max-width: 500px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-button {
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

.close-button:hover {
  background: rgba(0, 0, 0, 0.2);
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-button {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-button.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  margin-bottom: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.ranking-item:hover {
  transform: translateX(5px);
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

.category-tag {
  font-size: 1.2em;
  margin-left: 8px;
}
</style>
