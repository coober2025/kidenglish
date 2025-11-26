import React, { useState, useEffect, useRef } from 'react';
import { CambridgeLevel, ChatMessage } from '../types';
import { createChatSession, translateToChinese } from '../services/geminiService';
import { ChatSession } from '@google/genai';
import { Button } from '../components/Button';
import { Send, User, Bot, Sparkles, Volume2, Languages, Loader2 } from 'lucide-react';
import { playSFX } from '../utils/soundEffects';
import { speak } from '../utils/textToSpeech';

interface Props {
  level: CambridgeLevel;
}

export const Chat: React.FC<Props> = ({ level }) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chat = createChatSession(level);
    setSession(chat);
    
    // Initial greeting
    const startChat = async () => {
        setIsTyping(true);
        try {
            const res = await chat.sendMessage({ message: "Hello! Introduce yourself to me." });
            setMessages([{
                id: 'init',
                role: 'model',
                text: res.text || "Hello! I am your AI buddy.",
                timestamp: Date.now()
            }]);
            playSFX('correct'); // Subtle notification sound
        } catch(e) { console.error(e) }
        setIsTyping(false);
    }
    startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, translatingId]); 

  const handleSend = async () => {
    if (!input.trim() || !session) return;
    
    playSFX('click');
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await session.sendMessage({ message: userMsg.text });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text || "I didn't quite catch that.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
      playSFX('correct'); 
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Oops, I fell asleep. Try saying that again!",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSend();
  }

  const handleTranslate = async (msgId: string, text: string) => {
    playSFX('click');
    if (messages.find(m => m.id === msgId)?.translation) return;

    setTranslatingId(msgId);
    try {
        const translation = await translateToChinese(text);
        setMessages(prev => prev.map(m => 
            m.id === msgId ? { ...m, translation } : m
        ));
    } catch (e) {
        console.error("Translation failed", e);
    } finally {
        setTranslatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50/50 rounded-t-[2rem]">
        <div className="flex-1 overflow-y-auto space-y-6 p-4 no-scrollbar">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white ${msg.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {msg.role === 'user' ? <User size={20} className="text-blue-600"/> : <Bot size={20} className="text-green-600"/>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className={`p-4 rounded-[1.5rem] text-[15px] leading-relaxed shadow-md ${
                                msg.role === 'user' 
                                ? 'bg-blue-500 text-white rounded-tr-none' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                            }`}>
                                {msg.text}
                                {msg.translation && (
                                    <div className={`mt-2 pt-2 border-t text-sm font-medium ${msg.role === 'user' ? 'border-blue-400/50 text-blue-50' : 'border-gray-100 text-slate-500'}`}>
                                        {msg.translation}
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className={`flex gap-2 px-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <button 
                                    onClick={() => speak(msg.text)} 
                                    className="p-1.5 rounded-full text-slate-400 hover:bg-white hover:shadow-sm hover:text-blue-500 transition-all"
                                    title="Speak"
                                >
                                    <Volume2 size={14} />
                                </button>
                                <button 
                                    onClick={() => handleTranslate(msg.id, msg.text)} 
                                    className={`p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all ${msg.translation ? 'text-green-500' : 'text-slate-400 hover:text-green-500'}`}
                                    title="Translate"
                                    disabled={translatingId === msg.id}
                                >
                                    {translatingId === msg.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Languages size={14} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="flex gap-2 bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none items-center shadow-sm">
                        <Sparkles size={16} className="text-green-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-400">Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-3 bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-slate-800 px-4 py-2 focus:outline-none placeholder:text-slate-400 font-medium"
                />
                <Button onClick={handleSend} size="md" className="!rounded-2xl aspect-square !px-0 !w-12 flex items-center justify-center shadow-blue-200">
                    <Send size={20} className="ml-0.5" />
                </Button>
            </div>
        </div>
    </div>
  );
};