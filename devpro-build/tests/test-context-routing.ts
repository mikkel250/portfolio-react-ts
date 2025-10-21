/**
 * Test script to verify knowledge base routing logic
 * Run with: npx tsx tests/test-context-routing.ts
 */

import { getRelevantContext, extractJobTitle } from '../app/api/lib/knowledge-base';

interface TestCase {
  name: string;
  query: string;
  expectedKeywords: string[];
  expectedNotInclude?: string[];
}

const testCases: TestCase[] = [
  // AI/Meta Queries
  {
    name: "AI Experience Question",
    query: "What's your experience with AI?",
    expectedKeywords: ["AI recruiting assistant", "Next.js", "OpenAI"],
  },
  {
    name: "Agentic Workflows Question",
    query: "Can you build agentic workflows?",
    expectedKeywords: ["agentic", "autonomous", "AI", "LLM"],
  },
  {
    name: "LLM Integration Question",
    query: "Do you have LLM integration experience?",
    expectedKeywords: ["GPT", "OpenAI", "prompt engineering"],
  },
  
  // Experience Queries
  {
    name: "Work Experience",
    query: "Tell me about your work experience",
    expectedKeywords: ["Jefferson Health", "SFMOMA", "Software Engineer"],
  },
  {
    name: "Job History",
    query: "Where have you worked?",
    expectedKeywords: ["Jefferson Health", "Google", "companies"],
  },
  
  // Skills Queries
  {
    name: "React Skills",
    query: "Do you know React?",
    expectedKeywords: ["React", "TypeScript", "frontend"],
  },
  {
    name: "Tech Stack",
    query: "What's your tech stack?",
    expectedKeywords: ["TypeScript", "React", "Node.js"],
  },
  
  // Projects Queries
  {
    name: "Portfolio Projects",
    query: "What have you built?",
    expectedKeywords: ["projects", "portfolio", "built"],
  },
  
  // Career Story
  {
    name: "Career Transition",
    query: "Why did you switch to software engineering?",
    expectedKeywords: ["transition", "management", "career"],
  },
  
  // Job Description
  {
    name: "Full Job Description",
    query: `Software Engineer - Full Stack
Location: San Francisco
Responsibilities:
- Build scalable web applications
- Collaborate with product team
Requirements:
- 5+ years of experience
- TypeScript, React, Node.js
Qualifications:
- BS in Computer Science preferred
- Strong communication skills`,
    expectedKeywords: ["experience", "skills", "projects", "career"],
  },
  
  // Recruiter Message
  {
    name: "Recruiter Outreach",
    query: "Hi Mikkel, I'm reaching out about a Full-Stack Engineer role. We're looking for someone with Node.js experience.",
    expectedKeywords: ["experience", "skills"],
    expectedNotInclude: ["This is a recruiter message"], // Should not treat as JD
  },
];

console.log('🧪 Testing Knowledge Base Context Routing\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`Query: "${testCase.query.substring(0, 60)}${testCase.query.length > 60 ? '...' : ''}"`);
  
  try {
    const context = getRelevantContext(testCase.query);
    
    // Check for expected keywords
    const missingKeywords = testCase.expectedKeywords.filter(
      keyword => !context.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Check for keywords that should NOT be included
    const unexpectedlyIncluded = testCase.expectedNotInclude?.filter(
      keyword => context.toLowerCase().includes(keyword.toLowerCase())
    ) || [];
    
    if (missingKeywords.length === 0 && unexpectedlyIncluded.length === 0) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      if (missingKeywords.length > 0) {
        console.log(`   Missing expected: ${missingKeywords.join(', ')}`);
      }
      if (unexpectedlyIncluded.length > 0) {
        console.log(`   Unexpectedly included: ${unexpectedlyIncluded.join(', ')}`);
      }
      failed++;
    }
    
    // Show context length for debugging
    console.log(`   Context length: ${context.length} chars`);
    
    // Show which files were loaded (rough detection)
    const loadedFiles: string[] = [];
    if (context.includes('Jefferson Health') || context.includes('SFMOMA')) loadedFiles.push('experience.md');
    if (context.includes('TypeScript:') || context.includes('Frontend Development')) loadedFiles.push('skills.md');
    if (context.includes('AI recruiting assistant') || context.includes('meta-project')) loadedFiles.push('meta-project.md');
    if (context.includes('Personal Projects') || context.includes('portfolio')) loadedFiles.push('projects.md');
    if (context.includes('career transition') || context.includes('management background')) loadedFiles.push('career-story.md');
    
    console.log(`   Loaded files: ${loadedFiles.join(', ') || 'unknown'}`);
    
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

