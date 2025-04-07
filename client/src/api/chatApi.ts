// src/api/chatApi.ts
import axios from 'axios';
import { Chat, Message } from '../types/chat';
// import { User } from '../types/user';
import api, { ApiError } from './api';

interface CreateChatData {
  users: string[];
  isGroupChat: boolean;
  chatName?: string; 
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

  // Create a new chat
  createChat: async (chatData: CreateChatData): Promise<Chat> => {
    try {
      // Ensure chatName is included in the request payload for group chats
      const payload = {
        users: chatData.users,
        isGroupChat: chatData.isGroupChat,
        ...(chatData.isGroupChat && { chatName: chatData.chatName }),
      };
      
      const { data } = await api.post<Chat>('/api/chats', payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || 'Failed to create chat'
        );
      }
      throw new ApiError(500, 'Failed to create chat');
    }
  },

  // Add users to group chat
  addToGroup: async (chatId: string, userIds: string | string[]): Promise<Chat> => {
    try {
      const payload = {
        userIds: Array.isArray(userIds) ? userIds : [userIds]
      };
      
      const { data } = await api.post<Chat>(`/api/chats/${chatId}/add`, payload);
      return data;
    } catch (error) {
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
};