import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api'; // We'll add a chat endpoint later
import { Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI Financial Assistant. Ask me anything about your budget or spending habits.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Temporary: echo response or mock until backend is ready
            // Real implementation would call api.post('/chat', { query: input })

            // Mocking delay
            setTimeout(() => {
                const aiMsg = {
                    role: 'assistant',
                    content: `I noticed you asked: "${userMsg.content}". (To make me real, please configure the Gemini API key in the backend!)`
                };
                setMessages(prev => [...prev, aiMsg]);
                setLoading(false);
            }, 1000);

        } catch (err) {
            console.error("Chat Error", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 max-w-4xl mx-auto">
            <div className="flex-1 bg-secondary rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 bg-dark/50 flex items-center gap-3">
                    <div className="p-2 bg-accent/20 rounded-full text-accent">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">Financial Assistant</h2>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-accent text-dark rounded-tr-none'
                                    : 'bg-dark border border-gray-700 text-gray-200 rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-dark border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-dark/50 border-t border-gray-800">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-accent focus:outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-accent text-dark p-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
