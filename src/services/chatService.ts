import api from './api';
import type { UserRole } from '@/types';

export interface ChatSender {
  id: number;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: number;
  channel_id: number;
  sender_user_id: number;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_deleted: boolean;
  sender: ChatSender | null;
}

export interface ChatChannelListItem {
  id: number;
  key: string;
  type: 'class' | 'staff';
  school_id: number;
  class_id: number | null;
  title: string;
  last_message_id: number | null;
  last_message_at: string | null;
  unread_count: number;
  last_message: ChatMessage | null;
}

export interface ChatReadMarker {
  channel_id: number;
  last_read_message_id: number | null;
}

export const chatService = {
  async getMyChannels(): Promise<ChatChannelListItem[]> {
    const response = await api.get<ChatChannelListItem[]>('/chat/channels/my');
    return response.data;
  },

  async getMessages(
    channelId: number,
    params?: { beforeId?: number; afterId?: number; limit?: number }
  ): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chat/channels/${channelId}/messages`, {
      params: {
        ...(params?.beforeId !== undefined ? { before_id: params.beforeId } : {}),
        ...(params?.afterId !== undefined ? { after_id: params.afterId } : {}),
        ...(params?.limit !== undefined ? { limit: params.limit } : {}),
      },
    });
    return response.data;
  },

  async sendMessage(channelId: number, body: string): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(`/chat/channels/${channelId}/messages`, { body });
    return response.data;
  },

  async markRead(channelId: number, messageId?: number): Promise<ChatReadMarker> {
    const response = await api.post<ChatReadMarker>(`/chat/channels/${channelId}/read`, {
      ...(messageId !== undefined ? { message_id: messageId } : {}),
    });
    return response.data;
  },

  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/chat/messages/${messageId}`);
  },
};

export default chatService;
