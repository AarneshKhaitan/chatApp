import { create } from 'zustand';
import { Chat, Message, User } from '../types/chat';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  selectedUsers: User[];
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateChat: (updatedChat: Chat) => void;
  setSelectedUsers: (users: User[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  selectedUsers: [],
  
  setChats: (chats) => set({ chats }),
  
  setActiveChat: (chat) => set({ activeChat: chat }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
    chats: state.chats.map(chat => 
      chat._id === message.chat._id 
        ? { ...chat, latestMessage: message }
        : chat
    ),
  })),
  
  updateChat: (updatedChat) => set((state) => ({
    chats: state.chats.map(chat => 
      chat._id === updatedChat._id ? updatedChat : chat
    ),
    activeChat: state.activeChat?._id === updatedChat._id 
      ? updatedChat 
      : state.activeChat,
  })),
  
  setSelectedUsers: (users) => set({ selectedUsers: users }),
}));