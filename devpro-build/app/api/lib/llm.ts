import OpenAI from 'openai';

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

/**
 * Send a chat completion request to OpenAI
 * 
 * @param messages - Array of chat messages (user messages, not including system prompt)
 * @param systemPrompt - The system prompt to use (built by buildSystemPrompt())
 * @param options - Optional configuration (temperature, maxTokens, model)
 * @returns Response with content and usage stats
 */
export async function chat(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  try {
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
  } catch (error: any) {
    // Enhanced error handling with useful messages
    console.error('OpenAI API Error:', error);

    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Check your .env.local file.');
    }

    if (error.status === 429) {
      throw new Error('Rate limit exceeded or insufficient quota. Add credits to your OpenAI account.');
    }

    if (error.status === 500 || error.status === 503) {
      throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error. Check your internet connection.');
    }

    // Generic error with original message
    throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
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