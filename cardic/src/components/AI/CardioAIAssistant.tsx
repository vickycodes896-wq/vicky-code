import React, { useState, useRef, useEffect } from 'react';
import { SimulationState } from '../../types/cardiac';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  MessageCircle,
  Send,
  RotateCcw,
  User,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';

interface CardioAIAssistantProps {
  simulationState: SimulationState;
  isDark?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export const CardioAIAssistant: React.FC<CardioAIAssistantProps> = ({
  simulationState,
  isDark = true,
}) => {
  const colors = {
    bgPrimary:   isDark ? '#07100F' : '#F8FAF9',
    bgSecondary: isDark ? '#0D1C1A' : '#FFFFFF',
    bgTertiary:  isDark ? '#081514' : '#F4F7F6',
    bgCard:      isDark ? '#0D1C1A' : '#FFFFFF',
    textPrimary: isDark ? '#F0FDF4' : '#0F172A',
    textSecondary: isDark ? '#8DA9A5' : '#475569',
    textMuted:   isDark ? '#5B7773' : '#8A9FA8',
    border:      isDark ? '#183834' : '#E2E8E5',
    borderSubtle: isDark ? '#142B28' : '#EDF2F0',
    accent:      isDark ? '#10B981' : '#059669',
    coral:       isDark ? '#F43F5E' : '#E11D48',
    green:       isDark ? '#2ED89B' : '#10B981',
    userBubble:  isDark ? 'rgba(16,185,129,0.14)' : '#ECFDF5',
    botBubble:   isDark ? '#081514' : '#FFFFFF',
    userBorder:  isDark ? 'rgba(16,185,129,0.35)' : 'rgba(5,150,105,0.25)',
    botBorder:   isDark ? '#183834' : '#E2E8E5',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! Welcome to the Learn & Ask section of CardioSim 3D.\n\nI can help you understand how the heart works. Currently, the simulation is running at **${simulationState.heartRate} BPM** with a blood pressure of **${simulationState.systolicBP}/${simulationState.diastolicBP} mmHg** and a cardiac output of **${simulationState.cardiacOutput.toFixed(2)} L/min**.\n\nFeel free to ask anything about heart anatomy, blood circulation, ECG readings, or what any value on the dashboard means!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = [
    'What is cardiac output?',
    'How does blood flow through the heart?',
    'What does the ECG show?',
    'What is a normal heart rate?',
    'What does blood pressure mean?',
    'Explain stroke volume.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          detailLevel: 'concise',
          context: {
            heartRate: simulationState.heartRate,
            strokeVolume: simulationState.strokeVolume,
            systolicBP: simulationState.systolicBP,
            diastolicBP: simulationState.diastolicBP,
            bloodVolume: simulationState.bloodVolume,
            cardiacOutput: simulationState.cardiacOutput,
            pulsePressure: simulationState.pulsePressure,
            meanArterialPressure: simulationState.meanArterialPressure,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Server error');
      }

      const botMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'model',
        text: `Could not connect to the server. Please check that the app is running correctly.\n\nError: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        text: `Chat cleared. You can now ask me anything about heart health or cardiovascular physiology!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h2 style={{ color: colors.textPrimary }} className="text-xl font-tech font-bold tracking-wide flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: colors.accent }} />
          Learn & Ask
        </h2>
        <p style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
          Ask questions about the heart, blood circulation, ECG readings, or anything shown on the dashboard.
        </p>
      </div>

      {/* Chat Container */}
      <div
        style={{
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        }}
        className="shadow-xl flex flex-col h-[600px] overflow-hidden border border-b-[4px] border-b-[#07251f] card-3d rounded-2xl"
      >
        {/* Chat Header */}
        <div
          style={{ backgroundColor: colors.bgCard, borderBottomColor: colors.border }}
          className="flex items-center justify-between gap-3 p-4 border-b"
        >
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}35` }}
              className="w-9 h-9 rounded-xl border flex items-center justify-center"
            >
              <MessageCircle className="w-5 h-5" style={{ color: colors.accent }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                  Cardiovascular Q&A
                </h3>
                <Badge variant="emerald" className="text-[10px] py-0 px-2">
                  LIVE DATA
                </Badge>
              </div>
              <p style={{ color: colors.textMuted }} className="text-xs">
                Answers are based on your current simulation values
              </p>
            </div>
          </div>

          <Button
            onClick={handleClearChat}
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Values Strip */}
        <div
          style={{ backgroundColor: isDark ? 'rgba(7,17,31,0.5)' : 'rgba(240,244,248,0.7)', borderBottomColor: colors.borderSubtle }}
          className="px-4 py-2 border-b"
        >
          <div className="flex flex-wrap gap-3 text-[11px] font-mono">
            <span style={{ color: colors.textMuted }}>Current values:</span>
            <span style={{ color: colors.coral }} className="font-semibold">{simulationState.heartRate} BPM</span>
            <span style={{ color: colors.textMuted }}>·</span>
            <span style={{ color: colors.textSecondary }}>{simulationState.systolicBP}/{simulationState.diastolicBP} mmHg</span>
            <span style={{ color: colors.textMuted }}>·</span>
            <span style={{ color: colors.green }} className="font-semibold">{simulationState.cardiacOutput.toFixed(2)} L/min CO</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  style={{
                    backgroundColor: isUser ? `${colors.accent}18` : msg.isError ? '#FEE2E280' : `${colors.coral}18`,
                    borderColor: isUser ? `${colors.accent}40` : msg.isError ? '#FCA5A560' : `${colors.coral}40`,
                    color: isUser ? colors.accent : msg.isError ? '#F87171' : colors.coral,
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border text-xs"
                >
                  {isUser ? <User className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  style={{
                    backgroundColor: isUser ? colors.userBubble : msg.isError ? (isDark ? '#4C0519' : '#FEF2F2') : colors.botBubble,
                    borderColor: isUser ? colors.userBorder : msg.isError ? '#FCA5A540' : colors.botBorder,
                    color: colors.textPrimary,
                    borderTopLeftRadius: !isUser ? '4px' : undefined,
                    borderTopRightRadius: isUser ? '4px' : undefined,
                  }}
                  className="max-w-[85%] rounded-2xl p-3.5 shadow-sm relative group border"
                >
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                  <div
                    style={{ borderTopColor: colors.borderSubtle, color: colors.textMuted }}
                    className="flex items-center justify-between mt-2 pt-1 border-t text-[10px] font-mono"
                  >
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:opacity-70 cursor-pointer"
                      title="Copy"
                    >
                      {copiedId === msg.id
                        ? <Check className="w-3 h-3" style={{ color: colors.green }} />
                        : <Copy className="w-3 h-3" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div
                style={{ backgroundColor: `${colors.coral}18`, borderColor: `${colors.coral}40`, color: colors.coral }}
                className="w-7 h-7 rounded-lg border flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4" />
              </div>
              <div
                style={{ backgroundColor: colors.botBubble, borderColor: colors.botBorder, color: colors.textSecondary }}
                className="border rounded-2xl rounded-tl-sm p-3.5 text-xs flex items-center gap-2 font-mono"
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }} />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div
          style={{ borderTopColor: colors.borderSubtle, backgroundColor: isDark ? 'rgba(7,17,31,0.5)' : 'rgba(248,250,252,0.8)' }}
          className="px-4 py-2 border-t overflow-x-auto"
        >
          <div className="flex items-center gap-1.5 text-xs min-w-max">
            <span style={{ color: colors.textMuted }} className="text-[11px] font-mono shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" style={{ color: colors.accent }} />
              Ask:
            </span>
            {suggestedQuestions.map((q) => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="shrink-0 h-7 text-[11px] px-2.5 rounded-lg font-medium"
              >
                {q}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div style={{ backgroundColor: isDark ? '#0B1726' : '#F8FAFC', borderTopColor: colors.borderSubtle }} className="p-3 border-t">
          <div
            style={{ backgroundColor: colors.bgPrimary, borderColor: colors.borderSubtle }}
            className="flex items-end gap-2 border rounded-xl p-2 focus-within:ring-2 transition"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question about the heart, ECG, blood pressure..."
              style={{ color: colors.textPrimary, caretColor: colors.accent }}
              className="flex-1 bg-transparent text-sm placeholder-slate-500 resize-none outline-none font-sans"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 rounded-lg shrink-0"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div
            style={{ color: colors.textMuted }}
            className="flex items-center justify-between text-[10px] font-mono px-1 mt-2"
          >
            <span>Press Enter to send · Shift+Enter for new line</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" style={{ color: colors.green }} />
              Educational use only — not medical advice
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
