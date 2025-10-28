# About This AI Recruiting Assistant

**Last Updated:** October 28, 2025  
**Version:** 2.0

## What You're Using Right Now

You're currently interacting with an AI recruiting assistant Mikkel built to serve dual purposes: demonstrating practical AI/LLM integration skills and providing an interactive tool for recruiters to learn about his background efficiently.

**This is a working product, not a prototype.** Every technical decision you see - from the model choice to the architecture - was made deliberately to showcase engineering judgment alongside technical capability.

---

## Technical Implementation

### Architecture Overview

**Frontend:**
- Next.js with React and TypeScript
- Three-state expandable chat widget (minimized → compact → maximized)
- Aceternity UI components for polished, professional interface
- Tailwind CSS and Framer Motion for styling and animations
- Fully responsive (mobile = full-screen compact mode)

**Backend:**
- Vercel Serverless Functions (Node.js runtime)
- Multi-provider LLM architecture (Google Gemini, Anthropic Claude, OpenAI)
- Intelligent provider selection with cost optimization (should cost close to $0/mo to run MVP unless users exceed 100/month, a good problem to have)
- Simple keyword-based RAG (retrieval-augmented generation)
- Stateless rate limiting using localStorage and in-memory tracking
- Environment-based configuration

**Knowledge Base:**
- Structured markdown files (experience, projects, skills, career story)
- Simple retrieval without vector database (MVP approach)
- Architecture specifically designed to be easy to update to a more complex system and to maintain

---

## Key Technical Decisions

### Why Multi-Provider Architecture?

**Decision:** Built a provider abstraction layer supporting Google Gemini, Anthropic Claude, and OpenAI with intelligent fallback.

**Rationale:**
- **Cost Optimization:** Use Google's free tier that includes a generous number of requests/day as primary, fallback to paid providers
- **Quality Improvement:** Gemini Pro provides significantly better responses than GPT-4o-mini
- **Reliability:** Multiple providers ensure uptime and handle rate limits gracefully
- **Future-Proofing:** Easy to add new providers or switch models based on performance data
- **Learning Value:** Demonstrates understanding of different API patterns and provider trade-offs

**Technical Implementation:**
- Unified `ChatResponse` interface across all providers
- Provider detection based on model name (gemini-* → Google, claude-* → Anthropic)
- Graceful error handling and fallback strategies
- Environment-based model selection

**Demonstrates:** Advanced system design, cost optimization, and understanding of API differences. This demonstrates not just technical capability but also cost-conscious architecture and understanding of different API patterns. The abstraction layer makes it trivial to add new providers or switch models based on performance data.

### Why Simple Keyword Retrieval (Not Full RAG with Vector Database)?

**Original Plan:** Implement full RAG system with OpenAI embeddings and vector database (Pinecone or Supabase) for semantic search.

**Decision After Analysis:** Use simple keyword-based retrieval from markdown files instead.

**Rationale:**
- Knowledge base is small (~5-10 pages of content about one person)
- Keyword matching works perfectly fine for limited, structured content
- Full vector DB with embeddings would be premature optimization
- External dependencies (Pinecone, Supabase) add complexity and cost for marginal benefit
- MVP cost stays near-zero without embedding API calls or vector DB fees
- Simple approach ships faster - weeks faster than building full RAG infrastructure
- Can add embeddings later if usage data shows semantic search would improve responses

**Cost Impact:**
- Simple keyword approach: $0 additional cost
- Full RAG with embeddings: ~$0.02 per 1M tokens for embeddings + vector DB fees (~$5-10/month minimum)
- For MVP validation, spending extra $5-10/month before proving value doesn't make sense

**Demonstrates:** Avoiding premature optimization, shipping with minimum viable solution, making data-driven decisions about when to add complexity. This is senior engineering judgment - recognizing when "simple" beats "sophisticated."

