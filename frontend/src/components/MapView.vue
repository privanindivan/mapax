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
    let errorCount = 0
    const MAX_ERRORS = 3
    const ERROR_RESET_INTERVAL = 10000

    const handleMapError = () => {
      errorCount++
      if (errorCount >= MAX_ERRORS) {
        console.log('Multiple errors detected, refreshing map...')
        refreshMap()
        errorCount = 0
      }
      setTimeout(() => {
        errorCount = Math.max(0, errorCount - 1)
      }, ERROR_RESET_INTERVAL)
    }

    const refreshMap = () => {
      if (!map.value) return
      try {
        markerGroup.value.clearLayers()
        markersMap.value.clear()

        props.markers.forEach(marker => {
          try {
            const lat = parseFloat(marker.lat || marker.latitude)
            const lng = parseFloat(marker.lng || marker.longitude)
            
            if (isNaN(lat) || isNaN(lng)) return

            const markerElement = createMarkerElement(marker)
            markerElement.addTo(markerGroup.value)
            markersMap.value.set(marker.id, markerElement)
          } catch (err) {
            console.error('Error adding marker:', err)
          }
        })
      } catch (err) {
        console.error('Error refreshing map:', err)
      }
    }

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

      L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2', {
        attribution: '',
        minZoom: 15,
        maxZoom: 19
      }).addTo(map.value)

      markerGroup.value = L.featureGroup().addTo(map.value)
      window.addEventListener('viewDetails', handleViewDetails)

      map.value.on('zoomend', () => {
        setTimeout(() => {
          if (document.querySelectorAll('.leaflet-marker-icon').length !== props.markers.length) {
            handleMapError()
          }
        }, 1000)
      })

      setInterval(() => {
        refreshMap()
      }, 30000)

      setTimeout(refreshMap, 1000)

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

    watch(() => props.markers, () => {
      refreshMap()
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
      refreshMap
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
