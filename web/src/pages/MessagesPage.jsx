import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import {
  MessageSquare,
  Search,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  User,
  Layers,
  ArrowLeft,
  Clock,
  Radio,
  X,
  ExternalLink,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    loadConversations,
    isLoadingConversations,
    messages,
    loadMessages,
    leaveChat,
    sendMessage,
    sendTyping,
    typingUsers,
    bindChatEvents,
  } = useChatStore();

  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('taskId');

  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadConversations();
    bindChatEvents();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      if (initialTaskId) {
        const found = conversations.find((c) => c.taskId?.toString() === initialTaskId.toString());
        if (found) setSelectedTask(found);
        else setSelectedTask(conversations[0]);
      } else if (!selectedTask) {
        setSelectedTask(conversations[0]);
      }
    }
  }, [conversations, initialTaskId]);

  useEffect(() => {
    if (selectedTask?.taskId) {
      loadMessages(selectedTask.taskId);
    }
    return () => {
      if (selectedTask?.taskId) leaveChat(selectedTask.taskId);
    };
  }, [selectedTask?.taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.taskTitle?.toLowerCase().includes(q) ||
      c.participant?.name?.toLowerCase().includes(q) ||
      c.taskCategory?.toLowerCase().includes(q)
    );
  });

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    if (selectedTask?.taskId) {
      sendTyping(selectedTask.taskId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(selectedTask.taskId, false);
      }, 1500);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTask?.taskId) return;
    if (!inputContent.trim() && !selectedFile) return;

    setSending(true);
    sendTyping(selectedTask.taskId, false);
    const text = inputContent.trim();
    const file = selectedFile;
    setInputContent('');
    setSelectedFile(null);

    await sendMessage(selectedTask.taskId, text, file);
    setSending(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      <div className="flex-1 rounded-3xl glass border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left Column: Conversations List (4 cols) */}
        <div
          className={`md:col-span-4 border-r border-slate-800 flex flex-col h-full bg-slate-950/70 ${
            selectedTask ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-brand-400" />
                <h2 className="text-base font-bold text-white">Chat Sessions</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-[11px] font-bold text-brand-300">
                {conversations.length} Active
              </span>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats by task or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {isLoadingConversations && conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Loading your chat sessions...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">No active chat sessions</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Post a task or make an offer on a request to start coordinating!
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedTask?.taskId?.toString() === conv.taskId?.toString();
                return (
                  <button
                    key={conv.taskId}
                    onClick={() => setSelectedTask(conv)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-brand-600/20 border border-brand-500/40 shadow-sm'
                        : 'hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          conv.participant?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                        }
                        alt={conv.participant?.name || 'User'}
                        className="w-11 h-11 rounded-full object-cover border border-slate-700"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {conv.participant?.name || 'Participant'}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold text-brand-300 truncate mb-0.5">
                        📋 {conv.taskTitle}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 truncate flex-1 pr-2">
                          {conv.lastMessage?.content || 'Started chat session'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window (8 cols) */}
        <div
          className={`md:col-span-8 flex flex-col h-full bg-slate-900/40 min-h-0 ${
            selectedTask ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedTask ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={
                      selectedTask.participant?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                    }
                    alt={selectedTask.participant?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-brand-500/40"
                  />

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white leading-none">
                        {selectedTask.participant?.name || 'Task Chat'}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                        {selectedTask.isCustomer ? 'Your Helper' : 'Customer'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-400 font-medium truncate mt-0.5">
                      Task: {selectedTask.taskTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/task/${selectedTask.taskId}`}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    <span>View Task</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <User className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-white">No messages in this chat yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Send a message to coordinate time, exact pickup location, or questions!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId?._id?.toString() === user?._id?.toString();
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                            isMine
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                          }`}
                        >
                          {msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              className="w-full max-h-48 object-cover rounded-xl mb-2"
                            />
                          )}
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                        </div>

                        <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-400 px-1">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {typingUsers[selectedTask.taskId] && (
                  <div className="flex items-center space-x-2 text-xs text-brand-400 animate-pulse pl-2">
                    <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                    <span>{typingUsers[selectedTask.taskId]} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
                {selectedFile && (
                  <div className="flex items-center justify-between mb-2 p-2 rounded-xl bg-slate-800 text-xs text-brand-300">
                    <span className="truncate">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Attach photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputContent}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!inputContent.trim() && !selectedFile)}
                    className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-40 shadow-md shadow-brand-600/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-white">Select a Chat Session</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose an ongoing task chat from the left to view messages and coordinate in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
