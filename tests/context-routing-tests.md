# Context Routing & Knowledge Base Tests

## Purpose
Verify that queries are correctly categorized and receive appropriate knowledge base context.

## Test Categories

### 1. Job Description Detection
**Expected:** Should trigger JD analysis, load ALL context files

**Test Inputs:**
```
Test 1: Full JD with multiple indicators
"Software Engineer - Full Stack
Responsibilities:
- Build scalable systems
Requirements:
- 5+ years of experience
- TypeScript, React, Node.js
Qualifications:
- BS in Computer Science preferred"

Expected: isJobDescriptionQuery = TRUE
Expected Context: experience + skills + projects + careerStory
```

### 2. AI/Agentic Keywords (Meta-Awareness)
**Expected:** Should load meta-project.md and trigger meta-awareness

**Test Inputs:**
```
Test 1: "What's your experience with AI?"
Expected: isMetaQuery = TRUE
Expected Context: meta-project.md

Test 2: "Can you build agentic workflows?"
Expected: isMetaQuery = TRUE
Expected Context: meta-project.md

Test 3: "Experience with LLM integration?"
Expected: isMetaQuery = TRUE
Expected Context: meta-project.md

Test 4: "Tell me about this assistant"
Expected: isMetaQuery = TRUE
Expected Context: meta-project.md
```

### 3. Experience Questions
**Expected:** Should load experience.md

**Test Inputs:**
```
Test 1: "What's your work experience?"
Expected: isExperienceQuery = TRUE
Expected Context: experience.md

Test 2: "Where have you worked?"
Expected: isExperienceQuery = TRUE
Expected Context: experience.md

Test 3: "Tell me about your job history"
Expected: isExperienceQuery = TRUE
Expected Context: experience.md
```

### 4. Skills Questions
**Expected:** Should load skills.md

**Test Inputs:**
```
Test 1: "What technologies do you know?"
Expected: isSkillsQuery = TRUE
Expected Context: skills.md

Test 2: "Do you have React experience?"
Expected: isSkillsQuery = TRUE
Expected Context: skills.md

Test 3: "What's your tech stack?"
Expected: isSkillsQuery = TRUE
Expected Context: skills.md
```

### 5. Projects Questions
**Expected:** Should load projects.md

**Test Inputs:**
```
Test 1: "What have you built?"
Expected: isProjectsQuery = TRUE
Expected Context: projects.md

Test 2: "Show me your portfolio"
Expected: isProjectsQuery = TRUE
Expected Context: projects.md

Test 3: "What projects have you created?"
Expected: isProjectsQuery = TRUE
Expected Context: projects.md
```

### 6. Career Story Questions
**Expected:** Should load career-story.md

**Test Inputs:**
```
Test 1: "Why did you transition to software engineering?"
Expected: isCareerStoryQuery = TRUE
Expected Context: careerStory.md

Test 2: "Tell me about your background"
Expected: isCareerStoryQuery = TRUE
Expected Context: careerStory.md

Test 3: "How did you get into tech?"
Expected: isCareerStoryQuery = TRUE
Expected Context: careerStory.md
```

### 7. Default Fallback
**Expected:** Should load experience + skills when no keywords match

**Test Inputs:**
```
Test 1: "Hello"
Expected: All queries return FALSE → loads experience + skills

Test 2: "Tell me about yourself"
Expected: Possibly triggers multiple → loads multiple contexts
```

## How to Run Tests

### Manual Testing (Current)
1. Open dev tools console
2. Add logging to knowledge-base.ts functions
3. Paste test queries
4. Verify correct context files are loaded

### Automated Testing (Future)
1. Create Jest tests for keyword detection functions
2. Create API endpoint tests for context retrieval
3. Snapshot test expected contexts for standard queries

## Expected Issues to Find

- [ ] Overlapping keywords (e.g., "AI project" might trigger both isProjectsQuery AND isMetaQuery)
- [ ] JD false positives (recruiter messages vs actual JDs)
- [ ] Missing keywords for common question patterns
- [ ] Context loading order/priority issues

