import axiosInstance from './axiosConfig';

export const favoriteService = {
  getFavorites: async () => {
    const response = await axiosInstance.get('/favorites');
    return response.data;
  },
  addFavorite: async (stationId) => {
    const response = await axiosInstance.post('/favorites', { stationId });
    return response.data;
  },
  removeFavorite: async (id) => {
    const response = await axiosInstance.delete(`/favorites/${id}`);
    return response.data;
  }
};
