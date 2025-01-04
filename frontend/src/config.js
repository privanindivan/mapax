export const PHILIPPINES_BOUNDS = {
  southwest: [4.566667, 116.7],
  northeast: [21.120556, 126.537778]
};

export const GMA_COORDINATES = [14.293054, 121.005381];
  // Map settings
  export const MAP_CONFIG = {
    center: [14.293054, 121.005381], // GMA coordinates
    zoom: 14,
    minZoom: 6,
    maxZoom: 19,
    zoomControl: false,
    tileLayer: {
      url: 'https://tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png',
      apiKey: '375c923e2b8447249e6774bc2d2f3fa2',
      attribution: '© OpenStreetMap contributors & Thunderforest'
    }
  };