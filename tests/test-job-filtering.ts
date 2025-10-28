/**
 * Test script to verify job filtering logic
 * Run with: npx tsx tests/test-job-filtering.ts
 */

import { filterJobCriteria } from '../lib/input-filter';

interface TestCase {
  name: string;
  query: string;
  shouldProceed: boolean;
  expectedReason?: string;
}

const testCases: TestCase[] = [
  {
    name: "Work Authorization Question",
    query: "Are you authorized to work in the US? Need visa sponsorship?",
    shouldProceed: false,
    expectedReason: "work_authorization"
  },
  {
    name: "Visa Sponsorship Question",
    query: "Do you need visa sponsorship?",
    shouldProceed: false,
    expectedReason: "work_authorization"
  },
  {
    name: "Salary Question",
    query: "What's your salary expectation?",
    shouldProceed: false,
    expectedReason: "salary_query"
  },
  {
    name: "Compensation Question",
    query: "What compensation range are you looking for?",
    shouldProceed: false,
    expectedReason: "salary_query"
  },
  {
    name: "Regular Tech Question",
    query: "Do you know React?",
    shouldProceed: true
  },
  {
    name: "Job Description (should pass to LLM)",
    query: `Software Engineer Role

Responsibilities:
- Build scalable web applications
- Collaborate with product team
Requirements:
- 5+ years of experience
- TypeScript, React, Node.js`,
    shouldProceed: true
  },
  {
    name: "Obvious Non-Matching Role - Doctor",
    query: `Medical Doctor Position

We're looking for a board-certified physician to join our practice.
Requirements:
- MD degree
- License to practice medicine`,
    shouldProceed: false,
    expectedReason: "role_mismatch"
  },
  {
    name: "Obvious Non-Matching Role - Teacher",
    query: `High School Teacher Position

Seeking an experienced educator to teach mathematics.
Requirements:
- Teaching certification
- Bachelor's in Education`,
    shouldProceed: false,
    expectedReason: "role_mismatch"
  }
];

console.log('🧪 Testing Job Filtering Logic\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`Query: "${testCase.query.substring(0, 60)}${testCase.query.length > 60 ? '...' : ''}"`);
  
  try {
    const result = filterJobCriteria(testCase.query);
    
    const shouldProceedMatches = result.shouldProceed === testCase.shouldProceed;
    const reasonMatches = testCase.expectedReason ? result.reason === testCase.expectedReason : true;
    
    if (shouldProceedMatches && reasonMatches) {
      console.log('✅ PASS');
      console.log(`   Result: shouldProceed=${result.shouldProceed}, reason=${result.reason || 'none'}`);
      passed++;
    } else {
      console.log('❌ FAIL');
      console.log(`   Expected: shouldProceed=${testCase.shouldProceed}, reason=${testCase.expectedReason || 'any'}`);
      console.log(`   Got: shouldProceed=${result.shouldProceed}, reason=${result.reason || 'none'}`);
      failed++;
    }
    
    if (result.response) {
      console.log(`   Response preview: ${result.response.substring(0, 80)}...`);
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   ${error}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed!');
} else {
  console.log('⚠️  Some tests failed. Review the output above.');
}

