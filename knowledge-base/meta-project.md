# About This AI Recruiting Assistant

## What You're Using Right Now

You're currently interacting with an AI recruiting assistant I built to serve dual purposes: demonstrating practical AI/LLM integration skills and providing an interactive tool for recruiters to learn about my background efficiently.

**This is a working product, not a prototype.** Every technical decision you see - from the model choice to the architecture - was made deliberately to showcase engineering judgment alongside technical capability.

---

## Technical Implementation

### Architecture Overview

**Frontend:**
- Next.js 14 with React 18 and TypeScript 5
- Three-state expandable chat widget (minimized → compact → maximized)
- Aceternity UI components for polished, professional interface
- Tailwind CSS and Framer Motion for styling and animations
- Fully responsive (mobile = full-screen compact mode)

**Backend:**
- Vercel Serverless Functions (Node.js runtime)
- OpenAI GPT-4o-mini API integration
- Simple keyword-based RAG (retrieval-augmented generation)
- Stateless rate limiting using localStorage and in-memory tracking
- Environment-based configuration

**Knowledge Base:**
- Structured markdown files (experience, projects, skills, career story)
- Simple retrieval without vector database (MVP approach)
- Architecture specifically designed to be easy to update to a more complex system and to maintain

---

## Key Technical Decisions

### Why GPT-4o-mini (Not GPT-4 or Claude Sonnet)?

**Decision:** Start with the most cost-effective model for MVP validation.

**Rationale:**
- Cost: ~$0.002-0.005 per conversation vs $0.05-0.08 with premium models
- Strategy: Prove concept and validate engagement before optimizing
- Architecture: Built provider abstraction for easy model upgrades later
- Business thinking: Minimize costs until proven valuable

**Demonstrates:** Pragmatic engineering - avoid premature optimization, ship fast, iterate based on data.

**Interview talking point:** "I chose the cheapest viable model to prove the concept first. If I get traction, upgrading to GPT-4o or Claude Sonnet is a 5-minute config change. This is how I approach all product development - validate assumptions before investing in optimization."

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

**Interview angle:** "I almost over-engineered this with a full vector database and embeddings. Then I realized my knowledge base is tiny - why build infrastructure for millions of documents when I have 10 pages? Keyword matching works fine for MVP. If usage data shows semantic search would help, I can add it later. This restraint - not building what you don't need yet - is what separates shipping from endless optimization."

### Why Stateless Rate Limiting?

**Decision:** In-memory session tracking instead of database persistence, with generous 25-message limit.

**Rationale:**
- MVP doesn't need perfect rate limiting
- Cold starts resetting limits is acceptable for validation phase
- Avoids external dependencies (Vercel KV, Redis) and their associated costs
- Generous limit (25 messages) provides excellent UX without meaningful cost impact
- Operating costs are so low ($2.50-6.25/month even with heavy usage) that aggressive limiting isn't necessary
- Can upgrade to persistent storage and authentication once validated

**Demonstrates:** Shipping with acceptable trade-offs, minimizing complexity for MVP, understanding when constraints can be relaxed for better UX.

### Why Expandable Widget (Not Separate Page)?

**Decision:** Three-state expandable widget instead of dedicated /ai route.

**Rationale:**
- Lower friction - no navigation required
- Follows modern chatbot UX conventions (Intercom, Drift)
- Accessible from every page
- Better mobile experience
- Simpler implementation

**Demonstrates:** Understanding of modern UX patterns and user psychology.

---

## Relationship to Agentic Workflows & AI Agents

**What are Agentic Workflows?**
AI agents that autonomously perform complex tasks - planning, executing, and adapting based on context (examples: AutoGPT, LangChain agents, workflow automation systems).

**This Project's Relevance:**
While this assistant is not a fully autonomous agent system (no multi-step planning or tool usage), it demonstrates the **foundational skills required for building agentic workflows:**

1. **LLM Integration:** Core requirement for any AI agent - API integration, prompt engineering, context management
2. **Dynamic Context Retrieval:** Retrieves and injects relevant information based on query (lightweight RAG) - same pattern used in agentic systems
3. **Goal-Oriented Behavior:** Designed with specific objectives (qualify candidates, answer questions, drive to next step)
4. **Production-Ready Architecture:** Serverless, scalable, error-handling - ready for real users
5. **Rapid Development:** Built in ~2 weeks, showcasing ability to ship AI features quickly

**Scaling to Full Agentic Systems:**
With this foundation, building more sophisticated agentic workflows would involve:
- Adding tool usage (function calling, API integrations)
- Multi-step planning and execution
- Persistent memory across sessions
- Agent orchestration frameworks (LangChain, AutoGPT patterns)

**Bottom Line:** This project proves Mikkel can ship production AI features from day one. The leap to agentic workflows is architectural evolution, not learning from scratch.

---

## What This Project Demonstrates

### Technical Skills
- **AI/LLM Integration:** OpenAI API, chat completions, streaming responses, production deployment
- **Prompt Engineering:** System prompts with guardrails, context injection, marketing-focused responses, role-specific behavior
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

