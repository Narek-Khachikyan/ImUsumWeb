import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getApiErrorMessage } from '@/services/api';
import {
  chatService,
  type ChatChannelListItem,
  type ChatMessage,
  type ChatReadMarker,
} from '@/services/chatService';

type FetchMessagesArgs = {
  channelId: number;
  beforeId?: number;
  afterId?: number;
  limit?: number;
};

interface ChatState {
  channels: ChatChannelListItem[];
  activeChannelId: number | null;
  messagesByChannelId: Record<number, ChatMessage[]>;
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

const initialState: ChatState = {
  channels: [],
  activeChannelId: null,
  messagesByChannelId: {},
  isLoadingChannels: false,
  isLoadingMessages: false,
  error: null,
};

function dedupeMessages(messages: ChatMessage[]): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const message of messages) {
    byId.set(message.id, message);
  }
  return Array.from(byId.values()).sort((left, right) => left.id - right.id);
}

function patchChannelPreview(
  channels: ChatChannelListItem[],
  channelId: number,
  message: ChatMessage,
  unreadCount?: number
): ChatChannelListItem[] {
  return channels.map((channel) => {
    if (channel.id !== channelId) {
      return channel;
    }
    return {
      ...channel,
      last_message_id: message.id,
      last_message_at: message.created_at,
      last_message: message,
      ...(typeof unreadCount === 'number' ? { unread_count: unreadCount } : {}),
    };
  });
}

export const fetchMyChannels = createAsyncThunk('chat/fetchMyChannels', async (_, { rejectWithValue }) => {
  try {
    return await chatService.getMyChannels();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch channels'));
  }
});

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ channelId, beforeId, afterId, limit }: FetchMessagesArgs, { rejectWithValue }) => {
    try {
      const messages = await chatService.getMessages(channelId, { beforeId, afterId, limit });
      return { channelId, beforeId, afterId, messages };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch messages'));
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ channelId, body }: { channelId: number; body: string }, { rejectWithValue }) => {
    try {
      const message = await chatService.sendMessage(channelId, body);
      return { channelId, message };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to send message'));
    }
  }
);

export const markChannelRead = createAsyncThunk(
  'chat/markRead',
  async ({ channelId, messageId }: { channelId: number; messageId?: number }, { rejectWithValue }) => {
    try {
      const marker = await chatService.markRead(channelId, messageId);
      return marker;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to mark channel as read'));
    }
  }
);

export const softDeleteMessage = createAsyncThunk(
  'chat/softDeleteMessage',
  async ({ messageId, channelId }: { messageId: number; channelId: number }, { rejectWithValue }) => {
    try {
      await chatService.deleteMessage(messageId);
      return {
        messageId,
        channelId,
        deletedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to delete message'));
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<number | null>) => {
      state.activeChannelId = action.payload;
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChannels.pending, (state) => {
        state.isLoadingChannels = true;
        state.error = null;
      })
      .addCase(fetchMyChannels.fulfilled, (state, action) => {
        state.isLoadingChannels = false;
        state.channels = action.payload;

        if (state.activeChannelId !== null) {
          const stillExists = action.payload.some((channel) => channel.id === state.activeChannelId);
          if (!stillExists) {
            state.activeChannelId = action.payload[0]?.id ?? null;
          }
        }
      })
      .addCase(fetchMyChannels.rejected, (state, action) => {
        state.isLoadingChannels = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;

        const { channelId, beforeId, afterId, messages } = action.payload;
        const existing = state.messagesByChannelId[channelId] ?? [];

        if (afterId !== undefined) {
          state.messagesByChannelId[channelId] = dedupeMessages([...existing, ...messages]);
        } else if (beforeId !== undefined) {
          state.messagesByChannelId[channelId] = dedupeMessages([...messages, ...existing]);
        } else {
          state.messagesByChannelId[channelId] = dedupeMessages(messages);
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const { channelId, message } = action.payload;
        const existing = state.messagesByChannelId[channelId] ?? [];
        state.messagesByChannelId[channelId] = dedupeMessages([...existing, message]);
        state.channels = patchChannelPreview(state.channels, channelId, message, 0);
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(markChannelRead.fulfilled, (state, action: PayloadAction<ChatReadMarker>) => {
        state.channels = state.channels.map((channel) =>
          channel.id === action.payload.channel_id
            ? { ...channel, unread_count: 0 }
            : channel
        );
      })
      .addCase(markChannelRead.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(softDeleteMessage.fulfilled, (state, action) => {
        const { channelId, messageId, deletedAt } = action.payload;
        const messages = state.messagesByChannelId[channelId] ?? [];
        state.messagesByChannelId[channelId] = messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                body: null,
                deleted_at: deletedAt,
                is_deleted: true,
              }
            : message
        );

        state.channels = state.channels.map((channel) => {
          if (channel.id !== channelId || channel.last_message?.id !== messageId) {
            return channel;
          }
          return {
            ...channel,
            last_message: {
              ...channel.last_message,
              body: null,
              deleted_at: deletedAt,
              is_deleted: true,
            },
          };
        });
      })
      .addCase(softDeleteMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setActiveChannel, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
