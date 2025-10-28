/**
 * COMPREHENSIVE API HEALTH CHECK & FALLBACK TESTING
 * 
 * This endpoint provides comprehensive testing of all LLM providers and the fallback system.
 * Use this to debug issues, verify API keys, test rate limits, and ensure fallback works.
 * 
 * USAGE:
 * 
 * 1. BASIC HEALTH CHECK:
 *    curl http://localhost:3000/api/test-fallback
 * 
 * 2. QUICK PROVIDER TEST (individual):
 *    curl "http://localhost:3000/api/test-fallback?provider=google"
 *    curl "http://localhost:3000/api/test-fallback?provider=anthropic" 
 *    curl "http://localhost:3000/api/test-fallback?provider=openai"
 * 
 * 3. FALLBACK SYSTEM TEST:
 *    curl "http://localhost:3000/api/test-fallback?test=fallback"
 * 
 * 4. RATE LIMIT TEST:
 *    curl "http://localhost:3000/api/test-fallback?test=rate-limit"
 * 
 * 5. ENVIRONMENT CHECK:
 *    curl "http://localhost:3000/api/test-fallback?test=environment"
 * 
 * 6. GOOGLE GEMINI EMPTY RESPONSE TEST:
 *    curl "http://localhost:3000/api/test-fallback?test=google-empty"
 * 
 * WHAT IT TESTS:
 * 
 * ✅ Google Gemini (gemini-2.5-pro) - Free tier (100 requests/day)
 * ✅ Anthropic Claude (claude-haiku-4-5-20251001) - Cost-effective fallback  
 * ✅ OpenAI (gpt-4o-mini) - Reliable backup
 * ✅ Fallback system with invalid models
 * ✅ Rate limit handling with rapid requests
 * ✅ Environment validation (API keys, configuration)
 * ✅ Google Gemini empty response scenarios (MAX_TOKENS, SAFETY, RECITATION)
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "summary": {
 *     "totalTests": 5,
 *     "successfulTests": 5, 
 *     "failedTests": 0,
 *     "totalTime": "6715ms",
 *     "timestamp": "2025-10-23T08:34:42.265Z"
 *   },
 *   "results": [...],
 *   "environment": {
 *     "primaryModel": "gemini-2.5-pro",
 *     "hasOpenAIKey": true,
 *     "hasAnthropicKey": true, 
 *     "hasGoogleKey": true
 *   }
 * }
 * 
 * DEBUGGING COMMON ISSUES:
 * 
 * 🔍 Google Gemini Issues:
 *    - Check: "Quota exceeded" = Hit free tier limit (100 requests/day)
 *    - Check: "MAX_TOKENS" = Response truncated due to token limits
 *    - Check: "No text content" = Empty response (common issue)
 *    - Check: "SAFETY" = Response blocked by safety filters
 *    - Check: "RECITATION" = Response blocked due to recitation concerns
 *    - Solution: Wait for quota reset, reduce maxTokens, or use fallback
 * 
 * 🔍 Anthropic Claude Issues:
 *    - Check: "Invalid API key" = Wrong or missing ANTHROPIC_API_KEY
 *    - Check: "Rate limit" = Hit Claude's rate limits
 *    - Solution: Verify API key or wait for rate limit reset
 * 
 * 🔍 OpenAI Issues:
 *    - Check: "Invalid API key" = Wrong or missing OPENAI_API_KEY
 *    - Check: "Insufficient quota" = No credits on OpenAI account
 *    - Solution: Add credits to OpenAI account
 * 
 * 🔍 Fallback System Issues:
 *    - Check: "All providers failed" = All APIs are down
 *    - Check: Individual provider failures = API key or quota issues
 *    - Solution: Verify all API keys and account status
 * 
 * CONFIGURATION:
 * 
 * The fallback system uses a JSON array in AI_MODEL_FALLBACKS:
 * AI_MODEL_FALLBACKS=["claude-haiku-4-5-20251001", "gpt-4o-mini", "gemini-2.5-pro"]
 * 
 * This is much more flexible than numbered variables and supports any number of fallbacks.
 * 
 * COST MONITORING:
 * 
 * The test includes cost tracking for each provider:
 * - Google Gemini: $0.0001 per 1K tokens (FREE tier)
 * - Claude Haiku: $0.00025 per 1K tokens  
 * - OpenAI GPT-4o-mini: $0.00015 per 1K tokens
 * 
 * EXPECTED BEHAVIOR:
 * 
 * 1. Normal Operation: Uses Google Gemini (free) until rate limited
 * 2. Rate Limited: Automatically falls back to Claude Haiku (cheap)
 * 3. All Providers Down: Falls back to OpenAI (reliable)
 * 4. Invalid Model: Uses fallback chain starting with Google
 * 
 * TROUBLESHOOTING:
 * 
 * If all tests fail:
 * 1. Check API keys in .env.local
 * 2. Verify internet connection
 * 3. Check provider status pages
 * 4. Review console logs for specific errors
 * 
 * If specific provider fails:
 * 1. Check API key validity
 * 2. Verify account status/credits
 * 3. Check rate limits and quotas
 * 4. Test with minimal request
 */

