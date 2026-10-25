import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'ZEJI INTEL SYSTEM ONLINE. Inquire about compositions, world tour coordinates, or armory requisitions.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const isComplex = /meaning|deep|philosophy|why|explain/i.test(userMsg);
      const endpoint = isComplex ? '/api/complex-query' : '/api/chat';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await res.json();
      
      if (res.ok && data.reply) {
        setMessages([...newMessages, { id: Date.now().toString(), role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { id: Date.now().toString(), role: 'assistant', content: 'ZEJI core servers busy. Retrying uplink...' }]);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages([...newMessages, { id: Date.now().toString(), role: 'assistant', content: 'Transmission disrupted. Check connection.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-[380px] sm:w-[420px] h-[520px] max-h-[82vh] bg-black border-2 border-white text-white shadow-[8px_8px_0_#ffffff] z-50 flex flex-col overflow-hidden font-sans select-none"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            {/* Header in Black & White with Neon Accent */}
            <div className="flex items-center justify-between px-4 py-3 bg-black border-b-2 border-white text-white">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white text-black">
                  <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-game font-black text-xs tracking-wider uppercase block text-white">
                    ZEJI AI COPILOT
                  </span>
                  <span className="text-[9px] font-mono text-[#00FF66] block leading-none">
                    ONLINE // INTELLIGENCE
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  playSelectSound();
                  onClose();
                }} 
                onMouseEnter={playHoverSound}
                className="text-white hover:bg-white hover:text-black border border-white p-1 transition-colors"
                aria-label="Close AI Chat"
                title="Close (ESC)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050505]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-white text-black font-semibold border-2 border-black shadow-[2px_2px_0_#00FF66]' 
                      : 'bg-black border border-zinc-700 text-zinc-200 font-mono shadow-[2px_2px_0_#000000]'
                  }`}>
                    {msg.role === 'assistant' && (
                      <span className="text-[9px] font-bold text-[#00FF66] block mb-1">
                        ZEJI // AI:
                      </span>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-black border border-zinc-700 px-3 py-2 text-xs flex items-center gap-2 font-mono text-zinc-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FF66]" />
                    <span>SYNTHESIZING...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="p-3 bg-black border-t-2 border-white flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about music, lore, tour..."
                className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none font-mono"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                onMouseEnter={playHoverSound}
                className="px-3 py-2 bg-white text-black hover:bg-[#00FF66] disabled:opacity-40 transition-colors font-bold text-xs flex items-center justify-center border border-white"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
