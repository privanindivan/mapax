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
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MapControls from './MapControls.vue'

const PHILIPPINES_BOUNDS = {
  southwest: [4.566667, 116.7],
  northeast: [21.120556, 126.537778]
}

const GMA_COORDINATES = [14.293054, 121.005381]

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
}

export default {
  name: 'MapView',
  components: { MapControls },
  props: {
    markers: { type: Array, default: () => [] },
    isAddingMode: { type: Boolean, default: false }
  },
  emits: ['marker-click', 'map-click', 'toggle-add-mode', 'location-error'],
  
  setup(props, { emit }) {
    const map = ref(null)
    const markerGroup = ref(null)
    const userLocationMarker = ref(null)
    const tempMarker = ref(null)
    const markersRef = ref(new Map())
    const stableMarkers = ref(new Map())

    const setMapView = (latlng, zoom = 18) => {
      if (map.value) {
        map.value.setView(latlng, zoom, {
          animate: true,
          duration: 1
        })
      }
    }

   const handleViewDetails = (e) => {
  const marker = stableMarkers.value.get(e.detail);
  if (marker) {
    marker.openPopup();
    setMapView(marker.getLatLng());
  }
  emit('marker-click', e.detail);
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
      })

      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2', {
        attribution: '',
        minZoom: 15,
        maxZoom: 19
      }).addTo(map.value)

      markerGroup.value = L.layerGroup().addTo(map.value)
      window.addEventListener('viewDetails', handleViewDetails)

      map.value.on('click', (e) => {
        if (props.isAddingMode && confirm('Add place here?')) {
          const latlng = L.latLng(e.latlng.lat, e.latlng.lng)
          if (tempMarker.value) {
            markerGroup.value.removeLayer(tempMarker.value)
          }
          tempMarker.value = L.marker(latlng, {
            icon: MARKER_ICONS.default
          }).addTo(markerGroup.value)
          
          emit('map-click', { 
            lat: latlng.lat,
            lng: latlng.lng
          })
        }
      })
    })

watch(() => props.markers, (newMarkers) => {
  if (!map.value || !markerGroup.value) return;
  
  // Don't clear all layers every time, update selectively
  newMarkers.forEach(marker => {
    const lat = parseFloat(marker.lat || marker.latitude);
    const lng = parseFloat(marker.lng || marker.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for marker:', marker);
      return;
    }

    const existingMarker = markersRef.value.get(marker.id);
    const latlng = L.latLng(lat, lng);

    // Only update if marker doesn't exist or position/type changed
    if (!existingMarker || 
        existingMarker.getLatLng().lat !== lat || 
        existingMarker.getLatLng().lng !== lng ||
        existingMarker.options.icon !== MARKER_ICONS[marker.type]) {

      if (existingMarker) {
        markerGroup.value.removeLayer(existingMarker);
      }

      const icon = MARKER_ICONS[marker.type] || MARKER_ICONS.default;
      
      const markerElement = L.marker(latlng, { 
        icon,
        riseOnHover: true,
        zIndexOffset: 1000
      }).addTo(markerGroup.value);

      const popupContent = document.createElement('div');
      popupContent.className = 'marker-popup';
      popupContent.innerHTML = `
        ${marker.images?.length > 0 ? `
          <div class="popup-image">
            <img src="${marker.images[0]}" alt="${marker.name}" />
          </div>` : ''}
        <h3>${marker.name || 'Unnamed Place'}</h3>
        <button class="view-details-btn">
          View Details
        </button>
      `;

      const popup = L.popup({
        closeButton: false,
        className: 'custom-popup'
      }).setContent(popupContent);

      markerElement.bindPopup(popup);

      popupContent.querySelector('.view-details-btn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('viewDetails', { detail: marker.id }));
      });

      markerElement.on('click', () => {
        setMapView(latlng);
      });

      markersRef.value.set(marker.id, markerElement);
    }
  });

  // Remove only markers that no longer exist
  markersRef.value.forEach((marker, id) => {
    if (!newMarkers.find(m => m.id === id)) {
      markerGroup.value.removeLayer(marker);
      markersRef.value.delete(id);
    }
  });
}, { deep: true });

// Add this helper function
const updatePopupContent = (markerElement, marker) => {
  const popupContent = document.createElement('div');
  popupContent.className = 'marker-popup';
  popupContent.innerHTML = `
    ${marker.images?.length > 0 ? `
      <div class="popup-image">
        <img src="${marker.images[0]}" alt="${marker.name}" />
      </div>` : ''}
    <h3>${marker.name || 'Unnamed Place'}</h3>
    <button class="view-details-btn">
      View Details
    </button>
  `;

  const popup = L.popup({
    closeButton: false,
    className: 'custom-popup',
    autoPan: false
  }).setContent(popupContent);

  markerElement.bindPopup(popup);

  popupContent.querySelector('.view-details-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('viewDetails', { detail: marker.id }));
  });
};

    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        emit('location-error', 'Geolocation not supported')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const latlng = L.latLng(latitude, longitude)
          
          if (userLocationMarker.value) {
            userLocationMarker.value.remove()
          }
          
          userLocationMarker.value = L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
          }).addTo(markerGroup.value)
          
          setMapView(latlng)
        },
        (err) => emit('location-error', err.message)
      )
    }

    const toggleAddMode = () => {
      emit('toggle-add-mode', !props.isAddingMode)
      if (tempMarker.value) {
        tempMarker.value.remove()
        tempMarker.value = null
      }
    }

    onBeforeUnmount(() => {
      window.removeEventListener('viewDetails', handleViewDetails)
      if (map.value) {
        map.value.remove()
      }
    })

    return {
      getCurrentLocation,
      toggleAddMode,
      setMapView
    }
  }
}
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
  color: white !important;
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
  :deep(.custom-popup .leaflet-popup-content-wrapper) {
  padding: 0 !important;
  overflow: hidden !important;
}

:deep(.custom-popup .leaflet-popup-content) {
  margin: 0 !important;
  width: 250px !important; /* Increased width */
}

:deep(.marker-popup) {
  text-align: center;
}

:deep(.marker-popup h3) {
  margin: 10px 0;
  padding: 0 10px;
}

:deep(.view-details-btn) {
  margin: 10px;
  width: calc(100% - 20px);
}
:deep(.leaflet-marker-pane) {
  will-change: transform !important;
}

:deep(.custom-marker-wrapper) {
  transform-origin: center bottom !important;
  will-change: transform !important;
}

:deep(.leaflet-zoom-animated) {
  will-change: transform !important;
  transform-origin: center !important;
}
</style>
