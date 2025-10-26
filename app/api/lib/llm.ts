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
    maxTokens = 8192,
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
  const { temperature = 0.7, maxTokens = 8192, model = 'claude-haiku-4-5-20251001' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }

    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }

    return { role: 'user', content: (msg as any).content || String(msg) };
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
  const { temperature = 0.7, maxTokens = 8192, model = 'gemini-2.5-pro' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }

    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }

    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // google doesn't use a system prompt, inject it as first user message
  const googleMessages = [
    {
      role: 'user' as const,
      parts: [{ text: `${systemPrompt}\n\n${formattedMessages[0]?.content || ''}` }]
    },
    // add remaining messages (skip first since first is system prompt)
    ...formattedMessages.slice(1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  // Debugging
  // console.log('🔧 Google API Debug:');
  // console.log('🔧 System prompt length:', systemPrompt.length);
  // console.log('🔧 System prompt preview:', systemPrompt.substring(0, 200));
  // console.log('🔧 Messages count:', googleMessages.length);
  // console.log('🔧 Total context length:', JSON.stringify(googleMessages).length);
  // console.log('🔧 First message length:', googleMessages[0]?.parts[0]?.text.length);

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
    console.log('🔧 Google response structure:', JSON.stringify(response.response, null, 2));
    throw new Error('No response from Google');
  }

  const content = candidate.content.parts?.[0]?.text;
  if (!content) {
    console.log('🔧 Candidate content structure:', JSON.stringify(candidate.content, null, 2));
    console.log('🔧 Candidate finish reason:', candidate.finishReason);
    
    // Specific handling for common Google Gemini issues
    if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error('Google Gemini: Response truncated due to token limit. Try reducing maxTokens or using a different model.');
    }
    
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Google Gemini: Response blocked by safety filters. Try adjusting the prompt or temperature.');
    }
    
    if (candidate.finishReason === 'RECITATION') {
      throw new Error('Google Gemini: Response blocked due to recitation concerns. Try rephrasing the prompt.');
    }
    
    // Generic empty content error with diagnostic info
    throw new Error(`Google Gemini: No text content in response. Finish reason: ${candidate.finishReason || 'unknown'}. This usually indicates token limits, safety filters, or API issues.`);
  }

  // In callGoogle function, after getting the response:
  // console.log('🔧 Google response debug:');
  // console.log('🔧 Response length:', content.length);
  // console.log('🔧 Finish reason:', candidate.finishReason);
  // console.log('🔧 Safety ratings:', candidate.safetyRatings);
  // console.log('🔧 Usage metadata:', response.response.usageMetadata);
  // console.log('🔧 Model:', model);
  // console.log('🔧 Temperature:', temperature);
  // console.log('🔧 Max tokens:', maxTokens);
  // console.log('🔧 Messages:', messages);
  // // console.log('🔧 System prompt:', systemPrompt);
  // console.log('🔧 Options:', options);

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

// Build fallback chain from environment variables
function buildFallbackChain(primaryModel: string): Array<{ provider: Provider; model: string; reason: string }> {
  const fallbackChain: Array<{ provider: Provider; model: string; reason: string }> = [];
  
  // Add primary model first
  const primaryProvider = detectProvider(primaryModel);
  fallbackChain.push({
    provider: primaryProvider,
    model: primaryModel,
    reason: 'Primary model'
  });
  
  // Try to parse fallback models from JSON array in environment variable
  try {
    const fallbackModelsJson = process.env.AI_MODEL_FALLBACKS;
    if (fallbackModelsJson) {
      const fallbackModels = JSON.parse(fallbackModelsJson);
      if (Array.isArray(fallbackModels)) {
        fallbackModels.forEach((model, index) => {
          if (typeof model === 'string' && model.trim()) {
            const provider = detectProvider(model);
            fallbackChain.push({
              provider,
              model: model.trim(),
              reason: `Fallback ${index + 1}`
            });
          }
        });
        console.log(`✅ Loaded ${fallbackModels.length} fallback models from AI_MODEL_FALLBACKS`);
      } else {
        console.log('⚠️ AI_MODEL_FALLBACKS is not a valid JSON array');
      }
    }
  } catch (error) {
    console.log('⚠️ Failed to parse AI_MODEL_FALLBACKS JSON:', error);
  }
  
  // If no fallbacks are configured, add default fallbacks
  if (fallbackChain.length === 1) {
    console.log('⚠️ No fallback models configured in AI_MODEL_FALLBACKS. Using default fallbacks.');
    fallbackChain.push(
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', reason: 'Default fallback 1' },
      { provider: 'openai', model: 'gpt-4o', reason: 'Default fallback 2' }
    );
  }
  
  return fallbackChain;
}

