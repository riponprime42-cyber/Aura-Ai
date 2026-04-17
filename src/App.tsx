import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db, syncUserProfile, createThread, addMessage, deleteMessage, togglePinMessage } from './lib/firebase';
import { chatStream, generateTitle } from './lib/gemini';
import { ChatThread, Message, UserProfile, Attachment } from './types';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { Menu, X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setAuthReady(false);
      setUser(u);
      if (u) {
        const p = await syncUserProfile(u);
        setProfile(p);
      } else {
        setProfile(null);
        setThreads([]);
        setActiveThreadId(null);
        setMessages([]);
      }
      setAuthReady(true);
    });
  }, []);

  // Threads Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'threads'),
      where('userId', '==', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const t = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatThread));
      setThreads(t);
    });
  }, [user]);

  // Messages Listener
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'threads', activeThreadId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const m = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
        } as Message;
      });
      setMessages(m);
    });
  }, [activeThreadId]);

  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if (!user) return;
    setError(null);

    let currentThreadId = activeThreadId;

    try {
      // 1. Create thread if none active
      if (!currentThreadId) {
        const title = await generateTitle(content);
        currentThreadId = await createThread(user.uid, title);
        setActiveThreadId(currentThreadId);
      }

      // 2. Add user message
      await addMessage(currentThreadId, {
        role: 'user',
        content,
        attachments
      });

      // 3. Stream AI response
      setIsTyping(true);
      const stream = await chatStream(content, messages, attachments);
      let fullResponse = "";
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      // 4. Save AI message
      await addMessage(currentThreadId, {
        role: 'model',
        content: fullResponse
      });

    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeThreadId) return;
    try {
      await deleteMessage(activeThreadId, messageId);
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handlePinMessage = async (messageId: string, pinned: boolean) => {
    if (!activeThreadId) return;
    try {
      await togglePinMessage(activeThreadId, messageId, pinned);
    } catch (err) {
      setError('Failed to pin message');
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" 
        />
      </div>
    );
  }

  if (!user && !showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (!user && showAuth) {
    return <Auth onSuccess={() => setShowAuth(false)} />;
  }

  return (
    <div className="flex h-screen bg-bg-main text-text-main font-sans">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        threads={threads}
        activeThreadId={activeThreadId}
        user={profile}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative min-w-0 h-screen overflow-hidden">
        <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-white z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors md:hidden text-text-muted"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-sm font-semibold text-text-muted truncate max-w-[300px]">
              {activeThreadId ? threads.find(t => t.id === activeThreadId)?.title : 'Aura AI'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleNewChat}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-all font-medium text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3 text-red-600 text-sm shadow-md">
              <AlertCircle size={18} />
              <span className="flex-1 truncate">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700 font-bold">Dismiss</button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!activeThreadId && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-10 text-center">
                <h1 className="text-[2.5rem] font-extrabold tracking-tight mb-3 text-text-main">
                  Hi {profile?.displayName?.split(' ')[0] || 'there'}, how can I help you?
                </h1>
                <p className="text-text-muted max-w-lg mx-auto font-medium">
                  Aura is your personal AI assistant for writing, coding, and brainstorming.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                <OptionCard title="Market Strategy 2024" desc="Analyze current trends and plan your next move." />
                <OptionCard title="Image Generation" desc="Create stunning visuals from descriptions." />
              </div>
            </div>
          ) : (
            <MessageList 
              messages={messages} 
              isTyping={isTyping} 
              onDeleteMessage={handleDeleteMessage}
              onPinMessage={handlePinMessage}
            />
          )}

          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </main>
    </div>
  );
}

function OptionCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 bg-white border border-border rounded-xl hover:border-accent/40 shadow-sm text-left transition-all">
      <h3 className="text-sm font-bold mb-1 text-text-main">{title}</h3>
      <p className="text-xs text-text-muted">{desc}</p>
    </div>
  );
}
