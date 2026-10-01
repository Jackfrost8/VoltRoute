import axiosInstance from './axiosConfig';

export const stationService = {
  getAllStations: async () => {
    const response = await axiosInstance.get('/stations');
    return response.data;
  },
  getStationById: async (id) => {
    const response = await axiosInstance.get(`/stations/${id}`);
    return response.data;
  },
  searchStations: async (query) => {
    const response = await axiosInstance.get(`/stations/search`, { params: { query } });
    return response.data;
  },
  filterStations: async (filters) => {
    const response = await axiosInstance.post('/stations/filter', filters);
    return response.data;
  }
};
