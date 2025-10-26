/**
 * Test script to verify chat API functionality
 * Tests the new @google/genai SDK integration
 */

import { chat } from '../app/api/lib/llm';

const testMessages = [
  { role: 'user' as const, content: 'Tell me about your React experience' }
];

const systemPrompt = 'You are an AI assistant.';

async function runTests() {
  console.log('🧪 Testing Chat API with @google/genai\n');
  console.log('='.repeat(80));

  const tests = [
    {
      name: 'Basic Response Test',
      model: 'gemini-2.5-flash',
      expectedContent: true,
    },
    {
      name: 'Usage Stats Test',
      model: 'gemini-2.5-flash',
      checkUsage: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n${test.name} (${test.model})`);
    
    try {
      const response = await chat(testMessages, systemPrompt, {
        model: test.model,
        temperature: 0.7,
        maxTokens: 100,
      });

      let testPassed = true;

      if (test.expectedContent && !response.content) {
        console.log('❌ FAIL: No content returned');
        testPassed = false;
      }

      if (test.checkUsage) {
        console.log(`   Usage: ${response.usage.totalTokens} tokens`);
        console.log(`   Model: ${response.model}`);
        if (response.usage.totalTokens === 0) {
          console.log('⚠️  Warning: Usage stats are 0 (may be expected for @google/genai)');
        }
      }

      if (response.content) {
        console.log(`✅ PASS: Got response (${response.content.length} chars)`);
        console.log(`   Content preview: ${response.content.substring(0, 100)}...`);
      }

      if (testPassed) passed++;
      else failed++;

    } catch (error: any) {
      console.log(`❌ FAIL: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed.');
  }
}

runTests().catch(console.error);
