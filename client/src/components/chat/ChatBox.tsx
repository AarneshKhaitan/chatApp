import { Message } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatBoxProps {
  messages: Message[];
  currentUserId: string;
}

export const ChatBox = ({ messages, currentUserId }: ChatBoxProps) => {
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
            <div className="px-4 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
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
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium mr-2 flex-shrink-0">
                    {message.sender.name.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-[60%] rounded-lg px-4 py-2 ${
                    isCurrentUser 
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      {message.sender.name}
                    </p>
                  )}
                  <div className="break-words">
                    <p className={`text-sm ${
                        isCurrentUser ? 'text-white' : 'text-gray-900'
                      }`}>{message.content}</p>
                    <p 
                      className={`text-xs mt-1 text-right ${
                        isCurrentUser ? 'text-white/80' : 'text-gray-500'
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
    </div>
  );
};
