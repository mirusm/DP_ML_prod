import axios from 'axios';
import { auth } from '../firebase/firebase';

const API_URL = process.env.REACT_APP_API_URL || 'https://49.12.65.96/api'; // Fallback for local dev without .env

const getAuthHeader = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }
  throw new Error('No user logged in');
};

export const predictMolecule = async (data) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.post(
      `${API_URL}/upload-dataset/`, 
      data,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPredictionHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/prediction-history/`);
    console.log('API Response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('API Error:', error); // Debug log
    throw error;
  }
}; 

export const deletePrediction = async (predictionId) => {
  try {
    const config = await getAuthHeader();
    const response = await axios.delete(
      `${API_URL}/prediction/${predictionId}/delete/`,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Delete API Error:', error);
    throw error;
  }
};