import { useState } from 'react';
import { Search, UserMinus, Shield } from 'lucide-react';
import { Chat } from '../../types/chat';
import { User } from '../../types/user';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../shared/Modal';
import { useChatStore } from '../../store/chatStore';
import { useGroupChat } from '../../hooks/useChat';
import { useSearchUsers } from '../../hooks/useUser';

interface EditGroupModalProps {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedChat: Chat) => void;
}

export const EditGroupModal = ({ chat, isOpen, onClose, onUpdate }: EditGroupModalProps) => {
  const { user: currentUser } = useAuthStore();
  const { setActiveChat, updateChat } = useChatStore();
  const [chatName, setChatName] = useState(chat.chatName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [error, setError] = useState('');

  const { updateGroupName, addToGroup, removeFromGroup, makeAdmin } = useGroupChat();
  const searchUsersMutation = useSearchUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    updateGroupName.mutate(
      { chatId: chat._id, chatName },
      {
        onSuccess: (updatedChat) => {
          updateChat(updatedChat);
          setActiveChat(updatedChat);
          onUpdate(updatedChat);
          onClose();
        },
        onError: () => {
          setError('Failed to update group name');
        },
      }
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchUsersMutation.mutate(query, {
        onSuccess: (results) => {
          setSearchResults(results.filter(u => !chat.users.some(cu => cu._id === u._id)));
        },
        onError: () => {
          console.error('Search failed');
        }
      });
    } else {
      setSearchResults([]);
    }
  };

  const handleAddUser = async (userId: string) => {
    addToGroup.mutate(
      { chatId: chat._id, userIds: userId },
      {
        onSuccess: (updatedChat) => {
          updateChat(updatedChat);
          setActiveChat(updatedChat);
          onUpdate(updatedChat);
          setSearchResults(searchResults.filter(u => u._id !== userId));
        },
        onError: () => {
          setError('Failed to add user');
        }
      }
    );
  };

  const handleRemoveUser = async (userId: string) => {
    removeFromGroup.mutate(
      { chatId: chat._id, userId },
      {
        onSuccess: (updatedChat) => {
          onUpdate(updatedChat);
          setActiveChat(updatedChat);
        },
        onError: () => {
          setError('Failed to remove user');
        }
      }
    );
  };

  const handleMakeAdmin = async (userId: string) => {
    makeAdmin.mutate(
      { chatId: chat._id, userId },
      {
        onSuccess: (updatedChat) => {
          updateChat(updatedChat);
          setActiveChat(updatedChat);
          onUpdate(updatedChat);
        },
        onError: () => {
          setError('Failed to make user admin');
        }
      }
    );
  };

  const isAdmin = (userId: string) => {
    return chat.admins.some(admin => admin._id === userId);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group"
    >
      <form onSubmit={handleSubmit}>
        {/* Group Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 
              placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black
              transition-all duration-200"
            placeholder="Enter group name"
            required
          />
        </div>

        {/* Admin Section */}
        {isAdmin(currentUser?._id || '') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Add Members
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 
                  placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                  transition-all duration-200"
                placeholder="Search users by email"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200">
                {searchResults.map(user => (
                  <div key={user._id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                    <span className="text-gray-900">{user.name}</span>
                    <button
                      type="button"
                      onClick={() => handleAddUser(user._id)}
                      className="text-[#FF6B3D] hover:text-[#FF5722] transition-colors duration-200"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Members
          </label>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {chat.users.map(user => (
              user._id !== currentUser?._id && (
                <div key={user._id} className="p-2 flex justify-between items-center hover:bg-gray-50">
                  <span className="text-gray-900">{user.name}</span>
                  <div className="flex gap-2">
                    {isAdmin(currentUser?._id || '') && !isAdmin(user._id) && (
                      <button
                        type="button"
                        onClick={() => handleMakeAdmin(user._id)}
                        className="text-[#FF6B3D] hover:text-[#FF5722] transition-colors duration-200"
                      >
                        <Shield className="w-5 h-5" />
                      </button>
                    )}
                    {isAdmin(currentUser?._id || '') && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user._id)}
                        className="text-red-500 hover:text-red-600 transition-colors duration-200"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-black bg-white border border-gray-200 rounded-lg 
              hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateGroupName.isPending}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 
              transition-all duration-200 transform hover:scale-105
              disabled:bg-gray-200 disabled:text-gray-400 disabled:transform-none"
          >
            {updateGroupName.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
