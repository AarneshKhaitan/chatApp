import { useState } from 'react';
import { X, Search, UserMinus, Shield } from 'lucide-react';
import { Chat } from '../../types/chat';
import { User } from '../../types/user';
import { chatApi } from '../../api/chatApi';
import { useAuthStore } from '../../store/authStore';

interface EditGroupModalProps {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedChat: Chat) => void;
}

export const EditGroupModal = ({ chat, isOpen, onClose, onUpdate }: EditGroupModalProps) => {
  const { user: currentUser } = useAuthStore();
  const [chatName, setChatName] = useState(chat.chatName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updatedChat = await chatApi.updateGroupName(chat._id, chatName);
      onUpdate(updatedChat);
      onClose();
    } catch (err) {
      setError('Failed to update group name');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await chatApi.searchUsers(query);
        setSearchResults(results.filter(u => !chat.users.some(cu => cu._id === u._id)));
      } catch (err) {
        console.error('Search failed:', err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddUser = async (userId: string) => {
    try {
      const updatedChat = await chatApi.addToGroup(chat._id, userId);
      onUpdate(updatedChat);
      setSearchResults(searchResults.filter(u => u._id !== userId));
    } catch (err) {
      setError('Failed to add user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const updatedChat = await chatApi.removeFromGroup(chat._id, userId);
      onUpdate(updatedChat);
    } catch (err) {
      setError('Failed to remove user');
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      const updatedChat = await chatApi.makeAdmin(chat._id, userId);
      onUpdate(updatedChat);
    } catch (err) {
      setError('Failed to make user admin');
    }
  };

  const isAdmin = (userId: string) => {
    return chat.admins.some(admin => admin._id === userId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Group</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Only show add members section for admins */}
          {isAdmin(currentUser?._id || '') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Members
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Search users by email"
                />
                <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg divide-y">
                  {searchResults.map(user => (
                    <div key={user._id} className="p-2 flex justify-between items-center">
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => handleAddUser(user._id)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members
            </label>
            <div className="border rounded-lg divide-y text-gray-900">
              {chat.users.map(user => (
                user._id !== currentUser?._id && (
                  <div key={user._id} className="p-2 flex justify-between items-center">
                    <span>{user.name}</span>
                    <div className="flex gap-2">
                      {isAdmin(currentUser?._id || '') && !isAdmin(user._id) && (
                        <button
                          type="button"
                          onClick={() => handleMakeAdmin(user._id)}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                      )}
                      {isAdmin(currentUser?._id || '') && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user._id)}
                          className="text-red-500 hover:text-red-600"
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

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
