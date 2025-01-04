import { supabase } from './supabase';

export const placesService = {
  async getPlaces() {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('votes', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addPlace(place) {
    const { data, error } = await supabase
      .from('places')
      .insert([{
        name: place.name,
        latitude: place.lat,
        longitude: place.lng,
        description: place.description,
        votes: 0,
        images: [],
        comments: []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlace(place) {
    const { data, error } = await supabase
      .from('places')
      .update({
        name: place.name,
        description: place.description,
        votes: place.votes,
        images: place.images,
        comments: place.comments,
        has_voted: place.hasVoted,
        last_edited: new Date()
      })
      .eq('id', place.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('place-images')
      .upload(fileName, file);

    if (error) throw error;
    return data;
  }
};