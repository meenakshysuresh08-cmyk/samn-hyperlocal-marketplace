import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import {
  X,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Phone,
  User,
} from 'lucide-react';

export default function ChatDrawer({ isOpen, onClose, task }) {
  const { user } = useAuthStore();
  const {
    messages,
    loadMessages,
    leaveChat,
    sendMessage,
    sendTyping,
    typingUsers,
    bindChatEvents,
  } = useChatStore();

  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && task?._id) {
      loadMessages(task._id);
      bindChatEvents();
    }
    return () => {
      if (task?._id) leaveChat(task._id);
    };
  }, [isOpen, task?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!isOpen || !task) return null;

  const isCustomer = task.customerId?._id?.toString() === user?._id?.toString();
  const participant = isCustomer ? task.helperId : task.customerId;

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    sendTyping(task._id, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(task._id, false);
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() && !selectedFile) return;

    setSending(true);
    sendTyping(task._id, false);
    await sendMessage(task._id, inputContent.trim(), selectedFile);
    setInputContent('');
    setSelectedFile(null);
    setSending(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center space-x-3">
          <img
            src={participant?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
            alt={participant?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border border-brand-500/50"
          />
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {participant?.name || 'Assigned Participant'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isCustomer ? 'Your Helper' : 'Customer'} • Task: {task.title.slice(0, 18)}...
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <User className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Coordinate pickup, timing, or ask questions in real time!
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
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-md ${
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

                <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-500 px-1">
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
                      <Check className="w-3 h-3 text-slate-500" />
                    )
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers[task._id] && (
          <div className="flex items-center space-x-2 text-xs text-brand-400 animate-pulse pl-2">
            <span className="w-2 h-2 rounded-full bg-brand-400"></span>
            <span>{typingUsers[task._id]} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90">
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
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type your message..."
            value={inputContent}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
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
    </div>
  );
}
