import { useEffect, useRef, useState } from 'react';
import { Message } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { socketManager } from '../../socket/socketManager';

interface ChatBoxProps {
  messages: Message[];
  currentUserId: string;
  chatId: string;
}

export const ChatBox = ({ messages, currentUserId, chatId }: ChatBoxProps) => {
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add scroll to bottom effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleTyping = ({ chatId: typingChatId, userId, userName }: any) => {
      if (typingChatId === chatId && userId !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [userId]: userName }));
      }
    };

    const handleStopTyping = ({ chatId: typingChatId, userId }: any) => {
      if (typingChatId === chatId) {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }
    };

    socketManager.on('userTyping', handleTyping);
    socketManager.on('userStoppedTyping', handleStopTyping);

    return () => {
      socketManager.off('userTyping', handleTyping);
      socketManager.off('userStoppedTyping', handleStopTyping);
    };
  }, [chatId, currentUserId]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const messagesByDate: { [key: string]: Message[] } = messages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [key: string]: Message[] });

  return (
    <div className="flex-1 w-full p-4 space-y-4 overflow-y-auto bg-white">
      {Object.entries(messagesByDate).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="px-4 py-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full">
              {getDateLabel(new Date(date))}
            </div>
          </div>
          {dateMessages.map((message) => {
            const isCurrentUser = message.sender._id === currentUserId;
            
            return (
              <div
                key={message._id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-900 mr-2 flex-shrink-0">
                    {message.sender.name.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-[60%] rounded-lg px-4 py-2 ${
                    isCurrentUser 
                      ? 'bg-black text-white'
                      : 'bg-gray-100 border border-gray-200 text-gray-900'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs text-gray-900 font-medium mb-1">
                      {message.sender.name}
                    </p>
                  )}
                  <div className="break-words">
                    <p className="text-sm">{message.content}</p>
                    <p 
                      className={`text-xs mt-1 text-right ${
                        isCurrentUser ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {Object.values(typingUsers).length > 0 && (
        <div className="text-sm text-gray-500 italic">
          {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
