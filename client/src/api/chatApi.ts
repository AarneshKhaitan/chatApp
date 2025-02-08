// src/api/chatApi.ts
import axios from 'axios';
import { Chat, Message } from '../types/chat';
import { User } from '../types/user';
import api, { ApiError } from './api'; // Reuse the configured axios instance

interface CreateChatData {
  users: string[];
  isGroupChat: boolean;
  chatName?: string;  // Changed back to chatName to match backend
}

interface SendMessageData {
  content: string;
  chatId: string;
}

export const chatApi = {
  // Get all chats for the current user
  getChats: async (): Promise<Chat[]> => {
    try {
      const { data } = await api.get<Chat[]>('/api/chats');
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to fetch chats'
        );
      }
      throw new ApiError(500, 'Failed to fetch chats');
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId: string): Promise<Message[]> => {
    try {
      const { data } = await api.get<Message[]>(`/api/messages/chat/${chatId}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to fetch messages'
        );
      }
      throw new ApiError(500, 'Failed to fetch messages');
    }
  },

  // Send a new message
  sendMessage: async ({ content, chatId }: SendMessageData): Promise<Message> => {
    try {
      const { data } = await api.post<Message>(`/api/messages/chat/${chatId}`, {
        content
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to send message'
        );
      }
      throw new ApiError(500, 'Failed to send message');
    }
  },

  // Create a new chat
  createChat: async (chatData: CreateChatData): Promise<Chat> => {
    try {
      console.log('Creating chat with data:', chatData);
      // Ensure chatName is included in the request payload for group chats
      const payload = {
        users: chatData.users,
        isGroupChat: chatData.isGroupChat,
        ...(chatData.isGroupChat && { chatName: chatData.chatName }),
      };
      
      const { data } = await api.post<Chat>('/api/chats', payload);
      return data;
    } catch (error) {
      console.error('Create chat error:', error);
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to create chat'
        );
      }
      throw new ApiError(500, 'Failed to create chat');
    }
  },

  // Search users for creating chats
  searchUsers: async (email: string): Promise<User[]> => {
    try {
      const { data } = await api.get<User[]>(`/api/users/search`, {
        params: { email } // Changed from search to email to match backend
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to search users'
        );
      }
      throw new ApiError(500, 'Failed to search users');
    }
  },

  // Add users to group chat
  addToGroup: async (chatId: string, userIds: string | string[]): Promise<Chat> => {
    try {
      console.log('Adding users to group chat:', { chatId, userIds });
      const payload = {
        userIds: Array.isArray(userIds) ? userIds : [userIds]
      };
      
      const { data } = await api.post<Chat>(`/api/chats/${chatId}/add`, payload);
      return data;
    } catch (error) {
      console.error('Add to group error:', error);
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to add users to group'
        );
      }
      throw new ApiError(500, 'Failed to add users to group');
    }
  },

  // Remove user from group chat
  removeFromGroup: async (chatId: string, userId: string): Promise<Chat> => {
    try {
      const { data } = await api.post<Chat>(`/api/chats/${chatId}/remove`, {
        userId
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to remove user from group'
        );
      }
      throw new ApiError(500, 'Failed to remove user from group');
    }
  },

  // Update group chat name
  updateGroupName: async (chatId: string, chatName: string): Promise<Chat> => {
    try {
      const { data } = await api.put<Chat>(`/api/chats/${chatId}`, {
        chatName
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to update group name'
        );
      }
      throw new ApiError(500, 'Failed to update group name');
    }
  },

  // Make user admin in group chat
  makeAdmin: async (chatId: string, userId: string): Promise<Chat> => {
    try {
      const { data } = await api.post<Chat>(`/api/chats/${chatId}/make-admin`, {
        userId
      });
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to make user admin'
        );
      }
      throw new ApiError(500, 'Failed to make user admin');
    }
  },

  // Leave group chat
  leaveGroup: async (chatId: string): Promise<void> => {
    try {
      await api.post(`/api/chats/${chatId}/leave`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to leave group'
        );
      }
      throw new ApiError(500, 'Failed to leave group');
    }
  },

  // Mark messages as read
  markAsRead: async (chatId: string): Promise<void> => {
    try {
      await api.put(`/api/chats/${chatId}/read`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to mark messages as read'
        );
      }
      throw new ApiError(500, 'Failed to mark messages as read');
    }
  },
};