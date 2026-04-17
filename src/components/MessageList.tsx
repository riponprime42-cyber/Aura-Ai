import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { cn, formatDate } from '../lib/utils';
import { User, Bot, Paperclip, MoreVertical, Trash2, Pin as PinIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onDeleteMessage: (id: string) => void;
  onPinMessage: (id: string, pinned: boolean) => void;
}

export default function MessageList({ messages, isTyping, onDeleteMessage, onPinMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleHoldStart = (msgId: string) => {
    holdTimer.current = setTimeout(() => {
      setActiveMenuId(msgId);
    }, 500);
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-8 space-y-8 custom-scrollbar scroll-smooth"
    >
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-32">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={cn(
              "group flex gap-4 relative",
              msg.role === 'user' ? "flex-row-reverse self-end" : "self-start"
            )}
            onPointerDown={() => handleHoldStart(msg.id)}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            onContextMenu={(e) => {
              e.preventDefault();
              setActiveMenuId(msg.id);
            }}
          >
            <div className={cn(
              "w-8 h-8 rounded flex-shrink-0 flex items-center justify-center",
              msg.role === 'user' 
                ? "bg-slate-300" 
                : "bg-accent"
            )}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={18} className="text-white" />}
            </div>

            <div className={cn(
              "relative max-w-[80%] space-y-2",
              msg.role === 'user' ? "items-end text-right" : "items-start text-left"
            )}>
              {/* Message Pin Indicator */}
              {msg.pinned && (
                <div className="absolute -top-6 right-0 left-0 flex items-center justify-center gap-1 text-[10px] text-accent font-bold uppercase tracking-tighter">
                  <PinIcon size={10} className="fill-accent" />
                  Pinned
                </div>
              )}

              {msg.attachments && msg.attachments.length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-2 mb-3",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {msg.attachments.map((att, j) => (
                    <div key={j} className="relative group max-w-[200px] rounded-lg overflow-hidden border border-border shadow-sm bg-white">
                      {att.type.startsWith('image/') ? (
                        <img src={att.data} alt="" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="p-2.5 flex items-center gap-2">
                          <Paperclip size={14} className="text-accent" />
                          <span className="text-xs truncate font-medium">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={cn(
                "group relative rounded-xl px-4 py-3 text-[0.95rem] leading-normal shadow-sm transition-all",
                msg.role === 'user' 
                  ? "bg-white border border-border text-text-main" 
                  : "bg-bubble-ai text-text-main",
                activeMenuId === msg.id && "ring-2 ring-accent/20 border-accent"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Desktop Hover Action button */}
                <button 
                  onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                  className={cn(
                    "absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hidden md:block",
                    activeMenuId === msg.id && "opacity-100"
                  )}
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Message Actions Menu */}
              <AnimatePresence>
                {activeMenuId === msg.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className={cn(
                      "absolute z-10 bg-white border border-border rounded-lg shadow-xl p-1 min-w-[140px]",
                      msg.role === 'user' ? "right-0" : "left-0"
                    )}
                  >
                    <div className="flex items-center justify-between p-2 mb-1 border-b border-border">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Options</span>
                      <button onClick={() => setActiveMenuId(null)} className="text-text-muted hover:text-text-main">
                        <X size={12} />
                      </button>
                    </div>
                    <button 
                      onClick={() => { onPinMessage(msg.id, !msg.pinned); setActiveMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-md text-text-main"
                    >
                      <PinIcon size={14} className={msg.pinned ? "fill-accent text-accent" : ""} />
                      {msg.pinned ? "Unpin Message" : "Pin Message"}
                    </button>
                    <button 
                      onClick={() => { onDeleteMessage(msg.id); setActiveMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-red-50 rounded-md text-red-500"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
             <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center bg-accent">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-bubble-ai rounded-xl px-4 py-3 flex gap-1 items-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
