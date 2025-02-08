import { useChatStore } from '../../store/chatStore';
import { Chat } from '../../types/chat';
import { format, isToday } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useChats } from '../../hooks/useChat';
import { useState } from 'react';
import { NewChatButton } from './NewChatButton';

export const ChatList = () => {
    const { activeChat, setActiveChat } = useChatStore();
    const { user } = useAuthStore();
    const { data: chats, isLoading, error } = useChats();
    const [searchQuery, setSearchQuery] = useState('');

    const getUnreadCount = (chat: Chat) => {
        const currentUser = user?._id || ''; 
        const unreadCount = chat.unreadCounts.find(uc => uc.user._id === currentUser);
        return unreadCount?.count || 0;
    };

    const getOtherUser = (chat: Chat) => {
        if (!user || !chat.users) {
            console.log('No user or chat users');
            return null;
        }
        
        // Debug logs
        console.log('Current user ID:', user._id);
        console.log('Current user:', user);
        console.log('Chat users:', chat.users);
        
        // Try both _id and id fields
        const otherUser = chat.users.find(u => u._id !== user._id && u._id !== user._id);
        console.log('Found other user:', otherUser);
        
        return otherUser || null;
    };

    const getChatDisplayName = (chat: Chat): string => {
        if (!chat) return 'Unknown';
        if (chat.isGroupChat) return chat.chatName || 'Unnamed Group';
        const otherUser = getOtherUser(chat);
        console.log('Other user:', otherUser);
        return otherUser?.name || 'Unknown User';
    };

    const getChatInitial = (chat: Chat): string => {
        const displayName = getChatDisplayName(chat);
        return displayName ? displayName.charAt(0).toUpperCase() : '?';
    };

    const filterChats = (chats: Chat[] | undefined): Chat[] => {
        if (!chats) return [];
        if (!searchQuery.trim()) return chats;

        return chats.filter(chat => {
            const displayName = getChatDisplayName(chat).toLowerCase();
            const lastMessage = chat.latestMessage?.content?.toLowerCase() || '';
            const searchTerm = searchQuery.toLowerCase();

            return displayName.includes(searchTerm) || lastMessage.includes(searchTerm);
        });
    };

    const getMessageDateTime = (date: Date | string) => {
        const messageDate = new Date(date);
        if (isToday(messageDate)) {
            return format(messageDate, 'HH:mm');
        }
        return format(messageDate, 'MMM d');
    };

    if (isLoading) {
        return <div className="h-full flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="h-full flex items-center justify-center text-red-500">Error loading chats</div>;
    }

    const filteredChats = filterChats(chats);

    return (
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
                {!filteredChats.length ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        {searchQuery ? 'No matching chats found' : 'No chats found'}
                    </div>
                ) : (
                    filteredChats.map((chat) => chat && (
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
                                <p className="text-xs text-gray-500 truncate">
                                    {chat.latestMessage?.content || 'No messages yet'}
                                </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                <span className="text-xs text-gray-500">
                                    {chat.latestMessage && 
                                    getMessageDateTime(chat.latestMessage.createdAt)}
                                </span>
                                {getUnreadCount(chat) > 0 && (
                                    <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
                                        {getUnreadCount(chat)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
