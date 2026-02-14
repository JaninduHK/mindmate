import axiosInstance from './axios.config.js';

export const uploadAPI = {
  // Upload image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete image
  deleteImage: async () => {
    const response = await axiosInstance.delete('/upload/image');
    return response.data;
  },
};
