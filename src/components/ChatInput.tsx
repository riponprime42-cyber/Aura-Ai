import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, X, Loader2, Paperclip, Music } from 'lucide-react';
import { Attachment } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || disabled) return;
    onSendMessage(content, attachments);
    setContent('');
    setAttachments([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: base64
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAttachments(prev => [...prev, {
            name: `voice-message-${Date.now()}.webm`,
            type: 'audio/webm',
            data: base64
          }]);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsAudioRecording(true);
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsAudioRecording(false);
  };

  // Speech-to-Text (using Web Speech API if supported)
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsSTTActive(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContent(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsSTTActive(false);
    recognition.onend = () => setIsSTTActive(false);

    recognition.start();
  };

  return (
    <div className="p-6 md:p-10 bg-gradient-to-t from-bg-main via-bg-main to-transparent">
      <div className="max-w-4xl mx-auto">
        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-3 p-3 bg-white border border-border rounded-xl shadow-sm"
            >
              {attachments.map((att, i) => (
                <div key={i} className="group relative w-14 h-14 rounded-lg bg-slate-50 border border-border overflow-hidden">
                  {att.type.startsWith('image/') ? (
                    <img src={att.data} alt="" className="w-full h-full object-cover" />
                  ) : att.type.startsWith('audio/') ? (
                    <div className="w-full h-full flex items-center justify-center bg-accent/10">
                      <Music size={18} className="text-accent" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Paperclip size={18} className="text-text-muted" />
                    </div>
                  )}
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar */}
        <div className={cn(
          "relative flex items-center gap-2 p-2 bg-white border border-border rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all focus-within:border-accent",
          disabled && "opacity-50 pointer-events-none"
        )}>
          <div className="flex items-center gap-1 pl-1">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-text-muted hover:text-accent transition-colors hover:bg-slate-50 rounded"
              title="Upload File"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
          </div>

          <input 
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Aura AI..."
            className="flex-1 bg-transparent border-none outline-none py-2.5 px-2 text-base text-text-main placeholder:text-text-muted"
          />

          <div className="flex items-center gap-1 pr-1">
            <button 
              onClick={isAudioRecording ? stopRecording : startRecording}
              className={cn(
                "p-2.5 rounded transition-all",
                isAudioRecording ? "bg-red-50 text-red-500 shadow-inner" : "text-text-muted hover:text-accent hover:bg-slate-50"
              )}
              title="Record Voice Message"
            >
              <Music size={20} />
            </button>
            <button 
              onClick={startSpeechRecognition}
              className={cn(
                "p-2.5 rounded transition-all",
                isSTTActive ? "bg-blue-50 text-accent shadow-inner" : "text-text-muted hover:text-accent hover:bg-slate-50"
              )}
              title="Speak"
            >
              <Mic size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!content.trim() && attachments.length === 0}
              className="p-2.5 text-accent hover:text-accent-hover transition-all disabled:opacity-20 font-bold"
              title="Send"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
        <p className="text-[0.7rem] text-center text-text-muted mt-3">
          Nexus can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
