import React, { useState, useRef, useEffect } from "react";
import { MessageSquareCode, Send, Sparkles, Brain, ArrowRight, User, Cpu, AlertCircle, HelpCircle } from "lucide-react";
import { DatasetAnalysis, ChatMessage } from "../types";
import ReactMarkdown from "react-markdown";

interface ChatViewProps {
  dataset: DatasetAnalysis;
  darkMode: boolean;
}

const PRESET_QUERIES = [
  "Identify dynamic trends in the current metrics.",
  "Which category has the highest units sold count?",
  "What are the main risks identified in the data?",
  "Suggest a few interesting business segments to analyze."
];

export default function ChatView({ dataset, darkMode }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: `Hello! I am your **AI Data Detective**. I've successfully loaded and structured **${dataset.fileName}** with **${dataset.rowCount} rows**.\n\nAsk me any business questions, query specific column distributions, or ask me to explain a visualization trend! What case are we solving today?`,
      timestamp: Date.now()
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Gather relevant dataset columns and metadata to pass as compact context
      const datasetInfo = {
        fileName: dataset.fileName,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        primaryKey: dataset.primaryKey,
        dataQualityScore: dataset.dataQualityScore,
        columns: dataset.columns.map(c => ({
          name: c.name,
          type: c.type,
          mean: c.mean,
          min: c.min,
          max: c.max,
          mode: c.mode,
          stdDev: c.stdDev
        })),
        sampleRows: dataset.rawSample.slice(0, 10) // compact sample rows for Gemini context
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetInfo,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
          newMessage: text
        })
      });

      if (!response.ok) {
        throw new Error("Chat failed.");
      }

      const result = await response.json();
      
      const aiMsg: ChatMessage = {
        id: "msg_" + Date.now() + "_ai",
        role: "model",
        content: result.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: "msg_" + Date.now() + "_err",
        role: "model",
        content: "I'm sorry, I encountered an issue compiling that query. Please make sure your Gemini API Key is active in your platform settings.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-13rem)] md:h-[calc(100vh-10.5rem)] max-w-5xl mx-auto py-1 sm:py-2">
      {/* Introduction Header */}
      <div className="text-left space-y-1 mb-2 sm:mb-3">
        <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center justify-start gap-1.5">
          <MessageSquareCode className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <span>Interactive Cognitive Chat</span>
        </h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Converse with Gemini to identify anomalous columns, run correlation queries, and explore interactive metrics.
        </p>
      </div>

      {/* Main chat window container */}
      <div className={`flex-1 border rounded-xl overflow-hidden flex flex-col justify-between ${
        darkMode ? "bg-slate-900/45 border-slate-800" : "bg-white border-gray-200"
      }`}>
        
        {/* Chat History bubbles */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                {/* Avatar icon */}
                <div className={`p-1.5 rounded flex-shrink-0 ${
                  isUser 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-950 border border-slate-800 text-indigo-400"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[88%] sm:max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  isUser 
                    ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-100 font-mono" 
                    : darkMode 
                      ? "bg-slate-950/80 text-slate-300 border border-slate-850" 
                      : "bg-gray-50 text-gray-850 border border-gray-200"
                }`}>
                  {/* Clean Markdown parsing */}
                  <div className="markdown-body text-xs space-y-1 font-mono leading-relaxed break-words">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-indigo-400 flex-shrink-0">
                <Cpu className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-lg text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5 bg-slate-950/30 border border-slate-900">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                <span className="text-[9px] uppercase pl-1 font-bold tracking-widest text-indigo-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset query Suggestions (Horizontal row above input) */}
        {!loading && messages.length <= 3 && (
          <div className="px-3 py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-950/40">
            <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase flex-shrink-0">Ideas:</span>
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:border-indigo-500/40 rounded-full text-[11px] text-slate-300 font-medium font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 min-h-[34px]"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
              </button>
            ))}
          </div>
        )}

        {/* Chat input box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="p-2.5 sm:p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the dataset..."
            className={`flex-1 text-xs px-3.5 py-2.5 rounded-lg border outline-none font-mono min-h-[44px] ${
              darkMode 
                ? "bg-slate-950 border-slate-800 focus:border-indigo-500 text-white placeholder:text-slate-500" 
                : "bg-white border-gray-200 focus:border-indigo-500 text-gray-950"
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-lg transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
