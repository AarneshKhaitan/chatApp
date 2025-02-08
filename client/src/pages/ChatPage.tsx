import { ChatLayout } from '../components/chat/ChatLayout';
import { ChatList } from '../components/chat/ChatList';
import { ChatBox } from '../components/chat/ChatBox';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageInput } from '../components/chat/MessageInput';
import { useChats, useMessages } from '../hooks/useChat';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

// export const ChatPage = () => {
//   const { activeChat } = useChatStore();
//   const { isLoading: isLoadingChats } = useChats();
//   const { data: messages, isLoading: isLoadingMessages } = useMessages(activeChat?._id);
//   const { user } = useAuthStore();

//   const currentUserId = user?._id || '';

//   if (isLoadingChats) {
//     return (
//       <div className="h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   return (
//     <ChatLayout
//       sidebar={<ChatList />}
//       main={
//         activeChat ? (
//           <div className="flex flex-col h-full w-full">
//             <ChatHeader chat={activeChat} />
//             {isLoadingMessages ? (
//               <div className="flex-1 flex items-center justify-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
//               </div>
//             ) : (
//               <ChatBox messages={messages || []} currentUserId={currentUserId} />
//             )}
//             <MessageInput chatId={activeChat._id} />
//           </div>
//         ) : (
//           <div className="h-full w-full flex items-center justify-center">
//             <p className="text-gray-500">Select a chat to start messaging</p>
//           </div>
//         )
//       }
//     />
//   );
// };
// ChatLayout.tsx


// Optionally, ensure ChatPage main content fills the space
export const ChatPage = () => {
  const { activeChat } = useChatStore();
  const { isLoading: isLoadingChats } = useChats();
  const { data: messages, isLoading: isLoadingMessages } = useMessages(activeChat?._id);
  const { user } = useAuthStore();

  const currentUserId = user?._id || '';

  if (isLoadingChats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ChatLayout
      sidebar={<ChatList />}
      main={
        activeChat ? (
          <div className="flex flex-col h-full w-full">
            <ChatHeader chat={activeChat} />
            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <ChatBox messages={messages || []} currentUserId={currentUserId} />
            )}
            <MessageInput chatId={activeChat._id} />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-gray-500">Select a chat to start messaging</p>
          </div>
        )
      }
    />
  );
};