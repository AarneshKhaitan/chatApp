import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useSearchUsers } from '../../hooks/useUser';
import { useCreateChat, useChats } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { User } from '../../types/user';
import { Modal } from '../shared/Modal';

interface NewChatModalProps {  // Rename from NewChatButtonProps to NewChatModalProps
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal = ({ isOpen, onClose }: NewChatModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const { setActiveChat } = useChatStore();

  const searchUsers = useSearchUsers();
  const createChat = useCreateChat();
  const { data: existingChats = [] } = useChats();

  const handleSearch = (email: string) => {
    setSearchQuery(email);
    if (email.trim()) {
      searchUsers.mutate(email);
    }
  };

  const handleCreateChat = async (userId?: string) => {
    try {
      const chatData = isGroupChat
        ? {
            isGroupChat: true,
            users: selectedUsers.map(user => user._id),
            chatName: groupName.trim(), // Ensure trimmed value
          }
        : {
            isGroupChat: false,
            users: [userId!],
          };
      
      console.log('Sending chat data:', chatData);
      const newChat = await createChat.mutateAsync(chatData);
      console.log('Created chat:', newChat);
      setActiveChat(newChat);
      onClose();  // Use the provided onClose instead of setIsOpen
      // Reset state
      setSelectedUsers([]);
      setGroupName('');
      setIsGroupChat(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => 
      prev.some(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
  };

  // Filter out users that already have a 1:1 chat with current user
  const filteredUsers = searchUsers.data?.filter(searchedUser => {
    // Don't filter if we're creating a group chat
    if (isGroupChat) return true;

    // Check if a 1:1 chat already exists with this user
    const existingChat = existingChats.find(chat => 
      !chat.isGroupChat && 
      chat.users.some(u => u._id === searchedUser._id)
    );

    return !existingChat;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New ${isGroupChat ? 'Group' : ''} Chat`}
    >
      <div>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsGroupChat(!isGroupChat)}
            className={`p-2 rounded-lg transition-colors duration-200 
              ${isGroupChat ? 'bg-black text-white' : 'bg-white border border-gray-200 text-black'}`}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {isGroupChat && (
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 
              placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black
              transition-all duration-200"
          />
        )}

        <div className="relative mb-4">
          <input
            type="email"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full p-2 pl-8 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 
              placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-black
              transition-all duration-200"
          />
          <Search className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
        </div>

        <div className="mb-4">
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedUsers.map(user => (
                <span key={user._id} className="bg-black text-white px-2 py-1 rounded-full text-sm">
                  {user.name}
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="ml-2 text-white/80 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {searchUsers.isPending ? (
            <div className="text-center py-4">Searching...</div>
            ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchQuery 
                ? searchUsers.data?.length 
                ? 'You already have a chat with these users' 
                : 'No users found'
                : 'Search for users by email'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`flex items-center justify-between p-3 hover:bg-black hover:text-white rounded-lg cursor-pointer
                  transition-colors duration-200
                ${selectedUsers.some(u => u._id === user._id) ? 'bg-black text-white' : 'bg-white text-black'}`}
                onClick={() => isGroupChat ? toggleUserSelection(user) : handleCreateChat(user._id)}
              >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${selectedUsers.some(u => u._id === user._id) 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white group-hover:bg-white group-hover:text-black'}`}>
                    {user.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{user.name}</p>
                  <p className={`text-sm ${selectedUsers.some(u => u._id === user._id) 
                    ? 'text-gray-300' 
                    : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {isGroupChat && selectedUsers.length > 0 && (
          <button
            onClick={() => handleCreateChat()}
            disabled={!groupName.trim() || selectedUsers.length < 2}
            className="w-full mt-4 p-2 bg-black text-white rounded-lg 
              hover:bg-gray-900 transition-all duration-200 transform hover:scale-105
              disabled:bg-gray-200 disabled:text-gray-400 disabled:transform-none"
          >
            Create Group Chat
          </button>
        )}
      </div>
    </Modal>
  );
};
