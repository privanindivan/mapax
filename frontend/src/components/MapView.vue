
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

export const PLACE_TYPES = [
  { value: 'office', label: '🏛️ Office' },
  { value: 'building', label: '🏢 Building' },
  { value: 'restaurant', label: '🥣 Restaurant' },
  { value: 'shipping', label: '📦 Shipping' },
  { value: 'laundry', label: '👕 Laundry' },
  { value: 'church', label: '⛪ Church' },
  { value: 'store', label: '🏪 Store' },
  { value: 'barber', label: '✂️ Barber' }
];

const PHILIPPINES_BOUNDS = {
  southwest: [4.566667, 116.7],
  northeast: [21.120556, 126.537778]
};

const GMA_COORDINATES = [14.293054, 121.005381];

const MARKER_ICONS = {
  office: L.divIcon({
    html: '<div class="marker-icon">🏛️</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  building: L.divIcon({
    html: '<div class="marker-icon">🏢</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  restaurant: L.divIcon({
    html: '<div class="marker-icon">🥣</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  shipping: L.divIcon({
    html: '<div class="marker-icon">📦</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  laundry: L.divIcon({
    html: '<div class="marker-icon">👕</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  church: L.divIcon({
    html: '<div class="marker-icon">⛪</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  store: L.divIcon({
    html: '<div class="marker-icon">🏪</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  barber: L.divIcon({
    html: '<div class="marker-icon">✂️</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  default: L.divIcon({
    html: '<div class="marker-icon">📍</div>',
    className: 'custom-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
};

export default {
  name: 'MapView',
  components: { MapControls },
  props: {
    markers: { type: Array, default: () => [] },
    isAddingMode: { type: Boolean, default: false }
  },
  emits: ['marker-click', 'map-click', 'toggle-add-mode', 'location-error'],
  
  setup(props, { emit }) {
    const map = ref(null);
    const markerGroup = ref(null);
    const userLocationMarker = ref(null);
    const tempMarker = ref(null);

    // 1. Event handler for view details
    const handleViewDetails = (event) => {
      emit('marker-click', event.detail);
    };

    // 2. Map view control method
    const setMapView = (latlng, zoom = 18) => {
      map.value?.setView(latlng, zoom, {
        animate: true,
        duration: 1
      });
    };

    // 3. Marker creation helper
    const createMarker = (marker) => {
      const icon = MARKER_ICONS[marker.type] || MARKER_ICONS.default;
      
      const markerElement = L.marker([marker.lat, marker.lng], { 
        icon,
        riseOnHover: true,
        zIndexOffset: 1000
      });

      // Popup content with proper event binding
      const popupContent = `
        <div class="marker-popup">
          ${marker.images?.length > 0 ? `
            <div class="popup-image">
              <img src="${marker.images[0]}" alt="${marker.name}" />
            </div>` : ''}
          <h3>${marker.name || 'Unnamed Place'}</h3>
          <button 
            class="view-details-btn" 
            data-id="${marker.id}"
          >
            View Details
          </button>
        </div>
      `;

      markerElement.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-popup'
      });

      // Click handler for the marker itself
      markerElement.on('click', () => {
        setMapView([marker.lat, marker.lng]);
      });

      // Popup open handler
      markerElement.on('popupopen', () => {
        document.querySelector(`[data-id="${marker.id}"]`)
          ?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('viewDetails', { 
              detail: marker.id 
            }));
          });
      });

      return markerElement;
    };

    onMounted(() => {
      // Initialize map
      map.value = L.map('map', {
        center: GMA_COORDINATES,
        zoom: 16,
        minZoom: 15,
        maxZoom: 19,
        zoomControl: false,
        maxBounds: L.latLngBounds(
          PHILIPPINES_BOUNDS.southwest, 
          PHILIPPINES_BOUNDS.northeast
        ),
        maxBoundsViscosity: 1.0
      });

      // Add tile layer
      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2').addTo(map.value);

      // Initialize layer group
      markerGroup.value = L.layerGroup().addTo(map.value);

      // Add global event listener
      window.addEventListener('viewDetails', handleViewDetails);

      // Map click handler
      map.value.on('click', (e) => {
        if (props.isAddingMode && confirm('Add place here?')) {
          tempMarker.value?.remove();
          tempMarker.value = L.marker(e.latlng, {
            icon: MARKER_ICONS.default
          }).addTo(markerGroup.value);
          emit('map-click', e.latlng);
        }
      });
    });

    // Marker update watcher
    watch(() => props.markers, (newMarkers) => {
      markerGroup.value?.clearLayers();
      newMarkers.forEach(marker => {
        createMarker(marker).addTo(markerGroup.value);
      });
    }, { deep: true });

    // Geolocation handler
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        emit('location-error', 'Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          userLocationMarker.value?.remove();
          userLocationMarker.value = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
          }).addTo(markerGroup.value);
          setMapView([latitude, longitude]);
        },
        (err) => emit('location-error', err.message)
      );
    };

    // Cleanup
    onBeforeUnmount(() => {
      window.removeEventListener('viewDetails', handleViewDetails);
      map.value?.remove();
    });

    return {
      getCurrentLocation,
      toggleAddMode: () => emit('toggle-add-mode', !props.isAddingMode),
      setMapView
    };
  }
};
</script>

<style scoped>
<style scoped>
/* Fixed 8: Enhanced marker styling */
:deep(.leaflet-marker-icon) {
  transition: transform 0.2s;
}

:deep(.leaflet-marker-icon:hover) {
  transform: scale(1.2);
}

:deep(.custom-popup) {
  min-width: 200px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

:deep(.view-details-btn) {
  background: #2196F3;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

:deep(.view-details-btn:hover) {
  background: #1976D2;
}
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
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.custom-popup) {
  min-width: 150px;
  margin-bottom: 15px !important;
}

:deep(.marker-popup) {
  text-align: center;
  padding: 5px !important;
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

:deep(.popup-image) {
  width: 100%;
  height: 120px;
  overflow: hidden;
  margin-bottom: 8px;
  border-radius: 4px;
}

:deep(.popup-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.custom-marker-wrapper) {
  position: absolute !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  background: none !important;
  border: none !important;
  pointer-events: none !important;
}

:deep(.marker-icon) {
  font-size: 24px !important;
  line-height: 1 !important;
  pointer-events: auto !important;
  filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3)) !important;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px !important;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16) !important;
}

:deep(.leaflet-popup-tip) {
  box-shadow: 0 3px 6px rgba(0,0,0,0.16) !important;
}

:deep(.leaflet-control-container),
:deep(.leaflet-control-attribution),
:deep(.leaflet-control-container .leaflet-bottom),
:deep(.leaflet-bar),
:deep(.leaflet-control) {
  display: none !important;
}
</style>
