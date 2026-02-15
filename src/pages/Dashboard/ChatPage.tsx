import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  clearChatError,
  fetchMessages,
  fetchMyChannels,
  markChannelRead,
  sendChatMessage,
  setActiveChannel,
  softDeleteMessage,
} from '@/app/slices/chatSlice';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import type { ChatMessage } from '@/services/chatService';

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('hy-AM', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('hy-AM', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChannelPreview(message: ChatMessage | null): string {
  if (!message) {
    return '—';
  }

  if (message.is_deleted) {
    return 'Հաղորդագրությունը ջնջվել է։';
  }

  return message.body ?? '—';
}

function canDeleteMessage(
  message: ChatMessage,
  currentUserId: number | undefined,
  currentRole: 'student' | 'teacher' | 'director' | 'admin' | undefined
): boolean {
  if (message.is_deleted) {
    return false;
  }

  if (message.sender_user_id === currentUserId) {
    return true;
  }

  return currentRole === 'director' || currentRole === 'admin';
}

export default function ChatPage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { channels, activeChannelId, messagesByChannelId, isLoadingChannels, isLoadingMessages, error } =
    useAppSelector((state) => state.chat);

  const [composer, setComposer] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  const activeMessages =
    activeChannelId !== null ? (messagesByChannelId[activeChannelId] ?? []) : [];

  const newestMessageId = activeMessages[activeMessages.length - 1]?.id;
  const oldestMessageId = activeMessages[0]?.id;

  useEffect(() => {
    dispatch(fetchMyChannels())
      .unwrap()
      .catch((requestError) => {
        setPageError(getApiErrorMessage(requestError, 'Չհաջողվեց բեռնել ալիքները'));
      });

    return () => {
      dispatch(clearChatError());
    };
  }, [dispatch]);

  useEffect(() => {
    const channelPollId = window.setInterval(() => {
      dispatch(fetchMyChannels());
    }, 5000);

    return () => {
      window.clearInterval(channelPollId);
    };
  }, [dispatch]);

  useEffect(() => {
    const firstChannelId = channels[0]?.id ?? null;

    if (channels.length === 0) {
      if (activeChannelId !== null) {
        dispatch(setActiveChannel(null));
      }
      return;
    }

    if (activeChannelId === null && firstChannelId !== null) {
      dispatch(setActiveChannel(firstChannelId));
      return;
    }

    const exists = channels.some((channel) => channel.id === activeChannelId);
    if (!exists && firstChannelId !== null) {
      dispatch(setActiveChannel(firstChannelId));
    }
  }, [channels, activeChannelId, dispatch]);

  useEffect(() => {
    if (activeChannelId === null) {
      return;
    }

    const fetchInitialMessages = async () => {
      try {
        const result = await dispatch(fetchMessages({ channelId: activeChannelId, limit: 50 })).unwrap();
        const lastMessage = result.messages[result.messages.length - 1];
        await dispatch(
          markChannelRead({ channelId: activeChannelId, messageId: lastMessage?.id })
        ).unwrap();
      } catch (requestError) {
        setPageError(getApiErrorMessage(requestError, 'Չհաջողվեց բեռնել հաղորդագրությունները'));
      }
    };

    void fetchInitialMessages();
  }, [dispatch, activeChannelId]);

  useEffect(() => {
    if (activeChannelId === null) {
      return;
    }

    const messagesPollId = window.setInterval(() => {
      const syncMessages = async () => {
        try {
          const result = await dispatch(
            fetchMessages({
              channelId: activeChannelId,
              afterId: newestMessageId,
              limit: 50,
            })
          ).unwrap();

          if (result.messages.length > 0) {
            const latestMessage = result.messages[result.messages.length - 1];
            if (latestMessage) {
              await dispatch(
                markChannelRead({ channelId: activeChannelId, messageId: latestMessage.id })
              ).unwrap();
            }
          }
        } catch {
          // Ignore polling errors; next interval will retry.
        }
      };

      void syncMessages();
    }, 4000);

    return () => {
      window.clearInterval(messagesPollId);
    };
  }, [dispatch, activeChannelId, newestMessageId]);

  useEffect(() => {
    if (error) {
      setPageError(error);
    }
  }, [error]);

  const handleSelectChannel = (channelId: number) => {
    setPageError(null);
    dispatch(setActiveChannel(channelId));
  };

  const handleLoadOlder = async () => {
    if (activeChannelId === null || !oldestMessageId) {
      return;
    }

    setIsLoadingOlder(true);
    setPageError(null);

    try {
      await dispatch(
        fetchMessages({ channelId: activeChannelId, beforeId: oldestMessageId, limit: 50 })
      ).unwrap();
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError, 'Չհաջողվեց բեռնել հին հաղորդագրությունները'));
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeChannelId === null || isSending) {
      return;
    }

    const body = composer.trim();
    if (!body) {
      return;
    }

    setIsSending(true);
    setPageError(null);

    try {
      const result = await dispatch(sendChatMessage({ channelId: activeChannelId, body })).unwrap();
      setComposer('');
      await dispatch(
        markChannelRead({ channelId: activeChannelId, messageId: result.message.id })
      ).unwrap();
      await dispatch(fetchMyChannels()).unwrap();
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError, 'Չհաջողվեց ուղարկել հաղորդագրությունը'));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (activeChannelId === null) {
      return;
    }

    setDeletingMessageId(messageId);
    setPageError(null);

    try {
      await dispatch(softDeleteMessage({ messageId, channelId: activeChannelId })).unwrap();
      await dispatch(fetchMyChannels()).unwrap();
    } catch (requestError) {
      setPageError(getApiErrorMessage(requestError, 'Չհաջողվեց ջնջել հաղորդագրությունը'));
    } finally {
      setDeletingMessageId(null);
    }
  };

  const showNoClassState =
    user?.role === 'student' && channels.length === 0 && !isLoadingChannels;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-xl border border-gray-200 bg-white shadow-soft">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">Չատ</h2>
        </div>

        {showNoClassState ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            Դուք դեռ դասարանին կցված չեք։
          </div>
        ) : channels.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">Չատի ալիքներ չկան։</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {channels.map((channel) => {
              const isActive = channel.id === activeChannelId;
              return (
                <button
                  key={channel.id}
                  type="button"
                  className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectChannel(channel.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{channel.title}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {getChannelPreview(channel.last_message)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-gray-400">
                        {formatDateTime(channel.last_message_at)}
                      </span>
                      {channel.unread_count > 0 && (
                        <span className="rounded-full bg-blue-main px-2 py-0.5 text-[11px] font-semibold text-white">
                          {channel.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex min-h-[70vh] flex-col rounded-xl border border-gray-200 bg-white shadow-soft">
        {activeChannel ? (
          <>
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-base font-semibold text-gray-900">{activeChannel.title}</h3>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {pageError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {pageError}
                </div>
              )}

              {activeMessages.length > 0 && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadOlder}
                    disabled={isLoadingOlder}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingOlder ? 'Բեռնվում է...' : 'Load older'}
                  </button>
                </div>
              )}

              {activeMessages.length === 0 && !isLoadingMessages ? (
                <p className="py-12 text-center text-sm text-gray-500">Դեռ հաղորդագրություններ չկան։</p>
              ) : (
                activeMessages.map((message) => {
                  const isOwn = message.sender_user_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                          isOwn
                            ? 'bg-blue-main text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {!isOwn && message.sender && (
                          <p className="mb-1 text-xs font-semibold text-gray-500">
                            {message.sender.first_name} {message.sender.last_name}
                          </p>
                        )}

                        {message.is_deleted ? (
                          <p className="text-sm italic">Հաղորդագրությունը ջնջվել է։</p>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                        )}

                        <div className="mt-1 flex items-center justify-end gap-2">
                          <span className={`text-[11px] ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTime(message.created_at)}
                          </span>
                          {canDeleteMessage(message, user?.id, user?.role) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={deletingMessageId === message.id}
                              className={`text-[11px] font-semibold ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              } hover:opacity-80 disabled:opacity-50`}
                            >
                              {deletingMessageId === message.id ? '...' : 'Ջնջել'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-gray-100 p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Գրեք հաղորդագրություն..."
                  className="min-h-[52px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-main focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSending || composer.trim().length === 0}
                  className="rounded-lg bg-blue-main px-4 py-2 text-sm font-semibold text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? '...' : 'Ուղարկել'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-gray-500">
            Ընտրեք ալիք՝ զրույցը սկսելու համար։
          </div>
        )}
      </section>
    </div>
  );
}