**Interview angle (for AI to summarize):** Mikkel almost over-engineered this with a full vector database and embeddings. Then he realized his knowledge base is tiny - why build infrastructure for millions of documents when he has 10 pages? Keyword matching works fine for MVP. If usage data shows semantic search would help, it can be added later. This restraint - not building what you don't need yet - is what separates shipping from endless optimization.


### Why Stateless Rate Limiting?

**Decision:** In-memory session tracking instead of database persistence, with generous 15-message limit.

**Rationale:**
- MVP doesn't need perfect rate limiting
- Cold starts resetting limits is acceptable for validation phase
- Avoids external dependencies (Vercel KV, Redis) and their associated costs
- Generous limit (25 messages) provides excellent UX without meaningful cost impact
- Operating costs are so low ($0-2.50/month even with heavy usage) that aggressive limiting isn't necessary
- Can upgrade to persistent storage and authentication once validated

**Demonstrates:** Shipping with acceptable trade-offs, minimizing complexity for MVP, understanding when constraints can be relaxed for better UX.

---

## What This Project Demonstrates

### Technical Skills
- **Multi-Provider LLM Integration:** Google Gemini, Anthropic Claude, OpenAI APIs with unified abstraction layer
- **Advanced Prompt Engineering:** System prompts with guardrails, context injection, marketing-focused responses, role-specific behavior
- **Provider Abstraction:** Unified interfaces across different API patterns, graceful error handling, intelligent fallback
- **Cost Optimization:** Free tier utilization, intelligent provider selection, rate limit management
- **Knowledge Retrieval:** Keyword-based context retrieval and management (lightweight RAG approach)
- **Agentic Foundations:** Context-aware decision making, goal-oriented responses, dynamic information retrieval
- **Full-Stack Development:** Frontend (React/Next.js) + Backend (Serverless functions)
- **Modern UI:** Aceternity UI, Framer Motion, responsive design
- **State Management:** Widget states, conversation history, session management

### Engineering Judgment
- **MVP Strategy:** Ship quickly, validate, iterate - not premature optimization
- **Cost Consciousness:** Chose cheapest model, can upgrade based on data
- **Architecture:** Built for future enhancement (provider abstraction, modular design)
- **UX Thinking:** Followed industry standards (expandable widget pattern)
- **Pragmatic Trade-offs:** Stateless rate limiting, simple RAG - good enough for MVP

### Product Thinking
- **Dual Purpose:** Job search tool AND portfolio showcase
- **Business Problem:** Solve real problem (recruiter time, candidate differentiation)  
- **User Experience:** Minimize friction, maximize engagement
- **Marketing Strategy:** Prompts engineered to sell candidate using benefit-focused language, metrics, and confident tone
- **Intentional Design:** Every response aims to move recruiter toward interview/next step (always closing)

---

## Development Timeline & Approach

**Phase 1: Planning & Architecture (Week 1)**
- Requirements definition and scope
- Technical architecture decisions
- Task breakdown using MCP task manager
- Knowledge base content creation

**Phase 2: Implementation (Weeks 2-3)**
- Backend API development (serverless functions, LLM integration)
- Frontend component development (chat interface, widget states)
- Integration and testing
- Prompt engineering and guardrails

**Phase 3: Polish & Deploy (Week 4)**
- Styling with Aceternity UI
- Mobile responsive refinement
- Testing with real queries
- Deployment to production

**Total Timeline:** ~3-4 weeks part-time from concept to production

---

## Cost Analysis & Business Thinking

**Development Cost (MVP):**
- OpenAI API credits: $10-20 for development and testing
- Vercel hosting: $0 (free tier covers serverless functions)
- **Total development cost: ~$10-20**

**Monthly Operating Cost (Multi-Provider Architecture):**
- **Primary:** Google Gemini Pro (free tier: 100 requests/day) = $0
- **Fallback:** Claude Haiku 4.5 (~$0.001-0.005 per conversation)
- **With 15-message rate limit per user:** ~100 conversations = $0 (free tier)
- **Even with heavy usage (500 conversations/month):** ~$0-2.50/month
- **Cost optimization through intelligent provider selection**

