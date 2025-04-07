import { create } from 'zustand';
import { Chat, Message } from '../types/chat';
import {User} from '../types/user';

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

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  selectedUsers: [],
  
  setChats: (chats) => {
    const currentChats = get().chats;
    if (JSON.stringify(currentChats) !== JSON.stringify(chats)) {
      set({ chats });
    }
  },
  
  setActiveChat: (chat) => {
    const currentChat = get().activeChat;
    if (JSON.stringify(currentChat) !== JSON.stringify(chat)) {
      set({ activeChat: chat });
    }
  },
  
  setMessages: (messages) => set(() => {
    if (!Array.isArray(messages)) return { messages: [] };

    const validMessages = messages
      .filter(msg => msg?._id && msg?.content && msg?.sender)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { messages: validMessages };
  }),

  addMessage: (message) => set((state) => {
    if (!message?._id || !message?.content || !message?.sender) {
      console.error('Invalid message format in store:', message);
      return state;
    }

    if (state.messages.some(m => m._id === message._id)) {
      return state;
    }

    const updatedChats = state.chats.map(chat => {
      if (chat._id === message.chat._id) {
        return {
          ...chat,
          latestMessage: message
        };
      }
      return chat;
    });

    // Sort chats to bring the most recent to top
    const sortedChats = [...updatedChats].sort((a, b) => {
      const aTime = new Date(a.latestMessage?.createdAt || 0).getTime();
      const bTime = new Date(b.latestMessage?.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return {
      messages: [...state.messages, message],
      chats: sortedChats,
      activeChat: state.activeChat?._id === message.chat._id
        ? { ...state.activeChat, latestMessage: message }
        : state.activeChat,
      selectedUsers: state.selectedUsers  // Preserve other state
    };
  }),
  
  updateChat: (updatedChat) => set((state) => {
    // Update in chats array
    const updatedChats = state.chats.map(chat => 
      chat._id === updatedChat._id ? updatedChat : chat
    );

    return {
      chats: updatedChats,
      activeChat: state.activeChat?._id === updatedChat._id 
        ? updatedChat 
        : state.activeChat,
      messages: state.messages,
      selectedUsers: state.selectedUsers
    };
  }),
  
  setSelectedUsers: (users) => set({ selectedUsers: users }),
}));