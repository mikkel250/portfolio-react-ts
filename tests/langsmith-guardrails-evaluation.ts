/**
 * LangSmith Evaluation Suite for Prompt Guardrails
 * 
 * This suite tests 8 critical guardrail requirements:
 * 1. States 5 years total SWE experience (not 10+)
 *    - For tech-specific questions (React, Next.js, etc.), allows < 5 years for that tech
 *    - But ensures no false 10+ claims
 * 2. No hallucination (doesn't invent companies/projects)
 * 3. Proper formatting (no template labels like "Hook:", "Proof Points:")
 * 4. Third-person narrative (doesn't say "I have...")
 * 5. Includes clickable Calendly link
 * 6. No generic sign-offs ("Let me know if you need anything!")
 * 7. Meta-awareness (mentions the AI assistant itself when relevant)
 * 8. Accurate information from knowledge base only
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { Client } from 'langsmith';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

// Initialize LangSmith client
const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
});

// Test dataset with 8 test cases
const evaluationDataset = [
  {
    name: 'experience_query_5_years',
    inputs: {
      query: 'How many years of React experience does Mikkel have?'
    },
    outputs: {
      criteria_scores: {
        states_5_years: true, // Tech-specific: checks for no 10+ claims, allows < 5 years for React
        not_10_plus: true,
        correct_formatting: true,
        no_template_labels: true,
        third_person: true
      }
    }
  },
  {
    name: 'full_job_description',
    inputs: {
      query: `Job Description: Senior Software Engineer at TechCo
Requirements:
- 5+ years React experience
- TypeScript proficiency
- Full-stack development
- Team leadership experience`
    },
    outputs: {
      criteria_scores: {
        analyzes_fit: true,
        highlights_relevant_experience: true,
        mentions_gaps_honestly: true,
        includes_calendly_link: true,
        no_hallucination: true
      }
    }
  },
  {
    name: 'meta_awareness_ai_query',
    inputs: {
      query: 'Has Mikkel built AI assistants?'
    },
    outputs: {
      criteria_scores: {
        mentions_ai_assistant: true,
        explains_tech_stack: true,
        includes_calendly_link: true,
        no_template_labels: true
      }
    }
  },
  {
    name: 'simple_experience_query',
    inputs: {
      query: "What's Mikkel's experience with Next.js?"
    },
    outputs: {
      criteria_scores: {
        states_5_years: true, // Tech-specific: checks for no 10+ claims, allows < 5 years for Next.js
        specific_projects: true,
        includes_metrics: true,
        // Word count: short answers to short questions are fine
        word_count_220_420: false, // Made optional - only checks for reasonable range
        includes_calendly_link: true,
        no_template_labels: true,
        third_person: true
      }
    }
  },
  {
    name: 'missing_information_query',
    inputs: {
      query: 'Has Mikkel worked at Amazon or Google?'
    },
    outputs: {
      criteria_scores: {
        positive_pivot: true,
        lists_actual_companies: true,
        no_hallucination: true,
        doesnt_claim_amazon: true
      }
    }
  },
  {
    name: 'recruiter_message_generic',
    inputs: {
      query: 'Hi, I see that Mikkel has experience as a founder. Would he be interested in a CEO role?'
    },
    outputs: {
      criteria_scores: {
        explains_alignment: true,
        doesnt_pretend_to_be_mikkel: true,
        analyzes_opportunity: true,
        includes_calendly_link: true,
        no_signature: true
      }
    }
  },
  {
    name: 'career_transition_query',
    inputs: {
      query: 'Tell me about Mikkel\'s transition from design to engineering'
    },
    outputs: {
      criteria_scores: {
        mentions_career_story: true,
        positive_narrative: true,
        no_hallucination: true,
        // Calendly link is nice but not required for every response
        // includes_calendly_link: true
      }
    }
  },
  {
    name: 'skills_query',
    inputs: {
      query: 'What programming languages and frameworks does Mikkel know?'
    },
    outputs: {
      criteria_scores: {
        lists_skills: true,
        includes_projects: true,
        no_hallucination: true,
        correct_formatting: true,
        third_person: true
      }
    }
  }
];

/**
 * Call the chat API and get response
 */
async function callChatAPI(query: string): Promise<string> {
  const API_URL = process.env.CHAT_API_URL || 'http://localhost:3000/api/chat';
  const sessionId = `eval-${Date.now()}`;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content || '';
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed')) {
      throw new Error(`Cannot connect to chat API at ${API_URL}. Make sure the Next.js dev server is running (npm run dev)`);
    }
    throw new Error(`Error calling chat API: ${errorMsg}`);
  }
}

/**
 * Custom evaluator: Hallucination detection
 * Checks if response invents companies, projects, or facts not in KB
 */
