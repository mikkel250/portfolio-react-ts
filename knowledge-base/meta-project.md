# About This AI Recruiting Assistant

## What You're Using Right Now

You're currently interacting with an AI recruiting assistant Mikkel built to serve dual purposes: demonstrating practical AI/LLM integration skills and providing an interactive tool for recruiters to learn about my background efficiently.

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
- **Quality Improvement:** Gemini provides significantly better responses than GPT-4o-mini
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
- **Intentional Design:** Every response aims to inform recruiter

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
- Built complete multi-provider AI chat feature from scratch in 3-4 weeks
- Production-ready: three-state widget, rate limiting, professional UI
- Cost-optimized: ~$0-2.50/month operating cost using free tier + intelligent fallback
- Advanced architecture: Multi-provider LLM system with unified abstraction layer
- Modern stack: Next.js, TypeScript, Google Gemini, Anthropic Claude, OpenAI, serverless architecture
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

The approach Mikkel used here - cheapest viable model, simple retrieval, generous limits - is precisely how he'd build AI features at a startup or mid-sized company.
