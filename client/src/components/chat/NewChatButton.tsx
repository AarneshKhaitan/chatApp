import { useState } from 'react';
import { Plus, Search, X, Users } from 'lucide-react';
import { useSearchUsers } from '../../hooks/useUser';
import { useCreateChat } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { User } from '../../types/user';

export const NewChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const { setActiveChat } = useChatStore();

  const searchUsers = useSearchUsers();
  const createChat = useCreateChat();

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
      setIsOpen(false);
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">New {isGroupChat ? 'Group' : ''} Chat</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGroupChat(!isGroupChat)}
                  className={`p-2 rounded-lg ${isGroupChat ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
                >
                  <Users className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isGroupChat && (
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2 mb-4 border rounded-lg"
              />
            )}

            <div className="relative mb-4">
              <input
                type="email"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-2 pl-8 border rounded-lg"
              />
              <Search className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
            </div>

            <div className="mb-4">
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map(user => (
                    <span key={user._id} className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                      {user.name}
                      <button
                        onClick={() => toggleUserSelection(user)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
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
              ) : !searchUsers.data || searchUsers.data.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchQuery ? 'No users found' : 'Search for users by email'}
                </div>
              ) : (
                searchUsers.data.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer
                      ${selectedUsers.some(u => u._id === user._id) ? 'bg-gray-50' : ''}`}
                    onClick={() => isGroupChat ? toggleUserSelection(user) : handleCreateChat(user._id)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
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
                className="w-full mt-4 p-2 bg-orange-500 text-white rounded-lg disabled:bg-gray-300"
              >
                Create Group Chat
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
