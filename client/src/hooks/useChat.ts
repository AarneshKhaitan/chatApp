import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { Chat, Message } from '../types/chat';
import { useChatStore } from '../store/chatStore';

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getChats,
    staleTime: 30000,
    refetchInterval: 30000,
    select: (data: Chat[]) => {
      const sortedChats = [...data].sort((a, b) => {
        const aTime = new Date(a.latestMessage?.createdAt || 0).getTime();
        const bTime = new Date(b.latestMessage?.createdAt || 0).getTime();
        return bTime - aTime;
      });
      
      const store = useChatStore.getState();
      store.setChats(sortedChats);
      return sortedChats;
    }
  });
};

export const useMessages = (chatId: string | undefined) => {
  const { setMessages } = useChatStore();

  return useQuery<Message[], Error>({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const messages = await chatApi.getMessages(chatId);
      setMessages(messages);
      return messages;
    },
    enabled: !!chatId,
    staleTime: 0, // Always fetch fresh messages when chat changes
    gcTime: 300000,
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

interface SendMessageResponse {
  data: Message;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<SendMessageResponse, Error, { content: string; chatId: string }>({
    mutationFn: async (message) => {
      const response = await chatApi.sendMessage(message);
      return { data: response };
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData(
        ['messages', variables.chatId],
        (oldData: Message[] = []) => {
          return [...oldData, response.data];
        }
      );
    },
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.createChat,
    onSuccess: (newChat) => {
      queryClient.setQueryData<Chat[]>(['chats'], (old = []) => [newChat, ...old]);
    },
  });
};

export const useSearchUsers = () => {
  return useMutation({
    mutationFn: chatApi.searchUsers,
  });
};

export const useGroupChat = () => {
  const queryClient = useQueryClient();

  return {
    addToGroup: useMutation({
      mutationFn: ({ chatId, userIds }: { chatId: string; userIds: string | string[] }) =>
        chatApi.addToGroup(chatId, userIds),
      onSuccess: (updatedChat) => {
        queryClient.setQueryData<Chat[]>(['chats'], (old = []) =>
          old.map((chat) => (chat._id === updatedChat._id ? updatedChat : chat))
        );
      },
    }),

    removeFromGroup: useMutation({
      mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) =>
        chatApi.removeFromGroup(chatId, userId),
      onSuccess: (updatedChat) => {
        queryClient.setQueryData<Chat[]>(['chats'], (old = []) =>
          old.map((chat) => (chat._id === updatedChat._id ? updatedChat : chat))
        );
      },
    }),

    updateGroupName: useMutation({
      mutationFn: ({ chatId, chatName }: { chatId: string; chatName: string }) =>
        chatApi.updateGroupName(chatId, chatName),
      onSuccess: (updatedChat) => {
        queryClient.setQueryData<Chat[]>(['chats'], (old = []) =>
          old.map((chat) => (chat._id === updatedChat._id ? updatedChat : chat))
        );
      },
    }),

    leaveGroup: useMutation({
      mutationFn: (chatId: string) => chatApi.leaveGroup(chatId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      },
    }),
  };
};