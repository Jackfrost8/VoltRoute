import axiosInstance from './axiosConfig';

export const aiService = {
  getTravelTimePrediction: async (data) => {
    const response = await axiosInstance.post('/ai/travel-time', data);
    return response.data;
  },
  getDemandPrediction: async (data) => {
    const response = await axiosInstance.post('/ai/demand', data);
    return response.data;
  },
  getOptimizedRoute: async (data) => {
    const response = await axiosInstance.post('/ai/route', data);
    return response.data;
  }
};
