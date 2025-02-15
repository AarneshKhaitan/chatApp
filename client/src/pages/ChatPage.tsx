import { ChatLayout } from '../components/chat/ChatLayout';
import { ChatList } from '../components/chat/ChatList';
import { ChatBox } from '../components/chat/ChatBox';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageInput } from '../components/chat/MessageInput';
import { useChats, useMessages } from '../hooks/useChat';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { socketManager } from '../socket/socketManager';
import { Message } from '../types/chat';
import { useQueryClient } from '@tanstack/react-query';

export const ChatPage = () => {
  const { activeChat, addMessage } = useChatStore();
  const { isLoading: isLoadingChats } = useChats();
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useMessages(activeChat?._id);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?._id || '';

  // Subscribe to real-time messages
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      console.log('Received new message:', message);
      
      // Add to global store first
      addMessage(message);

      // Update chats list to reflect latest message
      queryClient.invalidateQueries({ queryKey: ['chats'] });

      // Then update messages if in active chat
      if (activeChat?._id === message.chat._id) {
        queryClient.setQueryData(
          ['messages', activeChat._id],
          (oldData: Message[] | undefined) => {
            const messages = oldData || [];
            if (messages.some(m => m._id === message._id)) return messages;
            return [...messages, message];
          }
        );
      }
    };

    socketManager.on('messageReceived', handleNewMessage);
    return () => socketManager.off('messageReceived', handleNewMessage);
  }, [activeChat?._id, queryClient, addMessage]);

  if (isLoadingChats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ChatLayout
      sidebar={<ChatList />}
      main={
        activeChat ? (
          <div className="flex flex-col h-full w-full">
            <ChatHeader chat={activeChat} />
            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <ChatBox 
                messages={messages}
                currentUserId={currentUserId} 
                chatId={activeChat._id}
              />
            )}
            <MessageInput chatId={activeChat._id} />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )
      }
    />
  );
};