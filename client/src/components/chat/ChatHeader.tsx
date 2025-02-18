import { useState } from 'react';
import { MoreVertical, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Chat } from '../../types/chat';
import { EditGroupModal } from './EditGroupModal';
import { useNavigate } from 'react-router-dom';
import { useGroupChat } from '../../hooks/useChat';

interface ChatHeaderProps {
  chat: Chat | null;
  onChatUpdate?: (updatedChat: Chat) => void;
  onMobileMenuOpen?: () => void;
}

export const ChatHeader = ({ 
  chat, 
  onChatUpdate,
  onMobileMenuOpen 
}: ChatHeaderProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { leaveGroup } = useGroupChat();

  const getOtherUser = (chat: Chat) => {
    if (!user || !chat?.users) return null;
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
      await leaveGroup.mutateAsync(chat._id);
      setIsMenuOpen(false);
      navigate('/chat');
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleChatUpdate = (updatedChat: Chat) => {
    if (onChatUpdate) {
      onChatUpdate(updatedChat);
    }
  };

  if (!chat) return null;

  return (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center bg-white relative z-[30]">
        <button
          onClick={onMobileMenuOpen}
          className="p-2 mr-2 rounded-lg lg:hidden text-white transition-all duration-200 transform hover:scale-105"
        >
          <Menu size={24} />
        </button>
        <div className="w-10 h-10 rounded-lg bg-black border border-black flex items-center justify-center text-white">
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
        {/* Group chat menu button and modal */}
        {chat.isGroupChat && (
          <>
            <div className="relative">
              <button
                className="p-2 hover:bg-black hover:text-white rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-black border border-gray-800">
                  <div className="py-1">
                    <button 
                      onClick={handleEditClick}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white hover:text-black transition-colors"
                    >
                      Edit Group
                    </button>
                    <button 
                      onClick={handleLeaveGroup}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-white hover:text-red-600 transition-colors"
                    >
                      Leave Group
                    </button>
                  </div>
                </div>
              )}
            </div>
            <EditGroupModal
              chat={chat}
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onUpdate={handleChatUpdate}
            />
          </>
        )}
      </div>
    </>
  );
};