// Intelligent fallback system with configurable environment variables
export async function chat(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const primaryModel = options.model || process.env.AI_MODEL || 'gemini-2.5-flash';
  
  // Build fallback chain from environment variables
  const fallbackChain = buildFallbackChain(primaryModel);
  
  console.log(`🔄 Fallback chain: ${fallbackChain.map(f => `${f.model} (${f.provider})`).join(' → ')}`);

  let lastError: any = null;

  for (let i = 0; i < fallbackChain.length; i++) {
    const { provider, model, reason } = fallbackChain[i];
    
    try {
      console.log(`🔄 Attempting ${provider} (${model}) - ${reason}`);
      
      const response = await callProvider(provider, messages, systemPrompt, { ...options, model });
      
      // Log usage for monitoring
      logUsage(provider, model, response.usage.totalTokens);
      
      if (i > 0) {
        console.log(`✅ Fallback successful: ${provider} (${model})`);
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      console.log(`❌ ${provider} failed:`, error.message);
      
      // Check if this is a retryable error
      if (isRetryableError(error)) {
        console.log(`🔄 Retrying with next provider...`);
        continue;
      } else {
        // Non-retryable error (e.g., invalid API key), don't try other providers
        throw error;
      }
    }
  }

  // If we get here, all providers failed
  console.error('🚨 All providers failed');
  throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Helper function to call the appropriate provider
async function callProvider(
  provider: Provider,
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  switch (provider) {
    case 'openai':
      return await callOpenAI(messages, systemPrompt, options);
    case 'anthropic':
      return await callAnthropic(messages, systemPrompt, options);
    case 'google':
      return await callGoogle(messages, systemPrompt, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Check if an error is retryable (rate limits, temporary failures)
function isRetryableError(error: any): boolean {
  // Rate limit errors
  if (error.status === 429) {
    return true;
  }
  
  // Quota exceeded
  if (error.message?.includes('quota') || error.message?.includes('Quota')) {
    return true;
  }
  
  // Rate limit exceeded
  if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
    return true;
  }
  
  // Temporary server errors
  if (error.status === 500 || error.status === 503 || error.status === 502) {
    return true;
  }
  
  // Google-specific errors
  if (error.message?.includes('MAX_TOKENS') || error.message?.includes('RESOURCE_EXHAUSTED')) {
    return true;
  }
  
  // Network errors (might be temporary)
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Non-retryable errors
  if (error.status === 401) {
    return false; // Invalid API key
  }
  
  if (error.status === 400) {
    return false; // Bad request (malformed input)
  }
  
  if (error.status === 403) {
    return false; // Forbidden (API key issues)
  }
  
  // Default to retryable for unknown errors
  return true;
}

// Cost tracking and usage monitoring
export interface UsageStats {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: Date;
}

// Simple cost tracking (approximate costs per 1K tokens)
const COST_PER_1K_TOKENS = {
  'gemini-2.5-flash': 0.0, // Free tier
  'gemini-2.5-pro': 0.0, // Free tier (100 requests/day)
  'claude-haiku-4-5-20251001': 0.00025, // $0.25 per 1M tokens
  'gpt-4o-mini': 0.00015, // $0.15 per 1M tokens
  'gpt-4o': 0.005, // $5 per 1M tokens
};

function calculateCost(model: string, tokens: number): number {
  const costPer1K = (COST_PER_1K_TOKENS as Record<string, number>)[model] || 0.001; // Default fallback
  return (tokens / 1000) * costPer1K;
}

// Log usage for monitoring
function logUsage(provider: string, model: string, tokens: number): void {
  const cost = calculateCost(model, tokens);
  console.log(`💰 Usage: ${provider} (${model}) - ${tokens} tokens - $${cost.toFixed(4)}`);
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