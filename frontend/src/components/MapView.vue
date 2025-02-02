// MapView.vue
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
    html: '🏛️',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  building: L.divIcon({
    html: '🏢',
    className: 'custom-marker', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  restaurant: L.divIcon({
    html: '🥣',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  shipping: L.divIcon({
    html: '📦',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  laundry: L.divIcon({
    html: '👕',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  church: L.divIcon({
    html: '⛪',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  store: L.divIcon({
    html: '🏪',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  barber: L.divIcon({
    html: '✂️',
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
  default: L.divIcon({
    html: '📍',
    className: 'custom-marker',
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
    const markersMap = ref(new Map())
let errorCount = 0;
const MAX_ERRORS = 3;
const ERROR_RESET_INTERVAL = 10000; // 10 seconds

const handleMapError = () => {
  errorCount++;
  
  // If we've seen multiple errors in a short time, refresh the map
  if (errorCount >= MAX_ERRORS) {
    console.log('Multiple errors detected, refreshing map...');
    refreshMap();
    errorCount = 0;
  }

  // Reset error count after interval
  setTimeout(() => {
    errorCount = Math.max(0, errorCount - 1);
  }, ERROR_RESET_INTERVAL);
};

const refreshMap = () => {
  if (!map.value) return;

  // Clear all existing layers
  markerGroup.value.clearLayers();
  markersMap.value.clear();

  // Reset the map view
  map.value.setView(map.value.getCenter(), map.value.getZoom(), {
    animate: false
  });

  // Re-add all markers
  props.markers.forEach(marker => {
    const lat = parseFloat(marker.lat || marker.latitude);
    const lng = parseFloat(marker.lng || marker.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;

    try {
      const markerElement = createMarkerElement(marker);
      markerElement.addTo(markerGroup.value);
      markersMap.value.set(marker.id, markerElement);
    } catch (err) {
      console.error('Error adding marker:', err);
    }
  });
};

// Add error event listeners in onMounted
onMounted(() => {
  // ... existing onMounted code ...

  // Add error handlers
  map.value.on('error', handleMapError);
  
  // Handle popup errors
  const originalOnAdd = L.Popup.prototype.onAdd;
  L.Popup.prototype.onAdd = function(map) {
    try {
      return originalOnAdd.call(this, map);
    } catch (err) {
      console.error('Popup error:', err);
      handleMapError();
      return this;
    }
  };

  // Handle zoom animation errors
  const originalAnimateZoom = L.Popup.prototype._animateZoom;
  L.Popup.prototype._animateZoom = function(center) {
    try {
      return originalAnimateZoom.call(this, center);
    } catch (err) {
      console.error('Zoom animation error:', err);
      handleMapError();
      return this;
    }
  };
});

// Clean up in onBeforeUnmount
onBeforeUnmount(() => {
  // ... existing cleanup code ...
  
  if (map.value) {
    map.value.off('error', handleMapError);
  }
});

// Add to the watch function
watch(() => props.markers, (newMarkers) => {
  // ... existing watch code ...
  
  // Add error handling
  try {
    // Your existing marker update code
  } catch (err) {
    console.error('Marker update error:', err);
    handleMapError();
  }
}, { deep: true });

// Add a public method to force refresh
const forceRefresh = () => {
  refreshMap();
};

    const setMapView = (latlng, zoom = 18) => {
      if (map.value) {
        map.value.setView(latlng, zoom, {
          animate: true,
          duration: 1
        })
      }
    }

    const createMarkerElement = (marker) => {
      const latlng = L.latLng(
        parseFloat(marker.lat || marker.latitude),
        parseFloat(marker.lng || marker.longitude)
      )

      const markerElement = L.marker(latlng, {
        icon: MARKER_ICONS[marker.type] || MARKER_ICONS.default,
        autoPanOnFocus: false,
        riseOnHover: true
      })

      const popupContent = document.createElement('div')
      popupContent.className = 'marker-popup'
      popupContent.innerHTML = `
        ${marker.images?.length > 0 ? `
          <div class="popup-image">
            <img src="${marker.images[0]}" alt="${marker.name}" />
          </div>` : ''}
        <h3>${marker.name || 'Unnamed Place'}</h3>
        <button class="view-details-btn">View Details</button>
      `

      const popup = L.popup({
        closeButton: false,
        className: 'custom-popup',
        maxWidth: 300,
        autoPan: false
      }).setContent(popupContent)

      markerElement.bindPopup(popup)

      popupContent.querySelector('.view-details-btn').addEventListener('click', () => {
        emit('marker-click', marker.id)
      })

      return markerElement
    }

    const handleViewDetails = (e) => {
      const marker = markersMap.value.get(e.detail)
      if (marker) {
        marker.openPopup()
        setMapView(marker.getLatLng())
      }
    }

    onMounted(() => {
      // Initialize map
      map.value = L.map('map', {
        center: GMA_COORDINATES,
        zoom: 16,
        minZoom: 15,
        maxZoom: 19,
        zoomControl: false,
        maxBounds: L.latLngBounds(PHILIPPINES_BOUNDS.southwest, PHILIPPINES_BOUNDS.northeast),
        maxBoundsViscosity: 1.0,
        preferCanvas: true
      })

      // Add tile layer
      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2', {
        attribution: '',
        minZoom: 15,
        maxZoom: 19
      }).addTo(map.value)

      markerGroup.value = L.featureGroup().addTo(map.value)

      window.addEventListener('viewDetails', handleViewDetails)

      // Handle map clicks
      map.value.on('click', (e) => {
        if (props.isAddingMode) {
          const latlng = e.latlng
          emit('map-click', { lat: latlng.lat, lng: latlng.lng })
          
          if (tempMarker.value) {
            markerGroup.value.removeLayer(tempMarker.value)
          }

          tempMarker.value = L.marker(latlng, {
            icon: MARKER_ICONS.default,
            autoPanOnFocus: false
          }).addTo(markerGroup.value)
        }
      })
    })

    // Watch for marker changes
    watch(() => props.markers, (newMarkers) => {
      if (!map.value || !markerGroup.value) return

      // Keep track of current marker IDs
      const currentIds = new Set()

      newMarkers.forEach(marker => {
        currentIds.add(marker.id)
        
        // Skip if coordinates are invalid
        const lat = parseFloat(marker.lat || marker.latitude)
        const lng = parseFloat(marker.lng || marker.longitude)
        if (isNaN(lat) || isNaN(lng)) return

        const existingMarker = markersMap.value.get(marker.id)
        
        if (existingMarker) {
          // Update existing marker
          existingMarker.setLatLng([lat, lng])
          existingMarker.setIcon(MARKER_ICONS[marker.type] || MARKER_ICONS.default)
        } else {
          // Create new marker
          const newMarker = createMarkerElement(marker)
          newMarker.addTo(markerGroup.value)
          markersMap.value.set(marker.id, newMarker)
        }
      })

      // Remove markers that no longer exist
      for (const [id, marker] of markersMap.value.entries()) {
        if (!currentIds.has(id)) {
          markerGroup.value.removeLayer(marker)
          markersMap.value.delete(id)
        }
      }
    }, { deep: true })

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
            markerGroup.value.removeLayer(userLocationMarker.value)
          }

          userLocationMarker.value = L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#4CAF50',
            color: '#fff',
            weight: 2,
            opacity: 1,
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
        markerGroup.value.removeLayer(tempMarker.value)
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
      setMapView,
forceRefresh 
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

:deep(.custom-marker) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: none;
  border: none;
  text-align: center;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

:deep(.custom-popup) {
  min-width: 200px;
}

:deep(.marker-popup) {
  text-align: center;
  padding: 10px;
}

:deep(.popup-image) {
  width: 100%;
  height: 120px;
  margin: -10px -10px 10px -10px;
  overflow: hidden;
}

:deep(.popup-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.view-details-btn) {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 8px;
}

:deep(.view-details-btn:hover) {
  background: #45a049;
}

:deep(.leaflet-popup-content-wrapper) {
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 0;
  width: 250px !important;
}

:deep(.leaflet-control-container),
:deep(.leaflet-control-attribution) {
  display: none;
}
</style>
