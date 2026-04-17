import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Pin, 
  Trash2, 
  Plus, 
  LogOut, 
  Bot,
  User,
  MoreHorizontal
} from 'lucide-react';
import { ChatThread, UserProfile } from '../types';
import { cn, formatDate } from '../lib/utils';
import { auth, deleteThread, togglePin } from '../lib/firebase';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  user: UserProfile | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
}

export default function Sidebar({ 
  threads, 
  activeThreadId, 
  user, 
  onSelectThread, 
  onNewChat,
  isOpen 
}: SidebarProps) {
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const holdTimer = React.useRef<NodeJS.Timeout | null>(null);

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const dateA = a.lastMessageAt ? (typeof a.lastMessageAt === 'string' ? new Date(a.lastMessageAt) : (a.lastMessageAt as any).toDate?.() || new Date(0)) : new Date(0);
    const dateB = b.lastMessageAt ? (typeof b.lastMessageAt === 'string' ? new Date(b.lastMessageAt) : (b.lastMessageAt as any).toDate?.() || new Date(0)) : new Date(0);
    
    return dateB.getTime() - dateA.getTime();
  });

  const handleHoldStart = (threadId: string) => {
    holdTimer.current = setTimeout(() => {
      setMenuOpenId(threadId);
    }, 500); // 500ms for hold
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-[260px] bg-sidebar text-white flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
      !isOpen && "-translate-x-full"
    )}>
      {/* Sidebar Header */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <Bot className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">Aura AI</span>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full mb-6 border border-white/20 hover:bg-white/10 p-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          New Chat
        </button>

        <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-3 px-1">
          Recent
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {sortedThreads.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              "group relative flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all text-sm",
              activeThreadId === thread.id 
                ? "bg-sidebar-hover text-white" 
                : "text-white/70 hover:bg-sidebar-hover hover:text-white"
            )}
            onClick={() => {
              if (menuOpenId === thread.id) {
                setMenuOpenId(null);
              } else {
                onSelectThread(thread.id);
              }
            }}
            onPointerDown={() => handleHoldStart(thread.id)}
            onPointerUp={handleHoldEnd}
            onPointerLeave={handleHoldEnd}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuOpenId(thread.id);
            }}
          >
            <div className="flex items-center gap-3 min-w-0 pr-8">
              <MessageSquare size={16} className={activeThreadId === thread.id ? "text-white" : "text-white/40"} />
              <span className="truncate">{thread.title || "Untitled Chat"}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {thread.isPinned && !menuOpenId && (
                <Pin size={12} className="text-accent fill-accent" />
              )}
              
              {/* More button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === thread.id ? null : thread.id); }}
                className={cn(
                  "p-1 hover:bg-white/10 rounded-md transition-opacity",
                  menuOpenId === thread.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <MoreHorizontal size={14} />
              </button>

              {/* Context Menu / Options */}
              <AnimatePresence>
                {menuOpenId === thread.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-sidebar border border-white/10 rounded-lg shadow-2xl p-1 min-w-[120px]"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePin(thread.id, !thread.isPinned); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/10 rounded-md text-xs text-white"
                    >
                      <Pin size={14} className={thread.isPinned ? "fill-accent text-accent" : ""} />
                      {thread.isPinned ? "Unpin Chat" : "Pin Chat"}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-red-500/20 rounded-md text-xs text-red-400"
                    >
                      <Trash2 size={14} />
                      Delete Chat
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {threads.length === 0 && (
          <div className="py-8 text-center px-4">
            <p className="text-xs text-white/20">No conversations</p>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0">
            <User size={16} className="text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.displayName || "User"}</div>
          </div>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="w-full text-left px-1 py-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          Log Out Account
        </button>
      </div>
    </aside>
  );
}
