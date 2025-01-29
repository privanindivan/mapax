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

const MARKER_ICONS = {
  office: L.divIcon({
    html: '<div class="marker-icon">🏛️</div>',
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
  school: L.divIcon({
    html: '<div class="marker-icon">🏢</div>',
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
    markers: Array,
    isAddingMode: Boolean
  },
  emits: ['marker-click', 'map-click', 'toggle-add-mode', 'location-error'],
  
  setup(props, { emit }) {
    const map = ref(null);
    const markerGroup = ref(null);
    const userLocationMarker = ref(null);
    const tempMarker = ref(null);

    // Fixed event handler
    const handleMarkerClick = (markerId) => {
      emit('marker-click', markerId);
    };

    onMounted(() => {
      map.value = L.map('map', {
        center: GMA_COORDINATES,
        zoom: 16,
        minZoom: 15,
        maxZoom: 19,
        zoomControl: false,
        maxBounds: L.latLngBounds(PHILIPPINES_BOUNDS.southwest, PHILIPPINES_BOUNDS.northeast),
        maxBoundsViscosity: 1.0
      });

      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2').addTo(map.value);

      markerGroup.value = L.layerGroup().addTo(map.value);

      // Fixed map click handler
      map.value.on('click', (e) => {
        if (props.isAddingMode) {
          if (confirm('Add place here?')) {
            if (tempMarker.value) markerGroup.value.removeLayer(tempMarker.value);
            tempMarker.value = L.marker(e.latlng, { icon: MARKER_ICONS.default })
              .addTo(markerGroup.value);
            emit('map-click', e.latlng);
          }
        }
      });
    });

    watch(() => props.markers, (newMarkers) => {
      if (!map.value || !markerGroup.value) return;
      markerGroup.value.clearLayers();

      newMarkers.forEach(marker => {
        const icon = MARKER_ICONS[marker.type] || MARKER_ICONS.default;
        
        const popupContent = `
          <div class="marker-popup">
            ${marker.images?.length ? `
              <div class="popup-image">
                <img src="${marker.images[0]}" alt="${marker.name}" />
              </div>` : ''
            }
            <h3>${marker.name || 'Unnamed Place'}</h3>
            <button 
              class="view-details-btn" 
              onclick="this.dispatchEvent(new CustomEvent('view-details', { bubbles: true }))"
            >
              View Details
            </button>
          </div>
        `;

        const markerElement = L.marker([marker.lat, marker.lng], { icon })
          .addTo(markerGroup.value)
          .bindPopup(popupContent, { 
            className: 'custom-popup',
            closeButton: false
          });

        // Fixed event propagation
        markerElement.getElement()?.querySelector('.view-details-btn')
          ?.addEventListener('view-details', () => {
            handleMarkerClick(marker.id);
          });
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

    const toggleAddMode = () => {
      emit('toggle-add-mode', !props.isAddingMode);
      tempMarker.value?.remove();
      tempMarker.value = null;
    };

 onBeforeUnmount(() => {
      if (map.value) map.value.remove();
    });

    return { getCurrentLocation, toggleAddMode };
  }
};
</script>


<style scoped>
/* Keep your existing styles the same */
.map-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-heading {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

:deep(.custom-popup) {
  min-width: 200px;
  padding: 10px;
}

:deep(.view-details-btn) {
  background: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}

:deep(.view-details-btn:hover) {
  background: #1976D2;
}

:deep(.leaflet-control-container) {
  display: none;
}
</style>
