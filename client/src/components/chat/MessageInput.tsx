import { Send } from 'lucide-react';
import { useState } from 'react';
import { useSendMessage } from '../../hooks/useChat';

interface MessageInputProps {
  chatId: string;
}

export const MessageInput = ({ chatId }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSend = () => {
    if (!message.trim() || isPending) return;
    
    sendMessage({
      content: message.trim(),
      chatId,
    }, {
      onSuccess: () => {
        setMessage('');
      },
    });
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
