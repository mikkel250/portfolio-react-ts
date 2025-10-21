import React, {useState, useEffect, useRef} from 'react';
import ChatMessage from './ChatMessage';


interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({className}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // initialize session ID
  useEffect(() => {
    let id = localStorage.getItem('ai-chat-session-id');
    if (!id) {
      id = generateSessionId();
      localStorage.setItem('ai-chat-session-id', id);
    }
  })
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}