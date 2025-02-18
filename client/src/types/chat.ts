import {User} from './user';

export interface Message {
    _id: string;
    sender: User;
    content: string;
    chat: Chat;
    readBy: Array<{
      user: User;
      readAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
  
export interface UnreadCount {
    user: User;
    count: number;
}
  
export interface Chat {
    _id: string;
    chatName: string;
    isGroupChat: boolean;
    users: User[];
    latestMessage?: Message;
    admins: User[];
    unreadCounts: UnreadCount[];
    createdAt: Date;
    updatedAt: Date;
}