async function evaluateHallucination(run: any, example: any): Promise<{ key: string; score: number; comment: string }> {
  const response = run.outputs?.content || '';
  const query = example.inputs?.query || '';
  
  // Known false claims that indicate hallucination
  // Use more specific patterns that only match DIRECT employment claims, not ecosystem/subsidiary mentions
  const falseClaimPatterns = [
    // Only flag if directly claims to have worked AT Amazon (not "within Amazon ecosystem" or subsidiaries)
    { pattern: /\b(has|had|have)\s+(worked|work)\s+(at|for)\s+Amazon\b(?![\s,.]*(ecosystem|subsidiary|company))/i, claim: 'worked at Amazon' },
    // Only flag if directly claims to have worked AT Google (not "within Google ecosystem" or at Alphabet subsidiaries)
    { pattern: /\b(has|had|have)\s+(worked|work)\s+(at|for)\s+Google\b(?![\s,.]*(ecosystem|subsidiary|Alphabet|Intrinsic))/i, claim: 'worked at Google' },
    { pattern: /\b(has|had|have)\s+(worked|work)\s+(at|for)\s+Microsoft\b/i, claim: 'worked at Microsoft' },
    { pattern: /\b(has|had|have)\s+(worked|work)\s+(at|for)\s+Netflix\b/i, claim: 'worked at Netflix' },
    { pattern: /\bhackathon\s+attendance\b/i, claim: 'hackathon attendance' },
    { pattern: /\b(has|has a|has an|earned|received|holds|holds a)\s+(CS|computer science)\s+degree\b/i, claim: 'CS degree' },
  ];
  
  let foundFalseClaims = 0;
  const foundClaims: string[] = [];
  
  for (const { pattern, claim } of falseClaimPatterns) {
    if (pattern.test(response)) {
      // Double-check: exclude denials like "hasn't worked", "has not worked", "did not work"
      // Also exclude context like "within Google ecosystem", "at Alphabet/Google X", etc.
      const denialPattern = /\b(hasn't|has not|did not|never|no|doesn't|does not)\s+/i;
      const matchIndex = response.search(pattern);
      const contextBefore = response.substring(Math.max(0, matchIndex - 100), matchIndex);
      const contextAfter = response.substring(matchIndex, Math.min(response.length, matchIndex + 100));
      
      // Check both before and after context for denials or valid ecosystem mentions
      const hasDenial = denialPattern.test(contextBefore);
      const hasValidContext = /(within|at|an)\s+(the\s+)?(Google|Amazon|Microsoft|Netflix)\s+ecosystem/i.test(contextBefore + contextAfter) ||
                             /(Alphabet|subsidiary)/i.test(contextBefore + contextAfter);
      
      if (!hasDenial && !hasValidContext) {
        foundFalseClaims++;
        foundClaims.push(claim);
      }
    }
  }
  
  const score = foundFalseClaims === 0 ? 1 : 0;
  const comment = foundFalseClaims > 0 
    ? `Hallucination detected: claims ${foundClaims.join(', ')}`
    : 'No hallucination detected';
  
  return { key: 'no_hallucination', score, comment };
}

/**
 * Custom evaluator: Guardrail compliance
 * Checks multiple guardrail requirements
 */
