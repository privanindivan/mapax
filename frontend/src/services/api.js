import axios from 'axios';

const apiService = axios.create({
  baseURL: 'http://localhost:3000'
});

export const fetchPlaces = async () => {
  try {
    const response = await apiService.get('/mapa');
    return response.data;
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
};  