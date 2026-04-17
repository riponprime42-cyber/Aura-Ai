import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Sparkles, Zap, Shield, MessageSquare, Mic, Image as ImageIcon, ArrowRight, Github, Twitter, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
  loading?: boolean;
}

export default function LandingPage({ onGetStarted, loading }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-accent/20 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-accent rounded flex items-center justify-center shadow-lg shadow-accent/20">
              <Bot className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-sidebar">Aura AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-text-muted hover:text-accent transition-colors">Features</a>
            <div className="flex items-center gap-3">
              <button 
                onClick={onGetStarted}
                disabled={loading}
                className="bg-accent text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-accent-hover transition-all shadow-md shadow-accent/10 flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-accent/5 blur-[100px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-sidebar leading-[1.1] mb-6">
              Empower your workflow <br />
              <span className="text-accent">with Aura AI</span>
            </h1>
            
            <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              The professional AI dashboard for writing, coding, and brainstorming. Experience a chatbot that understands your world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onGetStarted}
                disabled={loading}
                className="group w-full sm:w-auto px-8 py-4 bg-sidebar text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 hover:bg-sidebar-hover shadow-xl disabled:opacity-70"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : (
                  <>
                    Get Started
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-text-main border border-border rounded-lg font-bold text-lg transition-all hover:bg-slate-50 shadow-sm">
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Mic className="text-accent" size={28} />}
              title="Voice Interaction"
              description="Speak naturally. Aura supports lightning-fast speech-to-text to make your interactions seamless."
            />
            <FeatureCard 
              icon={<ImageIcon className="text-accent" size={28} />}
              title="File Analysis"
              description="Upload images and documents. Aura provides deep insights and accurate context retrieval."
            />
            <FeatureCard 
              icon={<Shield className="text-accent" size={28} />}
              title="Enterprise Security"
              description="Your data is yours. We use bank-grade encryption to ensure your chat history remains private."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Bot className="text-accent" size={20} />
            <span className="text-lg font-bold text-sidebar">Aura AI</span>
          </div>
          
          <div className="flex gap-8 text-text-muted">
            <a href="#" className="hover:text-accent transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-accent transition-colors"><Github size={20} /></a>
          </div>
          
          <div className="text-sm text-text-muted font-medium">
            © 2026 Aura Labs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="mb-4 inline-flex p-3 bg-accent/5 rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-sidebar">{title}</h3>
      <p className="text-text-muted leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