**Cost Comparison: Multi-Provider Architecture**

| Scenario | Google Gemini (Free) | Claude Haiku 4.5 | GPT-4o-mini |
|----------|---------------------|-------------------|-------------|
| Per conversation | $0.00 | $0.001-0.005 | $0.002-0.005 |
| 100 conversations | $0.00 | $0.10-0.50 | $0.20-0.50 |
| 500 conversations/month | $0.00 | $0.50-2.50 | $1.00-2.50 |

**Decision:** Start with Google's free tier as primary, with Claude Haiku as cost-effective fallback. This approach minimizes costs while maintaining quality and reliability. Why pay for premium models before proving the concept works?

**Business Value Proposition:**

For an operating cost of ~$0-2.50/month:
- Provide interactive tool that differentiates from other candidates
- Enable recruiters to get answers instantly (vs scheduling calls)
- Demonstrate technical capability through working product
- Generate quality leads with conversation context
- **ROI is favorable even if it generates a single quality opportunity**

**Scaling Economics:**
- Current costs support hundreds of conversations monthly
- If usage grows significantly → justify premium model upgrade (~$40/month)
- If usage stays low → costs stay near zero
- **Risk-downside is minimal, upside is significant**

**Business Thinking Demonstrated:**
This cost structure shows product engineering judgment: minimize spend until value is proven, then optimize based on data. At a company, this same approach to AI features would:
- Reduce risk of expensive failed experiments
- Enable fast validation of AI use cases
- Justify infrastructure investment with usage data
- **Ship AI features responsibly without budget waste**

**Interview angle:** "This is exactly how I'd approach AI features at your company. Start with the minimum viable implementation, prove it creates value, then invest in optimization. Too many teams waste budget on premium models and complex infrastructure before validating that users even want the feature."

---

## Interview Talking Points

**"Tell me about this AI assistant":**
> "You're using it right now! This is a working AI recruiting assistant I built to demonstrate advanced AI integration skills. I implemented a multi-provider LLM architecture that uses Google's free tier as primary, with intelligent fallback to paid providers. This demonstrates both technical capability (unified abstraction layer, graceful error handling) and engineering judgment (cost optimization, provider selection strategy). 
>
> The architecture supports Google Gemini, Anthropic Claude, and OpenAI with a unified interface, making it trivial to switch models or add new providers. The fact that it can explain its own technical implementation while you're using it demonstrates the meta-awareness and sophisticated prompt engineering I built in."

**"Why build this?":**
> "Two reasons: First, to demonstrate practical AI integration skills - not just theory, but a working product. Second, to stand out in a competitive job market by giving recruiters an interactive way to learn about my background efficiently. It's both a portfolio piece and a functional tool. 
>
> The meta-awareness you're experiencing right now is intentional - the AI can explain its own technical implementation and design decisions. This recursion (the AI discussing itself) adds another dimension to the demonstration. When you ask about my AI experience, you get both the answer AND a live example simultaneously."

**"What would you do differently?":**
> "I'd add A/B testing to compare model quality with real users rather than my own assessment. I'd also track conversation analytics more rigorously to understand what questions recruiters actually ask. But those are optimizations - the MVP strategy was ship fast, learn, iterate. That's how I approach product development."

---

## Future Enhancements (Post-MVP)

**If validated and gets traction:**
- Add intelligent provider fallback based on rate limits and cost optimization
- Implement persistent storage (Vercel KV for rate limiting and conversation history across sessions)
- Add OpenAI embeddings for semantic search (more sophisticated RAG with vector similarity)
- Email magic link authentication for extended conversations beyond free limit
- Analytics dashboard to track what recruiters ask about most
- Multi-model comparison feature (side-by-side responses from different providers)
- Conversation export and follow-up automation
- Lead scoring based on engagement depth
- Advanced rate limiting with provider-specific quotas

