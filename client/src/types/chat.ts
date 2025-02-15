import {User} from './user';

export interface Message {
    _id: string;
    sender: User;
    content: string;
    chat: Chat;
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
    admins: User[];
    latestMessage?: Message;
    createdAt: Date;
    updatedAt: Date;
}