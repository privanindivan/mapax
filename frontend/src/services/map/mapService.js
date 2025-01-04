// @ts-nocheck
import L from 'leaflet';
import { PHILIPPINES_BOUNDS, GMA_COORDINATES } from '../../config';

export const initializeMap = (containerId) => {
  const map = L.map(containerId, {
    center: GMA_COORDINATES,
    zoom: 14,
    minZoom: 6,
    maxZoom: 19,
    zoomControl: false,
    maxBounds: L.latLngBounds(PHILIPPINES_BOUNDS.southwest, PHILIPPINES_BOUNDS.northeast),
    maxBoundsViscosity: 1.0
  });

  // Make sure to add the tile layer
  L.tileLayer('https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey=375c923e2b8447249e6774bc2d2f3fa2', {
    attribution: '© OpenStreetMap contributors & Thunderforest',
    minZoom: 6,
    maxZoom: 19
  }).addTo(map);

  return map;
};