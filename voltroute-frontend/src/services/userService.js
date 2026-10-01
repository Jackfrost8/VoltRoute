import axiosInstance from './axiosConfig';

export const userService = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/profile');
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/users/profile', userData);
    return response.data;
  },
  deleteAccount: async () => {
    const response = await axiosInstance.delete('/users/account');
    return response.data;
  }
};
