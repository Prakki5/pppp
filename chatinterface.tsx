
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'reasoning' | 'search' | 'maps'>('reasoning');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await GeminiService.chat(input, messages, mode);
      const modelMsg: ChatMessage = {
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        groundingUrls: response.groundingUrls
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Neural Brain</h2>
          <p className="text-gray-400 text-sm">Gemini 3 Pro + High Reasoning Pipeline</p>
        </div>
        <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
          {(['reasoning', 'search', 'maps'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <span className="text-6xl">🧠</span>
            <div>
              <p className="text-xl font-medium">Hello, I'm Apex Neural</p>
              <p className="text-sm">What should we solve today?</p>
            </div>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-indigo-500/10' 
                : 'glass text-gray-200'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              {m.groundingUrls && m.groundingUrls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Grounding Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {m.groundingUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors truncate max-w-[200px]"
                      >
                        {url.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass px-6 py-4 rounded-3xl">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder={`Ask anything using ${mode} mode...`}
          className="w-full bg-gray-900 border border-gray-800 rounded-3xl px-6 py-4 pr-16 focus:outline-none focus:border-indigo-500 transition-all resize-none shadow-2xl h-16 md:h-20"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