**Monthly Operating Cost (MVP with GPT-4o-mini):**
- Estimated cost per conversation: $0.002-0.005
- With 25-message rate limit per user: ~100 conversations = $0.50-1.25
- Even with heavy usage (500 conversations/month): ~$2.50-6.25/month
- **Trivial operating cost enables generous user experience**

**Cost Comparison: GPT-4o-mini vs Premium Models**

| Scenario | GPT-4o-mini | GPT-4o | Claude Sonnet |
|----------|-------------|---------|---------------|
| Per conversation | $0.005 | $0.03 | $0.05-0.08 |
| 100 conversations | $0.50 | $3.00 | $5-8 |
| 500 conversations/month | $2.50 | $15 | $25-40 |

**Decision:** Start with mini at $2.50-6.25/month. If validated, upgrade to premium models justified by proven value. Why pay 10x more before knowing if anyone will use it?

**Business Value Proposition:**

For an operating cost of ~$5/month:
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
> "You're using it right now! This is a working AI recruiting assistant I built to demonstrate full-stack AI integration skills. I made deliberate MVP decisions - GPT-4o-mini instead of premium models, simple keyword retrieval instead of complex vector database RAG, stateless rate limiting - to ship quickly and validate before optimizing. The architecture supports easy upgrades based on usage data. 
>
> It showcases both technical capability (LLM integration, serverless functions, modern UI) and engineering judgment (pragmatic trade-offs, cost consciousness, MVP strategy). The fact that it can explain itself while you're using it demonstrates the meta-awareness I built in."

**"Why build this?":**
> "Two reasons: First, to demonstrate practical AI integration skills - not just theory, but a working product. Second, to stand out in a competitive job market by giving recruiters an interactive way to learn about my background efficiently. It's both a portfolio piece and a functional tool. 
>
> The meta-awareness you're experiencing right now is intentional - the AI can explain its own technical implementation and design decisions. This recursion (the AI discussing itself) adds another dimension to the demonstration. When you ask about my AI experience, you get both the answer AND a live example simultaneously."

**"What would you do differently?":**
> "I'd add A/B testing to compare model quality with real users rather than my own assessment. I'd also track conversation analytics more rigorously to understand what questions recruiters actually ask. But those are optimizations - the MVP strategy was ship fast, learn, iterate. That's how I approach product development."

---

## Future Enhancements (Post-MVP)

**If validated and gets traction:**
- Upgrade to GPT-4o or Claude Sonnet for better response quality
- Add OpenAI embeddings for semantic search (more sophisticated RAG with vector similarity)
- Implement persistent storage (Vercel KV for rate limiting and conversation history across sessions)
- Email magic link authentication for extended conversations beyond free limit
- Analytics dashboard to track what recruiters ask about most
- Multi-model comparison feature (side-by-side GPT vs Claude responses)
- Conversation export and follow-up automation
- Lead scoring based on engagement depth

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

**This project proves I can build AI features for your business.**

**What I've demonstrated:**
- Built complete AI chat feature from scratch in 3-4 weeks
- Production-ready: three-state widget, rate limiting, professional UI
- Minimal cost: ~$5/month operating cost supports hundreds of users
- Modern stack: Next.js, TypeScript, OpenAI, serverless architecture
- **Can deliver this exact capability for a company's website or application**

**Real-world applications:**
- Customer support chat on company website
- Product recommendation assistant for eCommerce
- Internal knowledge base assistant for employees
- Lead qualification tool for sales teams
- Onboarding assistant for new users

**Immediate Value if Hired:**

This project proves I can deliver production AI features from day one. If your company needs AI chat, customer support automation, knowledge base assistants, or similar features - I've already built one. I can start implementing similar functionality immediately with minimal operating costs (typically under $10/month for MVP deployment).

**What this means for employers:**
- **No learning curve** - I've architected and built this before
- **No expensive agency contracts** - Save the $10-50K+ agencies charge for this
- **No risky experimentation** - Proven architecture, known costs, clear upgrade paths
- **Start contributing immediately** - Can begin building AI features on day one
- **De-risked AI implementation** - You know exactly what you're getting

**MVP Strategy Applies to Company Features:**

The approach I used here - cheapest viable model, simple retrieval, generous limits - is precisely how I'd build AI features at a startup or mid-sized company.

**Example scenario at a company:**
- Product wants AI feature for customer support
- Junior approach: "Let's use GPT-4 and build a full RAG system with Pinecone! Probably $500-1000/month."
- **My approach:** "Let's start with GPT-4o-mini and simple retrieval. Costs $5-10/month to validate. If customers engage and we see value, we upgrade to better models. Why spend $500/month on infrastructure before proving it works?"

**This thinking saves companies money and reduces risk.** I've seen too many projects fail because teams over-engineered before validating user interest. Ship cheap, learn from real usage, iterate based on data.

**Interview talking point:** "This AI assistant proves I can build production AI features for your company. It demonstrates not just technical capability but also cost-conscious decision-making and MVP strategy. Every technical decision here - from model choice to architecture - is one I'd make in a real business environment with budgets and deadlines. If your company wants to add AI features, I've literally done it already."