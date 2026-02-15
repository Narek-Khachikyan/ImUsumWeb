import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPage from '@/pages/Dashboard/ChatPage';
import type { ChatChannelListItem, ChatMessage } from '@/services/chatService';

const mockUseAuth = vi.fn();
const mockDispatch = vi.fn();

const mockFetchMyChannels = vi.fn(() => ({ type: 'fetchMyChannels' }));
const mockFetchMessages = vi.fn((payload: unknown) => ({ type: 'fetchMessages', payload }));
const mockMarkChannelRead = vi.fn((payload: unknown) => ({ type: 'markChannelRead', payload }));
const mockSendChatMessage = vi.fn((payload: unknown) => ({ type: 'sendChatMessage', payload }));
const mockSetActiveChannel = vi.fn((payload: unknown) => ({ type: 'setActiveChannel', payload }));
const mockSoftDeleteMessage = vi.fn((payload: unknown) => ({ type: 'softDeleteMessage', payload }));
const mockClearChatError = vi.fn(() => ({ type: 'clearChatError' }));

let mockState: {
  chat: {
    channels: ChatChannelListItem[];
    activeChannelId: number | null;
    messagesByChannelId: Record<number, ChatMessage[]>;
    isLoadingChannels: boolean;
    isLoadingMessages: boolean;
    error: string | null;
  };
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

vi.mock('@/app/slices/chatSlice', () => ({
  fetchMyChannels: () => mockFetchMyChannels(),
  fetchMessages: (payload: unknown) => mockFetchMessages(payload),
  markChannelRead: (payload: unknown) => mockMarkChannelRead(payload),
  sendChatMessage: (payload: unknown) => mockSendChatMessage(payload),
  setActiveChannel: (payload: unknown) => mockSetActiveChannel(payload),
  softDeleteMessage: (payload: unknown) => mockSoftDeleteMessage(payload),
  clearChatError: () => mockClearChatError(),
}));

function buildMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    channel_id: 10,
    sender_user_id: 5,
    body: 'Բարև',
    created_at: '2026-02-09T12:00:00.000Z',
    edited_at: null,
    deleted_at: null,
    is_deleted: false,
    sender: {
      id: 5,
      first_name: 'Ani',
      last_name: 'Petrosyan',
      role: 'student',
      avatar_url: null,
    },
    ...overrides,
  };
}

function buildChannel(overrides: Partial<ChatChannelListItem> = {}): ChatChannelListItem {
  return {
    id: 10,
    key: 'class:10',
    type: 'class',
    school_id: 1,
    class_id: 10,
    title: 'Դասարան 10-A',
    last_message_id: null,
    last_message_at: null,
    unread_count: 0,
    last_message: null,
    ...overrides,
  };
}

function setChatState(overrides: Partial<typeof mockState.chat> = {}) {
  mockState = {
    chat: {
      channels: [],
      activeChannelId: null,
      messagesByChannelId: {},
      isLoadingChannels: false,
      isLoadingMessages: false,
      error: null,
      ...overrides,
    },
  };
}

describe('ChatPage', () => {
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setIntervalSpy = vi
      .spyOn(window, 'setInterval')
      .mockImplementation(() => 1 as unknown as ReturnType<typeof window.setInterval>);
    clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => undefined);

    setChatState();
    mockUseAuth.mockReturnValue({ user: { id: 5, role: 'student' } });
    mockSetActiveChannel.mockImplementation((payload: unknown) => {
      mockState.chat.activeChannelId = (payload as number | null) ?? null;
      return { type: 'setActiveChannel', payload };
    });

    mockDispatch.mockImplementation((action: { type: string; payload?: any }) => {
      switch (action.type) {
        case 'fetchMyChannels':
          return { unwrap: () => Promise.resolve(mockState.chat.channels) };
        case 'fetchMessages':
          return {
            unwrap: () =>
              Promise.resolve({
                channelId: action.payload.channelId,
                beforeId: action.payload.beforeId,
                afterId: action.payload.afterId,
                messages: mockState.chat.messagesByChannelId[action.payload.channelId] ?? [],
              }),
          };
        case 'sendChatMessage':
          return {
            unwrap: () =>
              Promise.resolve({
                channelId: action.payload.channelId,
                message: buildMessage({
                  id: 99,
                  channel_id: action.payload.channelId,
                  sender_user_id: 5,
                  body: action.payload.body,
                }),
              }),
          };
        default:
          return { unwrap: () => Promise.resolve(action.payload) };
      }
    });
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('renders channel list with unread badge', async () => {
    setChatState({
      channels: [
        buildChannel({
          unread_count: 3,
          last_message: buildMessage(),
          last_message_id: 1,
          last_message_at: '2026-02-09T12:00:00.000Z',
        }),
      ],
      activeChannelId: 10,
    });

    render(<ChatPage />);

    expect(screen.getAllByText('Դասարան 10-A').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Բարև')).toBeInTheDocument();
  });

  it('selecting channel dispatches setActiveChannel and fetchMessages', async () => {
    setChatState({
      channels: [buildChannel({ id: 10, title: 'Դասարան 10-A' }), buildChannel({ id: 11, key: 'class:11', class_id: 11, title: 'Դասարան 10-B' })],
      activeChannelId: 10,
    });

    const user = userEvent.setup();
    const { rerender } = render(<ChatPage />);

    await user.click(screen.getByRole('button', { name: /Դասարան 10-B/i }));
    rerender(<ChatPage />);

    expect(mockSetActiveChannel).toHaveBeenCalledWith(11);

    await waitFor(() => {
      expect(
        mockFetchMessages.mock.calls.some(
          (call) => (call[0] as { channelId?: number } | undefined)?.channelId === 11
        )
      ).toBe(true);
    });
  });

  it('sending message dispatches sendChatMessage', async () => {
    setChatState({
      channels: [buildChannel()],
      activeChannelId: 10,
      messagesByChannelId: { 10: [] },
    });

    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(screen.getByPlaceholderText('Գրեք հաղորդագրություն...'), 'Բարև աշխարհ');
    await user.click(screen.getByRole('button', { name: 'Ուղարկել' }));

    expect(mockSendChatMessage).toHaveBeenCalledWith({
      channelId: 10,
      body: 'Բարև աշխարհ',
    });
  });

  it('renders deleted message placeholder', () => {
    setChatState({
      channels: [buildChannel()],
      activeChannelId: 10,
      messagesByChannelId: {
        10: [
          buildMessage({
            id: 2,
            is_deleted: true,
            body: null,
            deleted_at: '2026-02-09T12:30:00.000Z',
          }),
        ],
      },
    });

    render(<ChatPage />);

    expect(screen.getByText('Հաղորդագրությունը ջնջվել է։')).toBeInTheDocument();
  });
});
