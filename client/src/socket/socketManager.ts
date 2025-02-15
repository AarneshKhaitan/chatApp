import { io, Socket } from 'socket.io-client';
import { Message } from '../types/chat';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected with id:', this.socket?.id);
      this.emit('socketConnected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('socketConnected', false);
    });

    this.socket.on('message received', (message: Message) => {
      console.log('Socket received message from server:', message);
      if (!message?._id || !message?.content) {
        console.error('Invalid message received:', message);
        return;
      }
      this.emit('messageReceived', message);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('message error', (error: any) => {
      console.error('Socket message error:', error);
    });

    this.socket.on('typing', (data: { chatId: string; userId: string; userName: string }) => {
      this.emit('userTyping', data);
    });

    this.socket.on('stop typing', (data: { chatId: string; userId: string }) => {
      this.emit('userStoppedTyping', data);
    });

    this.socket.on('user online', (data: { userId: string; isOnline: boolean }) => {
      this.emit('userOnlineStatus', data);
    });

    this.socket.on('user offline', (userId: string) => {
      this.emit('userOnlineStatus', { userId, isOnline: false });
    });
  }

  joinChat(chatId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('join chat', chatId);
  }

  sendMessage(chatId: string, content: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send message');
      return;
    }
    if (!chatId || !content) {
      console.error('Invalid message data:', { chatId, content });
      return;
    }
    console.log('Sending message via socket:', { chatId, content, socketId: this.socket.id });
    this.socket.emit('new message', { chatId, content });
  }

  emitTyping(chatId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', chatId);
  }

  emitStopTyping(chatId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('stop typing', chatId);
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketManager = SocketManager.getInstance();