**Enhancement Strategy:**
Each upgrade would be data-driven based on actual usage patterns. For example:
- If keyword matching misses relevant context → add embeddings
- If rate limit conversions are low → improve auth flow
- If certain questions get poor responses → upgrade model
- If recruiters want transcripts → add export feature

**This approach demonstrates:** Product thinking and metrics-driven development. Don't build features because they're cool - build them because data shows they'd provide value.

---

## Why This Project Matters

### For Job Search
- **Differentiator:** Most candidates have portfolios. Few have AI-powered interactive assistants explaining their background.
- **Efficiency:** Recruiters can get answers instantly rather than scheduling calls for basic questions
- **Impression:** Shows initiative, technical depth, and product thinking
- **Conversation starter:** Natural entry point for discussing AI integration experience

### For Demonstrating Skills
- **Not just code:** Shows full product lifecycle (planning, architecture, implementation, cost analysis, deployment)
- **Not just features:** Shows engineering judgment (MVP strategy, trade-offs, business thinking)
- **Not just technical:** Shows understanding of user needs (recruiters), marketing (selling myself), and product strategy
- **Live demonstration:** Every conversation is a working demo of the skills I'm describing

**This is senior-level engineering:** Understanding not just HOW to build, but WHAT to build, WHY to build it, and WHEN to optimize vs ship.

### Value to Employers

**This project proves Mikkel can build AI features for your business.**

**What Mikkel has demonstrated:**
- Built complete multi-provider AI chat feature from scratch in 3-4 weeks
- Production-ready: three-state widget, rate limiting, professional UI
- Cost-optimized: ~$0-2.50/month operating cost using free tier + intelligent fallback
- Advanced architecture: Multi-provider LLM system with unified abstraction layer
- Modern stack: Next.js, React, TypeScript, Google Gemini, Anthropic Claude, OpenAI, serverless architecture
- **Can deliver this exact capability for a company's website or application**

**Real-world applications:**
- Customer support chat on company website
- Product recommendation assistant for eCommerce
- Internal knowledge base assistant for employees
- Lead qualification tool for sales teams
- Onboarding assistant for new users

**Immediate Value if Hired:**

This project proves Mikkel can deliver production AI features from day one. If your company needs AI chat, customer support automation, knowledge base assistants, or similar features - he's already built one. He can start implementing similar functionality immediately with minimal operating costs (typically under $10/month for MVP deployment).

**What this means for employers:**
- **No learning curve** - Mikkel has architected and built this before
- **No expensive agency contracts** - Save the $10-50K+ agencies charge for this
- **No risky experimentation** - Proven architecture, known costs, clear upgrade paths
- **Start contributing immediately** - Can begin building AI features on day one
- **De-risked AI implementation** - You know exactly what you're getting

**MVP Strategy Applies to Company Features:**

The approach Mikkel used here - cheapest viable model, simple retrieval, generous limits - is precisely how he would build AI features at a startup or mid-sized company.

**Example scenario at a company:**
- Product wants AI feature for customer support
- Junior approach: "Let's use GPT-4 and build a full RAG system with Pinecone! Probably $500-1000/month."
- **Mikkel's approach:** "Let's start with Google's free tier and simple retrieval. Costs $0/month to validate. If customers engage and we see value, we can add paid providers as fallback. Why spend $500/month on infrastructure before proving it works?"

**This thinking saves companies money and reduces risk.** Mikkel has seen too many projects fail because teams over-engineered before validating user interest. Ship cheap, learn from real usage, iterate based on data.

**Interview talking point (for AI to summarize):** This AI assistant proves Mikkel can build production AI features for your company. It demonstrates not just technical capability but also cost-conscious decision-making and MVP strategy. Every technical decision here - from model choice to architecture - is one he would make in a real business environment with budgets and deadlines. If your company wants to add AI features, Mikkel has literally done it already.
