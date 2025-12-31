"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Mic,
    MicOff,
    Volume2,
    Loader2,
    MessageCircle,
    Sparkles,
    X,
    ChevronRight,
    Zap,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

interface VoiceAssistantProps {
    context?: string; // Additional context for the AI (e.g., current page, user recordings)
    onInsight?: (insight: string) => void; // Callback when AI provides insight
    onAction?: (action: string, params?: Record<string, unknown>) => void; // Callback for actionable commands
    initialMessage?: string; // Pre-fill and auto-submit a question
    initiallyExpanded?: boolean; // Start in expanded state
    className?: string;
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

/**
 * VoiceAssistant - Conversational AI component combining ElevenLabs voice + Gemini intelligence
 * 
 * This component enables voice-driven interactions:
 * - User speaks a question/command
 * - Gemini processes and generates intelligent response
 * - ElevenLabs speaks the response back
 * 
 * For AI Partner Catalyst Hackathon (ElevenLabs + Google Cloud challenge)
 */
import { useAssistant } from '../contexts/AssistantContext';

export default function VoiceAssistant({
    context,
    onInsight,
    onAction,
    className = ''
}: VoiceAssistantProps) {
    const { isExpanded, setIsExpanded, initialMessage, setInitialMessage } = useAssistant();

    // States
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);

    // Handle initial message if provided (for quick questions)
    useEffect(() => {
        if (initialMessage && !hasProcessedInitialMessage && !isProcessing) {
            setHasProcessedInitialMessage(true);
            setIsExpanded(true);
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                handleUserInput(initialMessage);
                setInitialMessage(null); // Clear from context after starting
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialMessage, hasProcessedInitialMessage, isProcessing, setInitialMessage, setIsExpanded]);

    // Refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US';

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognitionRef.current.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const result = event.results[current];
                    const transcriptText = result[0].transcript;
                    setTranscript(transcriptText);

                    if (result.isFinal) {
                        handleUserInput(transcriptText);
                    }
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setError(`Voice recognition error: ${event.error}`);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            } else {
                console.warn('Speech recognition not supported in this browser environment');
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Scroll to bottom of conversation when new messages added
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // Start listening
    const startListening = useCallback(() => {
        setError(null);
        setTranscript('');

        if (!recognitionRef.current) {
            setError('Voice recognition not supported in this browser');
            return;
        }

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setError('Failed to start voice recognition');
        }
    }, []);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    // Handle user input and get AI response
    const handleUserInput = async (userText: string) => {
        if (!userText.trim()) return;

        // Add user message to conversation
        const userMessage: ConversationMessage = {
            role: 'user',
            content: userText,
            timestamp: new Date()
        };
        setConversation(prev => [...prev, userMessage]);
        setIsProcessing(true);
        setError(null);

        try {
            // Call our API that uses Gemini for intelligence
            const response = await fetch('/api/voice-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    context: context || 'VOISSS voice recording platform',
                    conversationHistory: conversation.slice(-6) // Last 6 messages for context
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            let aiResponse = data.response;

            // Parse for actions [ACTION:command]
            const actionMatch = aiResponse.match(/\[ACTION:(\w+)\]/);
            let action: string | null = null;

            if (actionMatch) {
                action = actionMatch[1];
                // Clean the response text for display and TTS
                aiResponse = aiResponse.replace(/\[ACTION:\w+\]/g, '').trim();
            }

            // Add AI message to conversation
            const aiMessage: ConversationMessage = {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            };
            setConversation(prev => [...prev, aiMessage]);

            // Handle action
            if (action) {
                if (onAction) {
                    onAction(action);
                } else {
                    // Default navigation actions
                    switch (action) {
                        case 'studio': window.location.href = '/studio'; break;
                        case 'help': window.location.href = '/help'; break;
                        case 'transcript': window.location.href = '/studio?mode=transcript'; break;
                        case 'features': window.location.href = '/features'; break;
                    }
                }
            }

            // Trigger callback if provided
            if (onInsight) {
                onInsight(aiResponse);
            }


            // Speak the response using ElevenLabs TTS
            await speakResponse(aiResponse);

        } catch (err) {
            console.error('Voice assistant error:', err);
            setError('Failed to process your request. Please try again.');
        } finally {
            setIsProcessing(false);
            setTranscript('');
        }
    };

    // Speak response using ElevenLabs TTS
    const speakResponse = async (text: string) => {
        setIsSpeaking(true);

        try {
            const response = await fetch('/api/elevenlabs/text-to-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah - friendly assistant voice
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate speech');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.onended = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                };
                await audioRef.current.play();
            }
        } catch (err) {
            console.error('TTS error:', err);
            setIsSpeaking(false);
            // Fallback: Don't show error, just don't speak
        }
    };

    // Handle text input submission (for accessibility)
    const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const text = formData.get('message') as string;
        if (text.trim()) {
            handleUserInput(text);
            e.currentTarget.reset();
        }
    };

