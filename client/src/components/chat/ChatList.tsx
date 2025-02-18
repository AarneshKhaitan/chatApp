import { useChatStore } from '../../store/chatStore';
import { Chat } from '../../types/chat';
import { format, isToday } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useChats } from '../../hooks/useChat';
import { useState, useMemo, useCallback } from 'react';
import { LogOut } from 'lucide-react'; // Add this import
import { Plus } from 'lucide-react';  // Add this import

interface ChatListProps {
  onLogoutClick: () => void;
  onNewChat: () => void;  // Add this prop
}

export const ChatList = ({ onLogoutClick, onNewChat }: ChatListProps) => {
    const { activeChat, setActiveChat } = useChatStore();
    const { user } = useAuthStore();
    const { data: chats = [], isLoading, error } = useChats();
    const [searchQuery, setSearchQuery] = useState('');

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
    
        const isActiveOrHover = activeChat?._id === chat._id ? 'bg-black' : 'bg-white hover:bg-black';
        
        return (
            <div
                key={chat._id}
                className={`p-4 flex items-center cursor-pointer transition-colors duration-200 group
                    ${isActiveOrHover}`}
                onClick={() => setActiveChat(chat)}
            >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center
                    ${activeChat?._id === chat._id 
                        ? 'bg-white border-white text-black' 
                        : 'bg-black border-black text-white group-hover:bg-white group-hover:border-white group-hover:text-black'}`}
                >
                    {getChatInitial(chat)}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className={`font-medium text-sm
                        ${activeChat?._id === chat._id 
                            ? 'text-white' 
                            : 'text-gray-900 group-hover:text-white'}`}
                    >
                        {getChatDisplayName(chat)}
                    </p>
                    <p className={`text-xs truncate min-h-[1.25rem]
                        ${activeChat?._id === chat._id 
                            ? 'text-gray-400' 
                            : 'text-gray-500 group-hover:text-gray-400'}`}
                    >
                        {chat.latestMessage?.content || 'No messages yet'}
                    </p>
                </div>
                <div className="flex flex-col items-end space-y-1 ml-2">
                    {chat.latestMessage?.createdAt && (
                        <span className={`text-xs
                            ${activeChat?._id === chat._id 
                                ? 'text-gray-400' 
                                : 'text-gray-500 group-hover:text-gray-400'}`}
                        >
                            {getMessageDateTime(chat.latestMessage.createdAt)}
                        </span>
                    )}
                </div>
            </div>
        );
    }, [activeChat?._id, getChatDisplayName, getChatInitial, getMessageDateTime, setActiveChat]);

    if (isLoading) {
        return <div className="h-full flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="h-full flex items-center justify-center text-red-500">Error loading chats</div>;
    }

    return (
        <>
            <div className="h-full flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm bg-gray-100 border border-gray-200 rounded-lg 
                            text-gray-900 placeholder:text-gray-500 
                            focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                            transition-all duration-200"
                        placeholder="Search chats..."
                    />
                    <button
                        onClick={onNewChat}
                        className="p-2 rounded-lg bg-black text-white transition-all duration-200 transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
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
                
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onLogoutClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 
                            text-white bg-black rounded-lg
                            transition-all duration-200 transform hover:scale-105"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};
