import { useState, useEffect } from 'react';
import { ChatLayout } from '../components/chat/ChatLayout';
import { ChatList } from '../components/chat/ChatList';
import { ChatBox } from '../components/chat/ChatBox';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageInput } from '../components/chat/MessageInput';
import { useChats, useMessages } from '../hooks/useChat';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { socketManager } from '../socket/socketManager';
import { Message } from '../types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../components/shared/Modal';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Menu } from 'lucide-react';
import { NewChatModal } from '../components/chat/NewChatModal';

export const ChatPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { activeChat, addMessage } = useChatStore();
  const { isLoading: isLoadingChats } = useChats();
  const { 
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useMessages(activeChat?._id);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?._id || '';
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const handleNewMessage = (message: Message) => {      
      addMessage(message);
      queryClient.invalidateQueries({ queryKey: ['chats'] });

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

  const renderHeader = () => {
    if (activeChat) {
      return (
        <ChatHeader 
          chat={activeChat} 
          onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
        />
      );
    }

    return (
      <div className="flex items-center p-4 border-b border-gray-200">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-2 text-xl font-semibold">Messages</h1>
      </div>
    );
  };

  if (isLoadingChats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ChatLayout
      sidebar={
        <ChatList 
          onLogoutClick={() => setIsLogoutModalOpen(true)} 
          onNewChat={() => setIsNewChatOpen(true)}
        />
      }
      main={
        <div className="flex flex-col h-full w-full">
          {renderHeader()}
          {activeChat ? (
            <>
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      }
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      modal={
        <>
          <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
          <Modal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            title="Confirm Logout"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to logout?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-4 py-2 text-black bg-white border border-gray-200 rounded-lg 
              hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </Modal>
        </>
      }
    />
  );
};