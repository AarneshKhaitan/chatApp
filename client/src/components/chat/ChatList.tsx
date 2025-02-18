import { useChatStore } from '../../store/chatStore';
import { Chat } from '../../types/chat';
import { format, isToday } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useChats } from '../../hooks/useChat';
import { useState, useMemo, useCallback } from 'react';
import { NewChatButton } from './NewChatButton';
import { LogOut } from 'lucide-react'; // Add this import
import { useNavigate } from 'react-router-dom'; // Add this import
import { authApi } from '../../api/authApi'; // Add this import
import { Modal } from '../shared/Modal';  // Add this import

export const ChatList = () => {
    const { activeChat, setActiveChat } = useChatStore();
    const { user } = useAuthStore();
    const { data: chats = [], isLoading, error } = useChats();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate(); // Add this
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Memoize helper functions

    const getOtherUser = useCallback((chat: Chat) => {
        if (!user?._id || !chat.users) return null;;  // Changed from user?.id to user?._id
        return chat.users.find(u => u._id !== user._id) || null;
    }, [user?._id]);

    const getChatDisplayName = useCallback((chat: Chat): string => {
        if (!chat) return 'Unknown';
        if (chat.isGroupChat) return chat.chatName || 'Unnamed Group';
        
        // Add temporary debug logging
        console.log('Chat users:', chat.users);
        console.log('Current user:', user);
        
        const otherUser = getOtherUser(chat);
        
        // Add temporary debug logging
        console.log('Other user found:', otherUser);
        
        return otherUser?.name || 'Unknown User';
    }, [getOtherUser, user]); // Added user to dependencies

    const getChatInitial = useCallback((chat: Chat): string => {
        const displayName = getChatDisplayName(chat);
        return displayName.charAt(0).toUpperCase();
    }, [getChatDisplayName]);

    // Safe date formatting function
    const getMessageDateTime = useCallback((dateString: string | Date | undefined) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', dateString);
                return '';
            }
            
            if (isToday(date)) {
                return format(date, 'HH:mm');
            }
            return format(date, 'MMM d');
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    }, []);

    const sortedAndFilteredChats = useMemo(() => {
        if (!chats?.length) return [];
        
        let filtered = chats;
        if (searchQuery.trim()) {
            filtered = chats.filter(chat => {
                const displayName = getChatDisplayName(chat).toLowerCase();
                const lastMessage = chat.latestMessage?.content?.toLowerCase() || '';
                const searchTerm = searchQuery.toLowerCase();
                return displayName.includes(searchTerm) || lastMessage.includes(searchTerm);
            });
        }

        return filtered.sort((a, b) => {
            const aTime = new Date(a.latestMessage?.createdAt || 0).getTime();
            const bTime = new Date(b.latestMessage?.createdAt || 0).getTime();
            return bTime - aTime;
        });
    }, [chats, searchQuery, getChatDisplayName]);

    const renderChatItem = useCallback((chat: Chat) => {
        if (!chat?._id) return null;

        return (
            <div
                key={chat._id}
                className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 
                ${activeChat?._id === chat._id ? 'bg-gray-50' : ''}`}
                onClick={() => setActiveChat(chat)}
            >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                    {getChatInitial(chat)}
                </div>
                <div className="ml-3 flex-1">
                    <p className="font-medium text-sm text-gray-900">
                        {getChatDisplayName(chat)}
                    </p>
                    <p className="text-xs text-gray-500 truncate min-h-[1.25rem]">
                        {chat.latestMessage?.content || 'No messages yet'}
                    </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                    {chat.latestMessage?.createdAt && (
                        <span className="text-xs text-gray-500">
                            {getMessageDateTime(chat.latestMessage.createdAt)}
                        </span>
                    )}
                </div>
            </div>
        );
    }, [activeChat?._id, getChatDisplayName, getChatInitial, getMessageDateTime, setActiveChat]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="h-full flex items-center justify-center text-red-500">Error loading chats</div>;
    }

    return (
        <>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                        placeholder="Search chats..."
                    />
                    <NewChatButton />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {!sortedAndFilteredChats.length ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            {searchQuery ? 'No matching chats found' : 'No chats found'}
                        </div>
                    ) : (
                        sortedAndFilteredChats.map(renderChatItem)
                    )}
                </div>
                
                {/* Fixed footer section */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

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
                            className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg"
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
    );
};
