import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socketManager } from '../socket/socketManager';
import { Message } from '../types/chat';

export const useSocket = () => {
  const { token } = useAuthStore();
  const { activeChat, addMessage } = useChatStore();
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (token) {
      socketManager.connect(token);
    }
    return () => {
      socketManager.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (activeChat?._id) {
      socketManager.joinChat(activeChat._id);
    }
  }, [activeChat?._id]);

  // Message handling with better error tracking
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      try {
        if (!message?._id || !message?.content || !message?.sender) {
          throw new Error('Invalid message format');
        }
        
        // Add message to store immediately
        addMessage(message);

      } catch (error) {
        console.error('Error handling new message:', error, message);
      }
    };

    socketManager.on('messageReceived', handleNewMessage);
    return () => socketManager.off('messageReceived', handleNewMessage);
  }, [activeChat?._id, addMessage]);

  // Typing indicators
  const handleTyping = useCallback((chatId: string) => {
    socketManager.emitTyping(chatId);
  }, []);

  const handleStopTyping = useCallback((chatId: string) => {
    socketManager.emitStopTyping(chatId);
  }, []);

  // Add typing events listener
  useEffect(() => {
    const handleUserTyping = ({ userId, userName }: { userId: string; userName: string }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: userName }));
      
      // Auto-remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }, 3000);
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    };

    socketManager.on('userTyping', handleUserTyping);
    socketManager.on('userStoppedTyping', handleStopTyping);

    return () => {
      socketManager.off('userTyping', handleUserTyping);
      socketManager.off('userStoppedTyping', handleStopTyping);
    };
  }, []);

  return {
    sendMessage: (chatId: string, content: string) => {
      if (!chatId || !content?.trim()) {
        console.error('Invalid message data:', { chatId, content });
        return false;
      }
            
      // Send message via socket
      socketManager.sendMessage(chatId, content.trim());
      
      // The message will be added to the store when received back from the server
      return true;
    },
    handleTyping,
    handleStopTyping,
    typingUsers
  };
};
