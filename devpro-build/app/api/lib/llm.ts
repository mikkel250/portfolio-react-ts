import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for our chat interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string | null;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const google = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY || ''
);

// detect which provider to use based on model name 
type Provider = 'openai' | 'anthropic' | 'google';

function detectProvider(model: string): Provider {
  const modelToLower = model.toLowerCase();

  if (modelToLower.includes('claude')) {
    return 'anthropic';
  }

  if (modelToLower.includes('gemini')) {
    return 'google';
  }

  return 'openai';
}

async function callOpenAI(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  // Default options
  const {
    temperature = 0.7,
    maxTokens = 1000,
    model = 'gpt-4o-mini',
  } = options;

  // Format messages - handle both user strings and full message objects
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }
    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }
    // Assume it's a message with just content
    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // Build full message array with system prompt first
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...formattedMessages,
  ];

  // Call OpenAI API
  const response = await openai.chat.completions.create({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
  });

  // Extract response
  const choice = response.choices[0];
  if (!choice || !choice.message) {
    throw new Error('No response from OpenAI');
  }

  // Return structured response
  return {
    content: choice.message.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model,
    finishReason: choice.finish_reason,
  };
}

async function callAnthropic(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  const { temperature = 0.7, maxTokens = 1000, model = 'claude-haiku-4-5-20251001' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return {role: 'user', content: msg};
    }
    
    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }

    return {role: 'user', content: (msg as any).content || String(msg)};
  });

  // NOTE: Claude doesn't support 'system' role in messages!
  // filter to remove system messages (defensively)
  const claudeMessages = formattedMessages
  .filter(msg => msg.role !== 'system')
  .map(msg => ({
    role: msg.role as 'user' | 'assistant', // Claude only accepts these two options
    content: msg.content,
  }));

  // call Anthropic API 
  const response = await anthropic.messages.create({
    model,
    system: systemPrompt,
    messages: claudeMessages,
    temperature,
    max_tokens: maxTokens,
  });

  // extract response (anthropic returns content as an array)
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude!');
  }

  // normalize to my standard ChatResponse format
  return {
    content: textContent.text,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    model: response.model,
    finishReason: response.stop_reason,
  };
}

async function callGoogle(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  const { temperature = 0.7, maxTokens = 1000, model = 'gemini-2.5-flash' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }

    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }
    
    return { role: 'user',  content: (msg as any).content || String(msg) };
  });

  // google doesn't use a system prompt, inject it as first user message
  const googleMessages = [
    {
      role: 'user' as const,
      parts: [{ text: `${systemPrompt}\n\n${formattedMessages[0]?.content || '' }`}]
    },
    // add remaining messages (skip first since first is system prompt)
    ...formattedMessages.slice(1).map(msg => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await google.getGenerativeModel({ model }).generateContent({
    contents: googleMessages,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  // extract response (google returns nested objects)
  const candidate = response.response.candidates?.[0];
  if (!candidate) {
    throw new Error('No response from Google');
  }

  const content = candidate.content.parts?.[0]?.text;
  if (!content) {
    throw new Error('No text content in Google response');
  }

  // normalize to standard ChatResponse format
  return {
    content,
    usage: {
      promptTokens: response.response.usageMetadata?.promptTokenCount || 0,
      completionTokens: response.response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: response.response.usageMetadata?.totalTokenCount || 0,
    },
    model: model,
    finishReason: candidate.finishReason || null,
  };
};

// Send a chat completion request
export async function chat(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  try {
    const provider = detectProvider(options.model || process.env.AI_MODEL ||'gpt-4o-mini');

    switch (provider) {
      case 'openai':
        return await callOpenAI(messages, systemPrompt, options);
      case 'anthropic':
        return await callAnthropic(messages, systemPrompt, options);
      case 'google':
        return await callGoogle(messages, systemPrompt, options);
      default:
        throw new Error(`Unknown LLM provider: ${provider}! Please check and add a valid provider.`);
    }
  } catch (error: any) {
    // Enhanced error handling with useful messages
    console.error('LLM API Error:', error);

    if (error.status === 401) {
      throw new Error('Invalid API key. Check your .env.local file.');
    }

    if (error.status === 429) {
      throw new Error('Rate limit exceeded or insufficient quota. Add credits to your OpenAI account.');
    }

    if (error.status === 500 || error.status === 503) {
      throw new Error('LLM service is temporarily unavailable. Please try again later.');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error. Check your internet connection.');
    }

    // Generic error with original message
    throw new Error(`LLM API error: ${error.message || 'Unknown error'}`);
  }
}

// Testing function to check the OpenAI connection
export async function testConnection(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}