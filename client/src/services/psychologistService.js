// psychologistService.js - Frontend service for API calls

import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

export const psychologistService = {
  // Create a new psychologist profile
  createProfile: async (formData, userId) => {
    try {
      const token = await getAuthToken();
      const data = new FormData();
      
      // Append all form fields
      data.append('userId', userId);
      data.append('name', formData.name);
      data.append('title', formData.title);
      data.append('email', formData.email);
      data.append('phone', formData.phone || '');
      data.append('location', formData.location);
      data.append('experience', formData.experience);
      data.append('bio', formData.bio);
      data.append('price', formData.price);
      data.append('languages', JSON.stringify(formData.languages));
      data.append('specialties', JSON.stringify(formData.specialties));
      data.append('education', JSON.stringify(formData.education));
      data.append('workExperience', JSON.stringify(formData.workExperience));
      data.append('licenseNumber', formData.licenseNumber || '');
      // data.append('typicalHours', formData.typicalHours);
      
      // Append profile image if exists
      if (formData.profileImage) {
        data.append('profileImage', formData.profileImage);
      }

      const response = await fetch(`${API_BASE_URL}/api/psychologists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create profile');
      }

      return result;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  // Get profile by userId
  getProfile: async (userId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/psychologists/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch profile');
      }

      return result;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update psychologist profile
  updateProfile: async (formData, userId) => {
    try {
      console.log('=== FRONTEND UPDATE PROFILE ===');
      console.log('Form data received:', formData);
      console.log('Profile image:', formData.profileImage);
      console.log('Profile image is File?', formData.profileImage instanceof File);
      
      const token = await getAuthToken();
      const data = new FormData();
      
      // Append all form fields (if they exist)
      if (formData.name) data.append('name', formData.name);
      if (formData.title) data.append('title', formData.title);
      if (formData.email) data.append('email', formData.email);
      if (formData.phone !== undefined) data.append('phone', formData.phone || '');
      if (formData.location) data.append('location', formData.location);
      if (formData.experience) data.append('experience', formData.experience);
      if (formData.bio) data.append('bio', formData.bio);
      if (formData.price) data.append('price', formData.price);
      if (formData.languages) data.append('languages', JSON.stringify(formData.languages));
      if (formData.specialties) data.append('specialties', JSON.stringify(formData.specialties));
      if (formData.education) data.append('education', JSON.stringify(formData.education));
      if (formData.workExperience) data.append('workExperience', JSON.stringify(formData.workExperience));
      if (formData.licenseNumber !== undefined) data.append('licenseNumber', formData.licenseNumber || '');
      // if (formData.typicalHours) data.append('typicalHours', formData.typicalHours);
      if (formData.availability) data.append('availability', JSON.stringify(formData.availability));
      
      // Append profile image if exists and is a File object
      if (formData.profileImage instanceof File) {
        console.log('Appending profile image to FormData');
        data.append('profileImage', formData.profileImage);
      } else if (formData.deleteProfileImage === true) {
        console.log('Marking profile image for deletion');
        data.append('deleteProfileImage', 'true');
      } else {
        console.log('No new profile image to upload');
      }

      console.log('Sending request to:', `${API_BASE_URL}/api/psychologists/${userId}`);

      const response = await fetch(`${API_BASE_URL}/api/psychologists/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      console.log('==============================');
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Delete profile
  deleteProfile: async (userId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/psychologists/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete profile');
      }

      return result;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
};