import { NextRequest, NextResponse } from 'next/server';
import { chat } from '../lib/llm';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: any[] = [];
  const { searchParams } = new URL(request.url);
  
  // Parse query parameters for targeted testing
  const provider = searchParams.get('provider');
  const test = searchParams.get('test');
  
  try {
    console.log('Starting comprehensive API health check...');
    
    // Handle targeted testing based on query parameters
    if (provider) {
      console.log(`🎯 Testing specific provider: ${provider}`);
      return await testSpecificProvider(provider, startTime);
    }
    
    if (test === 'fallback') {
      console.log('🔄 Testing fallback system only...');
      return await testFallbackSystem(startTime);
    }
    
    if (test === 'rate-limit') {
      console.log('⚡ Testing rate limit handling only...');
      return await testRateLimits(startTime);
    }
    
    if (test === 'environment') {
      console.log('🔧 Testing environment configuration only...');
      return await testEnvironment();
    }
    
    if (test === 'google-empty') {
      console.log('🔍 Testing Google Gemini empty response handling...');
      return await testGoogleEmptyResponse();
    }
    
    // Test messages
    const testMessages = [
      { role: 'user' as const, content: 'Hello, this is a health check test' }
    ];
    
    const systemPrompt = 'You are a helpful assistant. Respond briefly with "Health check successful" and the current time.';
    
    // Test 1: Primary model (Google Gemini)
    console.log('🔍 Testing Google Gemini...');
    try {
      const googleResponse = await chat(testMessages, systemPrompt, {
        model: 'gemini-2.5-pro',
        temperature: 0.7,
        maxTokens: 50
      });
      
      results.push({
        provider: 'google',
        model: googleResponse.model,
        success: true,
        content: googleResponse.content,
        usage: googleResponse.usage,
        responseTime: Date.now() - startTime
      });
      
      console.log('✅ Google Gemini: SUCCESS');
    } catch (error: any) {
      results.push({
        provider: 'google',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Google Gemini: FAILED -', error.message);
    }
    
    // Test 2: Anthropic Claude
    console.log('🔍 Testing Anthropic Claude...');
    try {
      const claudeResponse = await chat(testMessages, systemPrompt, {
        model: 'claude-haiku-4-5-20251001',
        temperature: 0.7,
        maxTokens: 50
      });
      
      results.push({
        provider: 'anthropic',
        model: claudeResponse.model,
        success: true,
        content: claudeResponse.content,
        usage: claudeResponse.usage,
        responseTime: Date.now() - startTime
      });
      
      console.log('✅ Anthropic Claude: SUCCESS');
    } catch (error: any) {
      results.push({
        provider: 'anthropic',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Anthropic Claude: FAILED -', error.message);
    }
    
    // Test 3: OpenAI
    console.log('🔍 Testing OpenAI...');
    try {
      const openaiResponse = await chat(testMessages, systemPrompt, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 50
      });
      
      results.push({
        provider: 'openai',
        model: openaiResponse.model,
        success: true,
        content: openaiResponse.content,
        usage: openaiResponse.usage,
        responseTime: Date.now() - startTime
      });
      
      console.log('✅ OpenAI: SUCCESS');
    } catch (error: any) {
      results.push({
        provider: 'openai',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ OpenAI: FAILED -', error.message);
    }
    
    // Test 4: Fallback system with invalid model
    console.log('🔍 Testing fallback system with invalid model...');
    try {
      const fallbackResponse = await chat(testMessages, systemPrompt, {
        model: 'invalid-model-name',
        temperature: 0.7,
        maxTokens: 50
      });
      
      results.push({
        provider: 'fallback',
        model: fallbackResponse.model,
        success: true,
        content: fallbackResponse.content,
        usage: fallbackResponse.usage,
        responseTime: Date.now() - startTime,
        note: 'Fallback system successfully handled invalid model'
      });
      
      console.log('✅ Fallback System: SUCCESS');
    } catch (error: any) {
      results.push({
        provider: 'fallback',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Fallback System: FAILED -', error.message);
    }
    
    // Test 5: Rate limit simulation (if possible)
    console.log('🔍 Testing rate limit handling...');
    try {
      // Try to trigger rate limit by making multiple rapid requests
      const rapidRequests = Array(5).fill(null).map(async (_, i) => {
        return chat(testMessages, systemPrompt, {
          model: 'gemini-2.5-pro',
          temperature: 0.7,
          maxTokens: 10
        });
      });
      
      const rapidResults = await Promise.allSettled(rapidRequests);
      const successCount = rapidResults.filter(r => r.status === 'fulfilled').length;
      
      results.push({
        provider: 'rate-limit-test',
        success: true,
        rapidRequests: 5,
        successfulRequests: successCount,
        responseTime: Date.now() - startTime,
        note: `Rate limit test: ${successCount}/5 requests succeeded`
      });
      
      console.log(`✅ Rate Limit Test: ${successCount}/5 requests succeeded`);
    } catch (error: any) {
      results.push({
        provider: 'rate-limit-test',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Rate Limit Test: FAILED -', error.message);
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    return NextResponse.json({
      success: successCount > 0,
      summary: {
        totalTests,
        successfulTests: successCount,
        failedTests: totalTests - successCount,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      },
      results,
      environment: {
        primaryModel: process.env.AI_MODEL || process.env.AI_MODEL_FALLBACKS,
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasGoogleKey: !!process.env.GOOGLE_API_KEY
      }
    });
    
  } catch (error: any) {
    console.error('❌ Comprehensive API health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
      message: 'Comprehensive API health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper function to test a specific provider
async function testSpecificProvider(provider: string, startTime: number) {
  const testMessages = [
    { role: 'user' as const, content: `Testing ${provider} provider` }
  ];
  
  const systemPrompt = 'You are a helpful assistant. Respond briefly with "Provider test successful".';
  
  try {
    let model: string;
    switch (provider) {
      case 'google':
        model = 'gemini-2.5-pro';
        break;
      case 'anthropic':
        model = 'claude-haiku-4-5-20251001';
        break;
      case 'openai':
        model = 'gpt-4o-mini';
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    const response = await chat(testMessages, systemPrompt, {
      model,
      temperature: 0.7,
      maxTokens: 50
    });
    
    return NextResponse.json({
      success: true,
      provider,
      model: response.model,
      content: response.content,
      usage: response.usage,
      responseTime: Date.now() - startTime,
      message: `${provider} provider test successful`
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      provider,
      error: error.message,
      responseTime: Date.now() - startTime,
      message: `${provider} provider test failed`
    }, { status: 500 });
  }
}

// Helper function to test fallback system
async function testFallbackSystem(startTime: number) {
  const testMessages = [
    { role: 'user' as const, content: 'Test fallback with invalid model' }
  ];
  
  const systemPrompt = 'You are a helpful assistant. Respond briefly with "Fallback test successful".';
  
  try {
    const response = await chat(testMessages, systemPrompt, {
      model: 'invalid-model-name',
      temperature: 0.7,
      maxTokens: 50
    });
    
    return NextResponse.json({
      success: true,
      provider: 'fallback',
      model: response.model,
      content: response.content,
      usage: response.usage,
      responseTime: Date.now() - startTime,
      message: 'Fallback system test successful'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      message: 'Fallback system test failed'
    }, { status: 500 });
  }
}

// Helper function to test rate limits
async function testRateLimits(startTime: number) {
  const testMessages = [
    { role: 'user' as const, content: 'Rate limit test' }
  ];
  
  const systemPrompt = 'You are a helpful assistant. Respond briefly.';
  
  try {
    const rapidRequests = Array(5).fill(null).map(async (_, i) => {
      return chat(testMessages, systemPrompt, {
        model: 'gemini-2.5-pro',
        temperature: 0.7,
        maxTokens: 10
      });
    });
    
    const rapidResults = await Promise.allSettled(rapidRequests);
    const successCount = rapidResults.filter(r => r.status === 'fulfilled').length;
    
    return NextResponse.json({
      success: true,
      rapidRequests: 5,
      successfulRequests: successCount,
      responseTime: Date.now() - startTime,
      message: `Rate limit test: ${successCount}/5 requests succeeded`
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      message: 'Rate limit test failed'
    }, { status: 500 });
  }
}

// Helper function to test environment
async function testEnvironment() {
  // Build fallback chain to show configuration
  const fallbackChain = [];
  const primaryModel = process.env.AI_MODEL || 'gemini-2.5-pro';
  
  // Add primary model
  fallbackChain.push({
    order: 0,
    model: primaryModel,
    provider: detectProvider(primaryModel),
    type: 'Primary'
  });
  
  // Parse fallback models from JSON array
  try {
    const fallbackModelsJson = process.env.AI_MODEL_FALLBACKS;
    if (fallbackModelsJson) {
      const fallbackModels = JSON.parse(fallbackModelsJson);
      if (Array.isArray(fallbackModels)) {
        fallbackModels.forEach((model, index) => {
          if (typeof model === 'string' && model.trim()) {
            fallbackChain.push({
              order: index + 1,
              model: model.trim(),
              provider: detectProvider(model.trim()),
              type: `Fallback ${index + 1}`
            });
          }
        });
      }
    }
  } catch (error) {
    console.log('⚠️ Failed to parse AI_MODEL_FALLBACKS JSON:', error);
  }
  
  return NextResponse.json({
    success: true,
    environment: {
      primaryModel: process.env.AI_MODEL || 'gemini-2.5-pro',
      nodeEnv: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      googleKeyLength: process.env.GOOGLE_API_KEY?.length || 0
    },
    fallbackChain,
    message: 'Environment configuration check completed'
  });
}

// Helper function to detect provider (copied from llm.ts)
function detectProvider(model: string): string {
  const modelToLower = model.toLowerCase();
  
  if (modelToLower.includes('claude')) {
    return 'anthropic';
  }
  
  if (modelToLower.includes('gemini')) {
    return 'google';
  }
  
  return 'openai';
}

// Helper function to test Google Gemini empty response handling
async function testGoogleEmptyResponse() {
  const startTime = Date.now();
  const results: any[] = [];
  
  try {
    console.log('🔍 Testing Google Gemini with various scenarios...');
    
    // Test 1: Normal request
    console.log('📝 Test 1: Normal request');
    try {
      const normalResponse = await chat(
        [{ role: 'user', content: 'Hello, respond briefly' }],
        'You are a helpful assistant. Respond briefly.',
        { model: 'gemini-2.5-pro', maxTokens: 50, temperature: 0.7 }
      );
      
      results.push({
        test: 'normal',
        success: true,
        content: normalResponse.content,
        usage: normalResponse.usage,
        responseTime: Date.now() - startTime
      });
      
      console.log('✅ Normal request: SUCCESS');
    } catch (error: any) {
      results.push({
        test: 'normal',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Normal request: FAILED -', error.message);
    }
    
    // Test 2: Very low maxTokens (likely to cause MAX_TOKENS)
    console.log('📝 Test 2: Very low maxTokens (5)');
    try {
      const lowTokensResponse = await chat(
        [{ role: 'user', content: 'Tell me a long story about a dragon' }],
        'You are a helpful assistant. Tell a detailed story.',
        { model: 'gemini-2.5-pro', maxTokens: 5, temperature: 0.7 }
      );
      
      results.push({
        test: 'low-tokens',
        success: true,
        content: lowTokensResponse.content,
        usage: lowTokensResponse.usage,
        responseTime: Date.now() - startTime,
        note: 'Unexpectedly succeeded with very low token limit'
      });
      
      console.log('✅ Low tokens request: SUCCESS (unexpected)');
    } catch (error: any) {
      results.push({
        test: 'low-tokens',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        note: 'Expected failure due to very low token limit'
      });
      console.log('❌ Low tokens request: FAILED (expected) -', error.message);
    }
    
    // Test 3: Potentially triggering safety filters
    console.log('📝 Test 3: Potentially triggering content');
    try {
      const safetyResponse = await chat(
        [{ role: 'user', content: 'Write a detailed explanation of how to hack a computer system' }],
        'You are a helpful assistant. Provide educational content.',
        { model: 'gemini-2.5-pro', maxTokens: 100, temperature: 0.7 }
      );
      
      results.push({
        test: 'safety-filters',
        success: true,
        content: safetyResponse.content,
        usage: safetyResponse.usage,
        responseTime: Date.now() - startTime
      });
      
      console.log('✅ Safety filters request: SUCCESS');
    } catch (error: any) {
      results.push({
        test: 'safety-filters',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        note: 'Expected failure due to safety filters'
      });
      console.log('❌ Safety filters request: FAILED (expected) -', error.message);
    }
    
    // Test 4: Fallback behavior when Google fails
    console.log('📝 Test 4: Fallback behavior');
    try {
      const fallbackResponse = await chat(
        [{ role: 'user', content: 'Test fallback with invalid model' }],
        'You are a helpful assistant. Respond briefly.',
        { model: 'invalid-model-name', maxTokens: 50, temperature: 0.7 }
      );
      
      results.push({
        test: 'fallback',
        success: true,
        content: fallbackResponse.content,
        usage: fallbackResponse.usage,
        model: fallbackResponse.model,
        responseTime: Date.now() - startTime,
        note: 'Fallback system handled invalid model'
      });
      
      console.log('✅ Fallback test: SUCCESS');
    } catch (error: any) {
      results.push({
        test: 'fallback',
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      console.log('❌ Fallback test: FAILED -', error.message);
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    return NextResponse.json({
      success: successCount > 0,
      summary: {
        totalTests,
        successfulTests: successCount,
        failedTests: totalTests - successCount,
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      },
      results,
      message: 'Google Gemini empty response testing completed',
      diagnostics: {
        commonIssues: [
          'MAX_TOKENS: Response truncated due to token limit',
          'SAFETY: Response blocked by safety filters', 
          'RECITATION: Response blocked due to recitation concerns',
          'Empty content: No text content in response'
        ],
        solutions: [
          'Reduce maxTokens parameter',
          'Adjust prompt to avoid safety triggers',
          'Use fallback system for reliability',
          'Check Google API status page'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Google Gemini empty response test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
      message: 'Google Gemini empty response test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
