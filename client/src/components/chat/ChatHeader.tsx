import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Chat } from '../../types/chat';
import { EditGroupModal } from './EditGroupModal';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chatApi';
import { useChatStore } from '../../store/chatStore';  // Add this

interface ChatHeaderProps {
  chat: Chat | null;
  onChatUpdate?: (updatedChat: Chat) => void;
}

export const ChatHeader = ({ chat, onChatUpdate }: ChatHeaderProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setActiveChat } = useChatStore();  // Add this
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getOtherUser = (chat: Chat) => {
    if (!user || !chat?.users) return null;
    // Use _id to match MongoDB id format
    return chat.users.find(u => u._id !== user._id) || null;
  };

  const getChatDisplayName = (chat: Chat | null): string => {
    if (!chat) return '';
    if (chat.isGroupChat) return chat.chatName || 'Unnamed Group';
    const otherUser = getOtherUser(chat);
    return otherUser?.name || 'Unknown User';
  };

  const getChatInitial = (chat: Chat | null): string => {
    const displayName = getChatDisplayName(chat);
    return displayName ? displayName.charAt(0).toUpperCase() : '?';
  };

  const handleEditClick = () => {
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleLeaveGroup = async () => {
    if (!chat) return;
    
    try {
      await chatApi.leaveGroup(chat._id);
      setIsMenuOpen(false);
      // Navigate to chats list after leaving
      navigate('/chat');
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    setActiveChat(updatedChat);  // Update active chat in store
    if (onChatUpdate) {
      onChatUpdate(updatedChat);
    }
  };

  if (!chat) return null;

  return (
    <>
      <div className="p-4 border-b border-gray-100 flex items-center bg-white">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          {getChatInitial(chat)}
        </div>
        <div className="flex-1 ml-3">
          <span className="font-medium text-gray-900">
            {getChatDisplayName(chat)}
          </span>
          <span className="text-xs text-gray-500 block">
            {chat.isGroupChat 
              ? `${chat.users.length} members`
              : getOtherUser(chat)?.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-50 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {isMenuOpen && chat.isGroupChat && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button 
                  onClick={handleEditClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Group
                </button>
                <button 
                  onClick={handleLeaveGroup}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Leave Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {chat.isGroupChat && (
        <EditGroupModal
          chat={chat}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleChatUpdate}
        />
      )}
    </>
  );
};
