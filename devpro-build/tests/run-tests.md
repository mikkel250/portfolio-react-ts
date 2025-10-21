# Testing Guide - AI Assistant

## Quick Test Commands

### 1. Test Context Routing
```bash
cd devpro-build
npx tsx tests/test-context-routing.ts
```

**What it tests:**
- Keyword detection (AI, agentic, experience, skills, projects, career)
- Context file loading (correct files for each query type)
- JD detection

**Expected:** All 11 tests should pass

---

## Manual Testing Checklist

### Core Functionality Tests

#### ✅ AI/Agentic Meta-Awareness
**Input:** "Can you build agentic workflows?"

**Expected Response:**
- Should mention "You're using the AI assistant Mikkel built right now"
- Talks about Next.js, TypeScript, OpenAI integration
- Connects to agentic workflow requirements
- Includes clickable Calendly link

**Red Flags:**
- ❌ Talks about Shopify or e-commerce only
- ❌ No mention of the AI assistant itself
- ❌ Plain text URL instead of link

---

#### ✅ Simple Question
**Input:** "What's your React experience?"

**Expected Response:**
- 220-420 words
- Mentions 5 years of experience
- Specific projects with metrics
- Clickable Calendly link
- No template labels

**Red Flags:**
- ❌ Shows "Hook:", "Proof Points:", etc.
- ❌ Ends with "Let me know if you need anything!"
- ❌ First person ("I have...")

---

#### ✅ Full Job Description
**Input:** Paste the Replo JD

**Expected Response:**
- Analyzes fit for each major requirement
- Highlights relevant experience
- Points out gaps honestly (e.g., CS degree)
- Variety in angle (not always the same proof points)
- Clickable Calendly link

**Red Flags:**
- ❌ Claims hackathon attendance
- ❌ Invents companies or projects
- ❌ Same exact response every time

---

#### ✅ Recruiter Message (Generic/Wrong)
**Input:** "Hi Mikkel, your experience as a founder and recruiter is impressive..."

**Expected Response:**
- Analyzes the opportunity mentioned
- Explains how Mikkel's background aligns with the ACTUAL role (software engineer)
- Doesn't pretend to BE Mikkel responding
- Clickable Calendly link

**Red Flags:**
- ❌ "Hi [Recruiter], thank you for reaching out!"
- ❌ Signs as Mikkel
- ❌ Drafts a response from Mikkel

---

### Edge Cases

#### Test: Missing Information
**Input:** "Has Mikkel worked at Amazon?"

**Expected:**
- Positive pivot: "His experience includes..." (doesn't say "Not listed")
- Lists actual companies
- Doesn't claim Amazon if not in KB

---

#### Test: Rate Limiting
1. Send 25 messages rapidly
2. Message 26 should be rejected with rate limit error
3. Check that error displays nicely in UI

---

#### Test: Mobile Responsive
1. Open on mobile/narrow browser
2. Chat should take full screen
3. All controls should be accessible

---

#### Test: State Preservation
1. Send a few messages
2. Minimize chat
3. Maximize again
4. Messages should still be there

---

#### Test: Page Refresh
1. Send a few messages
2. Refresh page
3. Chat should reset to welcome message (expected behavior)

---

## Monitoring in Production

### Check Browser Console
Look for:
- No errors during initialization
- API calls complete successfully
- No CORS or network issues

### Check Network Tab
Verify:
- `/api/chat` endpoint returns 200
- Response includes `content` and `remaining` fields
- No timeout issues

### Test Real Recruiter Flow
1. Share link with friend/colleague
2. Have them paste a real JD
3. Review response quality
4. Collect feedback

---

## Known Issues / Accepted Behavior

✅ **Chat resets on refresh** - This is expected, matches industry standard (Intercom, HubSpot)
✅ **Rate limit resets on server restart** - Acceptable for MVP (in-memory storage)
✅ **Context can be large** - JD queries load all KB files (~90k chars) - acceptable for MVP

---

## Future Improvements (Not MVP)

- [ ] Add conversation history to API (multi-turn context)
- [ ] Implement streaming responses
- [ ] Add "Copy response" button
- [ ] Syntax highlighting for code blocks
- [ ] Export conversation as PDF
- [ ] A/B test different prompt variations
- [ ] Analytics (track query types, response quality)

