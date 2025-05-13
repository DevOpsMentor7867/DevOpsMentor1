import axios from 'axios';
import { useAuthContext } from '../Context/AuthContext';

const BASE_URL = 'http://localhost:8000/api';

export const useChatAPI = () => {
  const { token } = useAuthContext();

  const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
  });

  // Add request interceptor to add token to all requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // Add response interceptor to handle common errors
  api.interceptors.response.use((response) => {
    return response;
  }, (error) => {
    if (error.response?.status === 429) {
      throw new Error('I apologize, but I\'m currently unable to process your request due to high demand. Please try again later.');
    }
    if (error.response?.status === 401) {
      // Handle unauthorized access (you might want to dispatch a logout action here)
      throw new Error('Unauthorized access. Please log in again.');
    }
    return Promise.reject(error);
  });

  const getConversationHistory = async () => {
    try {
      const response = await api.get('/user/conversation');
      const data = response.data;

      if (data.success && data.conversation && data.conversation.messages) {
        return data.conversation.messages.map(msg => ({
          id: msg._id || Date.now(),
          content: msg.content,
          sender: {
            name: msg.sender === 'USER' ? 'You' : 'AI Assistant',
            isBot: msg.sender === 'AI_ASSISTANT'
          },
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          })
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch conversation history');
    }
  };

  const sendMessage = async (message) => {
    try {
      const response = await api.post('/user/chat', { message });
      const data = response.data;

      if (data.data?.botMessage) {
        return {
          success: true,
          response: data.data.botMessage.content,
          botMessage: data.data.botMessage
        };
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  };

  return {
    getConversationHistory,
    sendMessage
  };
};