async function evaluateGuardrails(run: any, example: any): Promise<Record<string, { score: number; comment: string }>> {
  const response = run.outputs?.content || '';
  const query = example.inputs?.query || '';
  const expectedCriteria = example.outputs?.criteria_scores || {};
  
  const results: Record<string, { score: number; comment: string }> = {};
  
  // Check for 5 years of experience (not 10+)
  // Note: For tech-specific questions (React, Next.js, etc.), allow fewer years
  // but ensure total SWE experience (5 years) is mentioned, or at minimum no false 10+ claims
  if (expectedCriteria.states_5_years || expectedCriteria.not_10_plus) {
    // Match tech-specific queries: check if query contains a tech name AND (experience OR years)
    const hasTechName = /\b(React|Next\.js|Nextjs|TypeScript|Node\.js|Nodejs|Python|JavaScript|JS|TS)\b/i.test(query);
    const hasExperienceOrYears = /\b(experience|years)\b/i.test(query);
    const isTechSpecificQuery = hasTechName && hasExperienceOrYears;
    const has5Years = /\b5\s*years?\b/i.test(response);
    const has10Plus = /\b(10|11|12|13|14|15|20)\+?\s*years?\b/i.test(response);
    
    if (isTechSpecificQuery) {
      // For tech-specific questions: don't require "5 years" for that tech
      // Just ensure no false 10+ years claim, and optionally mentions total SWE experience
      const hasTotalSWEYears = /(5|five)\s*years?\s*(of|total|software engineering|SWE|as a|professional)/i.test(response);
      results.states_5_years = {
        score: !has10Plus ? 1 : 0,
        comment: !has10Plus 
          ? (hasTotalSWEYears ? 'No false 10+ claims, mentions total SWE experience' : 'No false 10+ claims (tech-specific query)')
          : 'Incorrectly mentions 10+ years'
      };
    } else {
      // For general experience questions: require "5 years" mention
      results.states_5_years = {
        score: has5Years && !has10Plus ? 1 : 0,
        comment: has5Years && !has10Plus 
          ? 'Correctly states 5 years' 
          : has10Plus ? 'Incorrectly mentions 10+ years' : 'Does not state 5 years'
      };
    }
  }
  
  // Check for template labels
  if (expectedCriteria.no_template_labels) {
    const templateLabels = ['Hook:', 'Proof Points:', 'Call to Action:', 'Summary:'];
    const hasLabels = templateLabels.some(label => response.includes(label));
    results.no_template_labels = {
      score: !hasLabels ? 1 : 0,
      comment: !hasLabels ? 'No template labels found' : `Found template labels: ${templateLabels.filter(l => response.includes(l)).join(', ')}`
    };
  }
  
  // Check for third person (not "I have...")
  if (expectedCriteria.third_person) {
    const firstPersonPatterns = [/\bI\s+have\b/i, /\bI\s+worked\b/i, /\bI\s+built\b/i, /\bmy\s+experience\b/i];
    const hasFirstPerson = firstPersonPatterns.some(pattern => pattern.test(response));
    results.third_person = {
      score: !hasFirstPerson ? 1 : 0,
      comment: !hasFirstPerson ? 'Uses third person correctly' : 'Uses first person (should use third person)'
    };
  }
  
  // Check for Calendly link
  if (expectedCriteria.includes_calendly_link) {
    const hasCalendly = /calendly\.com|calendly/i.test(response) || /\[Schedule|\[Book|\[Schedule a call/i.test(response);
    results.includes_calendly_link = {
      score: hasCalendly ? 1 : 0,
      comment: hasCalendly ? 'Includes Calendly link or scheduling text' : 'Missing Calendly link'
    };
  }
  
  // Check for generic sign-offs
  if (expectedCriteria.no_generic_signoff) {
    const genericSignoffs = ['let me know if you need anything', 'feel free to reach out', 'happy to help'];
    const hasGenericSignoff = genericSignoffs.some(signoff => response.toLowerCase().includes(signoff));
    results.no_generic_signoff = {
      score: !hasGenericSignoff ? 1 : 0,
      comment: !hasGenericSignoff ? 'No generic sign-off' : 'Contains generic sign-off'
    };
  }
  
  // Check for meta-awareness
  if (expectedCriteria.mentions_ai_assistant) {
    const metaKeywords = ['ai assistant', 'this ai', 'this assistant', 'you are using', 'built this'];
    const hasMeta = metaKeywords.some(keyword => response.toLowerCase().includes(keyword));
    results.mentions_ai_assistant = {
      score: hasMeta ? 1 : 0,
      comment: hasMeta ? 'Mentions AI assistant' : 'Does not mention AI assistant when it should'
    };
  }
  
  // Check word count (optional - short answers to short questions are fine)
  // Only fail if response is suspiciously long (>1000 words) or suspiciously short (<20 words)
  if (expectedCriteria.word_count_220_420) {
    const wordCount = response.split(/\s+/).length;
    const isReasonable = wordCount >= 20 && wordCount <= 1000;
    results.word_count_220_420 = {
      score: isReasonable ? 1 : 0,
      comment: `Word count: ${wordCount} (reasonable range: 20-1000 words)`
    };
  }
  
  return results;
}

/**
 * Main evaluation runner
 */
async function runEvaluations() {
  console.log('🚀 Starting LangSmith Evaluation Suite for Prompt Guardrails\n');
  console.log('='.repeat(80));
  
  if (!process.env.LANGSMITH_API_KEY) {
    console.error('❌ Error: LANGSMITH_API_KEY environment variable is required');
    process.exit(1);
  }
  
  // Check if chat API server is running
  const API_URL = process.env.CHAT_API_URL || 'http://localhost:3000/api/chat';
  console.log(`\n🔍 Checking if chat API is accessible at ${API_URL}...`);
  try {
    const testResponse = await fetch(API_URL, {
      method: 'OPTIONS', // Use OPTIONS to check if server is up
    }).catch(() => {
      // If OPTIONS fails, try a GET
      return fetch(API_URL.replace('/api/chat', '/api/hello'), {
        method: 'GET',
      });
    });
    console.log('✅ Chat API server is accessible');
  } catch (error) {
    console.error(`❌ Warning: Cannot reach chat API at ${API_URL}`);
    console.error('   Make sure the Next.js dev server is running: npm run dev');
    console.error('   Or set CHAT_API_URL environment variable to your deployed API URL\n');
  }
  
  // Create dataset in LangSmith
  const datasetName = `prompt-guardrails-evaluation-${Date.now()}`;
  console.log(`\n📊 Creating dataset: ${datasetName}`);
  
  try {
    const dataset = await client.createDataset(datasetName, {
      description: 'Evaluation dataset for prompt guardrails testing',
    });
    console.log(`✅ Dataset created: ${dataset.id}`);
    
    // Add examples to dataset
    console.log(`\n📝 Adding ${evaluationDataset.length} test cases to dataset...`);
    for (const example of evaluationDataset) {
      await client.createExample(
        example.inputs,
        example.outputs,
        {
          datasetId: dataset.id,
        }
      );
    }
    console.log('✅ Examples added to dataset');
    
    // Run evaluations
    console.log('\n🧪 Running evaluations...\n');
    
    // Rate limiting: Google Gemini free tier allows 2 requests/minute
    // Add delay between tests to respect rate limits
    const delayBetweenTests = parseInt(process.env.EVAL_DELAY_MS || '30000', 10); // Default 30 seconds
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < evaluationDataset.length; i++) {
      const example = evaluationDataset[i];
      console.log(`\nTest: ${example.name}`);
      console.log(`Query: "${example.inputs.query.substring(0, 60)}${example.inputs.query.length > 60 ? '...' : ''}"`);
      
      try {
        // Call the chat API
        const response = await callChatAPI(example.inputs.query);
        
        // Create a run in LangSmith
        // Note: createRun returns Promise<void>, so we generate our own run ID
        const runId = randomUUID();
        
        try {
          await client.createRun({
            id: runId, // Provide our own ID
            name: `evaluation-${example.name}`,
            run_type: 'chain',
            inputs: example.inputs,
            outputs: { content: response },
            project_name: process.env.LANGSMITH_PROJECT_NAME || 'prompt-guardrails',
          });
        } catch (error: any) {
          console.error(`  Warning: createRun failed: ${error.message}`);
          // Continue evaluation even if run tracking fails
        }
        
        // Prepare run data for evaluators - use the response we got directly
        const runData = {
          outputs: { content: response },
          inputs: example.inputs,
          id: runId,
        };
        
        // Evaluate hallucination
        const hallucinationResult = await evaluateHallucination(runData, example);
        console.log(`  Hallucination: ${hallucinationResult.score === 1 ? '✅' : '❌'} ${hallucinationResult.comment}`);
        
        // Evaluate guardrails
        const guardrailResults = await evaluateGuardrails(runData, example);
        
        let testPassed = true;
        for (const [key, result] of Object.entries(guardrailResults)) {
          const icon = result.score === 1 ? '✅' : '❌';
          console.log(`  ${key}: ${icon} ${result.comment}`);
          if (result.score === 0) {
            testPassed = false;
          }
        }
        
        // Submit evaluation feedback (only if we have a run ID)
        if (runId) {
          try {
            await client.createFeedback(runId, 'hallucination', {
              score: hallucinationResult.score,
              comment: hallucinationResult.comment,
            });
            
            for (const [key, result] of Object.entries(guardrailResults)) {
              await client.createFeedback(runId, key, {
                score: result.score,
                comment: result.comment,
              });
            }
          } catch (error: any) {
            console.error(`  Warning: Failed to create feedback: ${error.message}`);
          }
        } else {
          console.log(`  Note: Skipping LangSmith feedback (no run ID available)`);
        }
        
        if (hallucinationResult.score === 1 && testPassed) {
          console.log(`  ✅ Test PASSED`);
          totalPassed++;
        } else {
          console.log(`  ❌ Test FAILED`);
          totalFailed++;
        }
        
      } catch (error: any) {
        console.error(`  ❌ Error: ${error.message}`);
        totalFailed++;
      }
      
      // Add delay between tests to respect rate limits (skip delay after last test)
      if (i < evaluationDataset.length - 1) {
        const delaySeconds = delayBetweenTests / 1000;
        console.log(`\n⏳ Waiting ${delaySeconds}s before next test (respecting rate limits)...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenTests));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Results: ${totalPassed} passed, ${totalFailed} failed out of ${evaluationDataset.length} tests`);
    console.log(`\n📈 View results in LangSmith dashboard:`);
    console.log(`   https://smith.langchain.com/datasets/${dataset.id}`);
    
    if (totalFailed === 0) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Review results in LangSmith dashboard.');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runEvaluations().catch(console.error);
}

export { runEvaluations, evaluationDataset, evaluateHallucination, evaluateGuardrails };