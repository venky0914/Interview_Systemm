"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSend, MdAutoAwesome, MdInfoOutline,
  MdContentCopy, MdThumbUp, MdThumbDown,
} from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import toast from "react-hot-toast";
import api from "@/services/api";
import { cn } from "@/utils/helpers";
import { SUBJECTS } from "@/utils/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  is_from_notes?: boolean;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What are the key concepts I should know?",
  "Explain with a simple example.",
  "What are common interview questions on this topic?",
  "What are the differences between X and Y?",
];

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-primary-600 text-white text-sm leading-relaxed">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shrink-0 mt-1">
        <RiRobot2Line size={15} />
      </div>

      <div className="flex-1 space-y-2">
        {/* Message */}
        <div className="card px-4 py-3 rounded-tl-sm">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </p>
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && msg.is_from_notes && (
          <div className="flex items-start gap-1.5 px-1">
            <MdInfoOutline size={13} className="text-primary-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-[var(--text-muted)]">
              Answer sourced from your uploaded notes.
            </p>
          </div>
        )}

        {!msg.is_from_notes && msg.role === "assistant" && (
          <div className="flex items-center gap-1.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
              Topic not found in uploaded notes.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <MdContentCopy size={11} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-accent-500 transition-colors">
            <MdThumbUp size={11} /> Helpful
          </button>
          <button className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-red-500 transition-colors">
            <MdThumbDown size={11} /> Not helpful
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AiAssistantPage() {
  const { slug } = useParams<{ slug: string }>();
  const subject = SUBJECTS.find((s) => s.slug === slug);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const question = text.trim();
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", {
        subject_slug: slug,
        message: question,
        conversation_history: messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        is_from_notes: data.is_from_notes,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }, [slug, messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] gap-4">

      {/* Header */}
      <div className="card px-5 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
          <RiRobot2Line size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            {subject?.emoji} {subject?.name} AI Assistant
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Answers from your uploaded notes only</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
          <span className="text-[10px] font-medium text-accent-600 dark:text-accent-400">RAG Active</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        <AnimatePresence>
          {isEmpty ? (
            /* Empty state / welcome */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
                <MdAutoAwesome size={28} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Ask me anything about {subject?.name}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                  I'll answer strictly from your uploaded study notes.
                  If a topic isn't covered, I'll let you know.
                </p>
              </div>

              {/* Suggested questions */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="card card-interactive px-3 py-2.5 text-xs text-left text-[var(--text-secondary)] hover:text-primary-600 hover:border-primary-300 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-end"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shrink-0">
              <RiRobot2Line size={15} />
            </div>
            <div className="card px-4 py-3 rounded-tl-sm">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-4 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={`Ask about ${subject?.name}...`}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-all disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
              input.trim() && !loading
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-glow"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
            )}
          >
            <MdSend size={18} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          <MdInfoOutline size={10} className="inline mr-1" />
          This assistant only uses your uploaded notes. It will not hallucinate.
        </p>
      </div>
    </div>
  );
}
