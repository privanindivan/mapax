<template>
  <div class="map-wrapper">
    <h2 class="map-heading">MAPA</h2>
    <div id="map" class="map"></div>
    <MapControls
      @get-location="getCurrentLocation"
      @toggle-add-mode="toggleAddMode"
      :is-adding-mode="isAddingMode"
    />
  </div>
</template>

<script>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapControls from './MapControls.vue';

const PHILIPPINES_BOUNDS = {
  southwest: [4.566667, 116.7],
  northeast: [21.120556, 126.537778]
};

const GMA_COORDINATES = [14.293054, 121.005381];

// Define marker icons at component level
const MARKER_ICONS = {
  office: L.divIcon({
    html: '🏛️',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  restaurant: L.divIcon({
    html: '🥣',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  shipping: L.divIcon({
    html: '📦',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  laundry: L.divIcon({
    html: '👕',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  church: L.divIcon({
    html: '⛪',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  school: L.divIcon({
    html: '🏫',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  store: L.divIcon({
    html: '🏪',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  barber: L.divIcon({
    html: '✂️',
    className: 'custom-marker',
    iconSize: [30, 30]
  }),
  default: L.divIcon({
    html: '📍',
    className: 'custom-marker',
    iconSize: [30, 30]
  })
};

export default {
  name: 'MapView',
  components: {
    MapControls
  },
  props: {
    markers: {
      type: Array,
      default: () => []
    },
    isAddingMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['marker-click', 'map-click', 'toggle-add-mode', 'location-error'],
  
  setup(props, { emit }) {
    const map = ref(null);
    const markerGroup = ref(null);
    const userLocationMarker = ref(null);
    const tempMarker = ref(null);

    const handleShowDetails = (event) => {
      const detail = event.detail;
      if (detail) {
        emit('marker-click', detail);
      }
    };

    onMounted(() => {
      // Initialize map
      map.value = L.map('map', {
        center: GMA_COORDINATES,
        zoom: 16,
        minZoom: 15,
        maxZoom: 19,
        zoomControl: false,
        maxBounds: L.latLngBounds(PHILIPPINES_BOUNDS.southwest, PHILIPPINES_BOUNDS.northeast),
        maxBoundsViscosity: 1.0
      });

      // Add Thunderforest tile layer
      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2', {
        attribution: '',
        minZoom: 15,
        maxZoom: 19
      }).addTo(map.value);

      markerGroup.value = L.layerGroup().addTo(map.value);

      // Add event listener for custom events
      document.addEventListener('showDetails', handleShowDetails);

      // Add click handler for map
      map.value.on('click', (e) => {
        if (props.isAddingMode) {
          emit('map-click', e.latlng);
          if (tempMarker.value) {
            markerGroup.value.removeLayer(tempMarker.value);
          }
          tempMarker.value = L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: '#FF4081',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(markerGroup.value);
        }
      });
    });

  watch(() => props.markers, (newMarkers) => {
  if (!map.value || !markerGroup.value) return;
  markerGroup.value.clearLayers();
  
  newMarkers.forEach(marker => {
    const icon = MARKER_ICONS[marker.type] || MARKER_ICONS.default;

    const markerElement = L.marker([marker.lat, marker.lng], { icon })
      .addTo(markerGroup.value)
      .bindPopup(`
        <div class="marker-popup">
          <h3>${marker.name || 'Unnamed Place'}</h3>
          <div class="popup-content">
            <button class="view-details-btn" 
              onclick="document.dispatchEvent(new CustomEvent('showDetails', {detail: '${marker.id}'}))">
              View Details
            </button>
          </div>
        </div>
      `, {
        closeButton: false,
        className: 'custom-popup'
      });
   markerElement.on('click', () => {
      map.value.setView([marker.lat, marker.lng], 18, {
        animate: true,
        duration: 1
      });
    });
  });
}, { deep: true });
    const getCurrentLocation = () => {
      if (!map.value) return;

      if (!navigator.geolocation) {
        emit('location-error', 'Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (userLocationMarker.value) {
            map.value.removeLayer(userLocationMarker.value);
          }

          userLocationMarker.value = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(markerGroup.value);

          map.value.setView([latitude, longitude], 16, {
            animate: true,
            duration: 1
          });
        },
        () => {
          emit('location-error', 'Unable to retrieve your location');
        }
      );
    };

    const toggleAddMode = () => {
      emit('toggle-add-mode', !props.isAddingMode);
      if (tempMarker.value && markerGroup.value) {
        markerGroup.value.removeLayer(tempMarker.value);
        tempMarker.value = null;
      }
    };

    onBeforeUnmount(() => {
      document.removeEventListener('showDetails', handleShowDetails);
      if (map.value) {
        map.value.remove();
      }
    });

    return {
      getCurrentLocation,
      toggleAddMode
    };
  }
};
</script>

<style scoped>
.map-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.map {
  width: 100%;
  height: 100%;
  z-index: 1;
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  padding: 0;
}

.map-heading {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  margin: 0;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.custom-popup) {
  min-width: 150px;
}

:deep(.marker-popup) {
  text-align: center;
}

:deep(.marker-popup h3) {
  margin: 0 0 8px 0;
  font-weight: bold;
}

:deep(.view-details-btn) {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

:deep(.view-details-btn:hover) {
  background: #45a049;
}

/* Hide Leaflet controls - moved inside the style block */
:deep(.leaflet-control-container),
:deep(.leaflet-control-attribution),
:deep(.leaflet-control-container .leaflet-bottom),
:deep(.leaflet-bar),
:deep(.leaflet-control) {
  display: none !important;
}
</style>
