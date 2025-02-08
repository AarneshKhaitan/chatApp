import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { Chat, Message } from '../types/chat';

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getChats,
  });
};

export const useMessages = (chatId: string | undefined) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => (chatId ? chatApi.getMessages(chatId) : Promise.resolve([])),
    enabled: !!chatId,
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
      return { data: response }; // Wrap the Message in a data property
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
  };
};