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

    <!-- Ranking Modal with Category Filters -->
    <div v-if="showRanking" class="ranking-overlay">
      <div class="ranking-content">
        <button @click="showRanking = false" class="close-button">×</button>
        
        <div class="category-filter">
          <button
            v-for="category in categories"
            :key="category.value"
            @click="toggleCategoryFilter(category.value)"
            :class="['category-button', { active: activeCategory === category.value }]"
          >
            {{ category.emoji }} {{ category.label }}
          </button>
        </div>

        <div class="ranking-list">
          <div 
            v-for="place in filteredPlaces" 
            :key="place.id" 
            class="ranking-item"
          >
            <span class="rank-number">{{ place.rank }}</span>
            <div class="rank-details">
              <h3>{{ place.name }}</h3>
              <p class="votes">{{ place.votes }} votes</p>
            </div>
            <button 
              @click="selectAndCenterPlace(place.id)" 
              class="view-button"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    <MapView
      ref="mapRef"
      :markers="places"
      :is-adding-mode="isAddingMode"
      @marker-click="handleMarkerClick"
      @map-click="handleMapClick"
      @toggle-add-mode="toggleAddMode"
      @location-error="handleLocationError"
    />

    <PlaceDetailsDialog
      v-if="selectedPlace"
      :place="selectedPlace"
      @close="selectedPlace = null"
      @update="handlePlaceUpdate"
      @delete="handlePlaceDelete"
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
import { supabase } from './services/supabase';
import { auth } from './services/auth';

export default {
  setup() {
    // Reactive State
    const places = ref([]);
    const selectedPlace = ref(null);
    const isAddingMode = ref(false);
    const showRanking = ref(false);
    const showAuthModal = ref(false);
    const user = ref(null);
    const mapRef = ref(null);
    const activeCategory = ref(null);

    // Constants
    const categories = [
      { value: 'office', label: 'Office', emoji: '🏛️' },
      { value: 'restaurant', label: 'Restaurant', emoji: '🥣' },
      { value: 'shipping', label: 'Shipping', emoji: '📦' },
      { value: 'laundry', label: 'Laundry', emoji: '👕' },
      { value: 'church', label: 'Church', emoji: '⛪' },
      { value: 'school', label: 'School', emoji: '🏢' },
      { value: 'store', label: 'Store', emoji: '🏪' },
      { value: 'barber', label: 'Barber', emoji: '✂️' },
      { value: 'default', label: 'Other', emoji: '📍' }
    ];

    // Computed Properties
    const filteredPlaces = computed(() => {
      let filtered = places.value.sort((a, b) => b.votes - a.votes);
      
      if (activeCategory.value) {
        filtered = filtered.filter(place => 
          place.type === activeCategory.value
        );
      }

      return filtered.map((place, index) => ({
        ...place,
        rank: index + 1
      }));
    });

    // Methods
    const loadPlaces = async () => {
      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .order('votes', { ascending: false });

        if (error) throw error;
        places.value = data || [];
      } catch (error) {
        console.error('Error loading places:', error);
      }
    };

    const handleMarkerClick = (placeId) => {
      selectedPlace.value = places.value.find(p => p.id === placeId);
      centerMapOnPlace(placeId);
    };

    const selectAndCenterPlace = (placeId) => {
      handleMarkerClick(placeId);
      showRanking.value = false;
    };

    const centerMapOnPlace = (placeId) => {
      const place = places.value.find(p => p.id === placeId);
      if (place && mapRef.value?.map) {
        mapRef.value.map.setView([place.lat, place.lng], 18);
      }
    };

    const handleMapClick = async (latlng) => {
      if (!user.value) {
        showAuthModal.value = true;
        return;
      }

      try {
        const { data, error } = await supabase
          .from('places')
          .insert([{
            name: 'New Place',
            lat: latlng.lat,
            lng: latlng.lng,
            user_id: user.value.id
          }])
          .select()
          .single();

        if (error) throw error;
        places.value = [data, ...places.value];
        isAddingMode.value = false;
      } catch (error) {
        console.error('Error adding place:', error);
      }
    };

    const toggleCategoryFilter = (category) => {
      activeCategory.value = activeCategory.value === category ? null : category;
    };

    // Auth Handlers
    const handleAuthSuccess = (userData) => {
      user.value = userData;
      showAuthModal.value = false;
      loadPlaces();
    };

    const handleLogout = async () => {
      await auth.signOut();
      user.value = null;
      places.value = [];
    };

    // Lifecycle Hooks
    onMounted(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user.value = session.user;
        loadPlaces();
      }
    });

    return {
      places,
      selectedPlace,
      isAddingMode,
      showRanking,
      showAuthModal,
      user,
      mapRef,
      categories,
      activeCategory,
      filteredPlaces,
      handleMarkerClick,
      handleMapClick,
      toggleCategoryFilter,
      selectAndCenterPlace,
      handleAuthSuccess,
      handleLogout,
      toggleRanking: () => showRanking.value = !showRanking.value,
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

.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-button {
  padding: 6px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.category-button.active {
  background: #2196F3;
  color: white;
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

.user-menu {
  margin-right: 10px;
}
.category-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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
  transition: transform 0.2s;
}

.ranking-item:hover {
  transform: translateX(5px);
}
</style>