    // Compact view when not expanded - removed to allow external control
    if (!isExpanded) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsExpanded(false)}
            />

            {/* Drawer Content */}
            <div className={`relative w-full max-w-lg bg-[#0A0A0A] border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col transition-transform duration-500 ease-out transform ${isExpanded ? 'translate-x-0' : 'translate-x-full'} ${className}`}>
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-600 via-blue-600 to-purple-600 opacity-50" />

                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-blue-600/10 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                {(isListening || isProcessing || isSpeaking) && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-[3px] border-[#0A0A0A] rounded-full animate-pulse shadow-lg" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">VOISSS Assistant</h3>
                                <div className="flex items-center gap-2.5 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`} />
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
                                        {isListening ? 'Listening...' : isProcessing ? 'Processing Context' : isSpeaking ? 'Speaking Output' : 'System Ready'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-400 hover:text-white hover:scale-110 active:scale-95"
                            aria-label="Close Assistant"
                        >
                            <X className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* Conversation Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide custom-scrollbar">
                    {conversation.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4 animate-in fade-in zoom-in-95 duration-700">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                                <div className="relative w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 ring-1 ring-white/5">
                                    <MessageCircle className="w-10 h-10 text-purple-400/70" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-white tracking-tight">Hello! I'm your AI companion</h4>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                                    I can help you navigate VOISSS, explain features, or manage your recordings through voice.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 w-full max-w-xs pt-4">
                                {['Tell me about voice transform', 'What is Multi-language dubbing?', 'How do I save to Base?'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleUserInput(s)}
                                        className="group px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-gray-400 hover:bg-white/[0.07] hover:border-white/10 hover:text-white transition-all text-left flex items-center justify-between"
                                    >
                                        <span>"{s}"</span>
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-purple-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {conversation.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                        >
                            <div
                                className={`max-w-[88%] px-6 py-4 rounded-[1.5rem] shadow-xl text-[15px] leading-relaxed tracking-wide ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none shadow-purple-500/10'
                                    : 'bg-[#151515] border border-white/5 text-gray-200 rounded-tl-none ring-1 ring-white/5 shadow-black/40'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-[#151515] border border-white/5 px-6 py-4 rounded-[1.5rem] rounded-tl-none ring-1 ring-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                                    </div>
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={conversationEndRef} />
                </div>

                {/* Context Context Banner */}
                {context && conversation.length > 0 && (
                    <div className="px-8 py-2 bg-white/[0.02] border-y border-white/5 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-400/50" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Context Active</span>
                    </div>
                )}

                {/* Transcript display when listening */}
                {transcript && (
                    <div className="px-8 py-4 bg-purple-600/10 border-t border-purple-500/20 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping" />
                            <p className="text-purple-300 text-[15px] font-medium italic tracking-wide">"{transcript}"</p>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="mx-8 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-[13px] font-medium leading-tight">{error}</p>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-8 bg-[#080808] border-t border-white/5 relative">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            disabled={isProcessing || isSpeaking}
                            className={`flex-shrink-0 w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group overflow-hidden ${isListening
                                ? 'bg-red-500 animate-pulse'
                                : isProcessing || isSpeaking
                                    ? 'bg-gray-800 cursor-not-allowed opacity-40'
                                    : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:scale-[1.02]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isListening ? (
                                <MicOff className="w-7 h-7 text-white relative z-10" />
                            ) : isSpeaking ? (
                                <Volume2 className="w-7 h-7 text-white animate-pulse relative z-10" />
                            ) : isProcessing ? (
                                <Loader2 className="w-7 h-7 text-white animate-spin relative z-10" />
                            ) : (
                                <Mic className="w-7 h-7 text-white relative z-10" />
                            )}
                        </button>

                        <div className="flex-1 relative group">
                            <form onSubmit={handleTextSubmit}>
                                <input
                                    type="text"
                                    name="message"
                                    placeholder="Speak or type a message..."
                                    disabled={isProcessing || isListening}
                                    className="w-full pl-6 pr-14 py-5 bg-white/[0.03] border border-white/5 rounded-[1.25rem] text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isProcessing || isListening}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-purple-400 hover:text-purple-300 disabled:opacity-0 transition-all hover:scale-110 active:scale-95"
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.25em] px-1 opacity-60">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Google Gemini 3.0
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                ElevenLabs
                            </span>
                        </div>
                        <span className="text-purple-400/80">AI Partner Catalyst</span>
                    </div>
                </div>
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
}

// Type declarations for Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
