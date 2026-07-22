# Technical Projects

**Last Updated:** July 21, 2026  
**Version:** 2.1

## Overview
This is a list of projects that Mikkel built outside of work, aka side projects, aka personal projects, a common practice in software development. Mikkel builds side projects for two purposes, with his favorites covering both: learning new technologies and solving specific problems. These projects demonstrate hands-on experience with diverse tech stacks and his ability to ship complete, functional applications.

---

## AI Recruiting Assistant (This Project!)
**Type:** Personal Project (Professional Application)  
**Status:** Live in Production (Launched October 2025)  
**Integration:** Built into portfolio website (see Portfolio Website project)

### Description
AI-powered recruiting assistant that analyzes job descriptions and answers questions about professional background. **Integrated into portfolio site as expandable chat widget**, serving dual purpose: demonstrates LLM skills and streamlines recruiter vetting.


### Technologies
Next.js 14, React 18, TypeScript 5, Next.js API Routes (Node.js runtime), multiple LLM APIs (Google, Anthropic, OpenAI), Tailwind CSS, Framer Motion, Aceternity UI

### Key Features
- Three-state expandable chat widget (minimized, compact, maximized)
- Job description analysis with automated requirement matching
- RAG-based knowledge retrieval from structured markdown knowledge base
- Stateless rate limiting (10 free messages per session)
- Prompt guardrails for appropriate information sharing and marketing tone
- Meta-awareness: can explain its own technical implementation and design decisions

### Technical Highlights
- **MVP-first approach:** Chose Google Gemini 2.5 Pro for cost-effective validation before optimization, demonstrating business-conscious technical decision-making, with the ability to easily switch models and a stack of fallbacks in case of errors.
- **Simple RAG implementation:** Keyword-based retrieval without vector database for faster MVP iteration
- **Marketing-focused prompt engineering:** System prompts designed to effectively sell candidate using benefit-focused language
- **Modern UI with Aceternity:** Professional, polished interface using Framer Motion animations

### Business Impact
Demonstrates full-stack + AI integration capabilities to potential employers while providing unique differentiator in competitive job market. Shows pragmatic technical decision-making through MVP strategy and cost optimization. Serves as live portfolio piece that recruiter can interact with. Directly led to paid freelance work: a client saw this assistant, recognized a similar NL-query use case, and hired Mikkel to build a conversational BI platform (see NL-to-SQL Business Intelligence Analytics Platform below).

---

## NL-to-SQL Business Intelligence Analytics Platform
**Type:** Paid Freelance Contract (Time-based MVP)  
**Status:** Shipped MVP (sole engineer)  
**Links:** [Live Demo](https://app.budflow.com/)

### Description
Time-based contract to deliver a working MVP similar in spirit to the AI Recruiting Assistant: executives at a client's customer companies needed to query business intelligence data in plain English and get validated, SQL-backed answers. The client was a profitable bootstrapped stealth startup (real revenue, real users, no VC). Mikkel shipped the full conversational BI platform end-to-end as the sole engineer — Python/FastAPI backend, Remix/React/TypeScript frontend, ClickHouse analytics, PostgreSQL, RAG (ChromaDB) for schema memory, Vanna for the NL-to-SQL layer, LLM tier routing for cost/latency, automatic SQL error recovery, schema-aware validation, multi-tenant architecture, and Docker on Vercel.

### Technologies
Python, FastAPI, React, TypeScript, Remix, ClickHouse, PostgreSQL, ChromaDB (RAG), Vanna (NL-to-SQL), Anthropic and other managed LLM APIs, open-source model evaluation (Ollama, SGLang, vLLM, etc.), Pytest, Docker, Vercel

### Key Features
- Natural-language querying of BI data with validated SQL-backed answers for non-technical executives
- Real-time SQL error detection and correction plus schema-aware validation for LLM-generated queries
- Execution feedback loops to iterate on output quality
- RAG over schema/context (ChromaDB) so the model stays grounded in the real warehouse
- LLM tier routing and complexity/error-driven escalation for cost and latency
- Multi-tenant architecture
- Pytest evaluation harness for LLM-generated ClickHouse SQL: pre-execution syntax validation, structured checks (execution success, schema/tenant constraints, returned data), and benchmark-style runs across dozens of parametrized NL→SQL cases with optional multi-model comparison

### Technical Highlights
- **Model evaluation at depth:** Evaluated 15–20 open-source and commercial models on SQL quality, instruction following, tool-use reliability, latency, and hosting tradeoffs (hosted and self-hosted stacks including Anthropic, Ollama, SGLang, vLLM). Recommended managed APIs over self-hosting after cost/ops analysis showed production-viable OSS would need substantial GPU and infra.
- **Production reliability focus:** Schema-aware validation, automatic error recovery, and execution feedback — not just prompt-and-hope SQL generation.
- **Sole-engineer delivery:** Designed, built, and shipped the full stack under a time-based MVP contract.

### Business Impact
Enabled client executives (and their customers' executives) to get trustworthy BI answers in plain English without writing SQL. Validated that the recruiting-assistant pattern (conversational AI over a structured knowledge/data domain) transfers to production analytics for a revenue-generating startup.

---

## React eCommerce Store
**Type:** Personal Project (Learning & Portfolio)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/react-ecommerce) | [Live Demo](https://react-ecommerce-production-b661.up.railway.app)

### Description
Full-stack mock online clothing store demonstrating complete eCommerce workflow from product browsing to checkout with payment processing.

### Technologies
React, Redux, Node.js, Express, Firebase (database + authentication), Stripe API (payment processing), Railway (hosting)

### Key Features
- Complete shopping cart functionality with add/remove/update
- User authentication and account management via Firebase
- Stripe integration for mock payment processing
- Redux state management across application
- Responsive design for mobile and desktop

### Technical Highlights
Built complete full-stack application with authentication, database, API integration, and payment processing. Demonstrates understanding of eCommerce architecture and ability to integrate multiple third-party services. Also includes GraphQL implementation variant demonstrating API flexibility.

**Related:** [GraphQL implementation demo](https://github.com/mikkel250/react-graphql)

---

## DeFi Analytics Dashboards
**Type:** Paid Freelance Work (Professional)  
**Status:** Complete  
**Links:** [Live on Dune Analytics](https://dune.com/uniwizards/eth-alt-pool-analytics-v4)

### Description
Created 4 comprehensive Dune Analytics dashboards analyzing tens of thousands of Ethereum L1/L2 liquidity pools with real-time comparative analysis.

### Technologies
Dune Analytics SQL, PostgreSQL queries, Ethereum blockchain data, complex data pipelines

### Key Features
- 28 background queries powering real-time analytics
- Comparative analysis across multiple liquidity pools
- Visualizations of DeFi protocol performance
- On-chain data aggregation and transformation

### Technical Highlights
Demonstrates ability to work with complex data pipelines, blockchain technology understanding, and SQL expertise. Built sophisticated queries handling massive datasets for real-time financial analytics. Shows interest in emerging technologies (DeFi, blockchain) and ability to create data-driven insights.

---

## Professional Portfolio Website
**Type:** Personal Project (Professional Tool)  
**Status:** Live in Production (Updated October 2025, ongoing refinements)  

### Description
Modern, professional portfolio built with Next.js and Aceternity UI showcasing technical projects and professional experience. **Features integrated AI recruiting assistant** (see separate project entry) providing interactive way for recruiters to learn about Mikkel's background.

### Technologies
Next.js 14, React 18, TypeScript 5, Tailwind CSS, Framer Motion, Aceternity UI (DevPro template), Vercel

### Key Features
- Dark-mode-first professional aesthetic (Linear-inspired)
- **Integrated AI recruiting assistant** (expandable chat widget - see AI Recruiting Assistant project)
- Project showcase with live demos
- Professional experience timeline
- Responsive design with smooth animations

### Technical Highlights
Built on Aceternity UI's DevPro template for professional appearance while customizing content and integrating custom AI assistant feature. Demonstrates ability to work with modern component libraries while extending functionality. Shows pragmatic build-vs-buy decision making (template for foundation, custom development for differentiator).

### Business Impact
Serves as primary job search tool showcasing both technical capabilities and professional presentation. AI assistant integration provides unique differentiator in competitive market. Professional appearance and modern tech stack (Next.js, Tailwind) align with industry standards and job market demands.

---

## Face Recognition App
**Type:** Personal Project (Learning & Portfolio)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/face-recognition)

### Description
Full-stack application enabling users to upload photos and perform real-time face recognition and detection.

### Technologies
React, Express, Node.js, PostgreSQL, Clarifai API

### Key Features
- Image upload and processing
- Real-time face detection via Clarifai API
- User accounts with authentication
- PostgreSQL database for user data
- RESTful API architecture

### Technical Highlights
Demonstrates full-stack capabilities with frontend, backend API, database, and third-party ML API integration. Shows understanding of image processing workflows and machine learning service integration.

---

## Smart Contract for Freelance Work Agreements
**Type:** Personal Project (Learning - Web3 Exploration)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/SoftwareDevSmartContract) | [Live Demo](https://freelancersmartcontract.netlify.app)

### Description
Blockchain-based smart contract system for managing freelance work agreements and payments.

### Technologies
Solidity, Ethereum, Web3.js, React, blockchain integration

### Key Features
- Smart contract deployment and interaction
- Freelance agreement management on blockchain
- Modern React frontend for contract interaction
- Demonstrates blockchain technology implementation

### Technical Highlights
Shows exploration of Web3 technologies and blockchain development. Built smart contract logic with Solidity and integrated with React frontend, demonstrating ability to work with emerging technologies and decentralized systems.

---

## Bootstrap Store
**Type:** Personal Project (Learning - Frontend Fundamentals)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/bootstrap-store) | [Live Demo](https://mikkel250.github.io/bootstrap-store/)

### Description
Demo online ceramics store showcasing Bootstrap 4 framework and vanilla JavaScript capabilities.

### Technologies
Bootstrap 4, JavaScript ES6+, HTML5, CSS3, Session Storage API

### Key Features
- Shopping cart with session storage persistence
- Add, edit, and delete cart functionality
- Responsive Bootstrap grid layout
- Product catalog and filtering

### Technical Highlights
Demonstrates fundamentals with vanilla JavaScript and popular CSS framework. Shows understanding of browser storage APIs and DOM manipulation without framework dependencies.

---

## Robofriends
**Type:** Personal Project (Learning - React Fundamentals)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/robofriends) | [Live Demo](https://mikkel250.github.io/robofriends)

### Description
React application demonstrating state management and API integration with searchable user directory.

### Technologies
React, JavaScript, RoboHash API, JSON Placeholder API, GitHub Pages

### Key Features
- Real-time search filtering with React state
- API data fetching from multiple sources
- Responsive card-based layout
- Smooth user interactions

### Technical Highlights
Learning project focusing on React fundamentals: state management, component composition, API integration, and user input handling. Clean implementation of search/filter pattern.

---

## Twilio Communication Demos
**Type:** Personal Project (Learning - API Integration)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/twilio_demos)

### Description
Collection of projects demonstrating Twilio API integration for calls and SMS messaging.

### Technologies
Twilio API, Node.js, JavaScript, communication services integration

### Key Features
- Programmatic call creation and handling
- SMS sending and receiving
- Webhook integration for inbound communications
- API orchestration with third-party services

### Technical Highlights
Shows ability to integrate with communication APIs and handle real-time events. Demonstrates understanding of webhook architecture and third-party service integration patterns.

---

## Calculator Project
**Type:** Personal Project (Learning - JavaScript Fundamentals)  
**Status:** Complete  
**Links:** [GitHub](https://github.com/mikkel250/calculator-project) | [Live Demo](https://mikkel250.github.io/calculator-project)

### Description
Interactive calculator featuring responsive design and complete mathematical operations.

### Technologies
HTML5, CSS3, JavaScript (vanilla), responsive design

### Key Features
- Full calculator functionality
- Responsive UI design
- Interactive button states
- Clean, functional interface

### Technical Highlights
Demonstrates frontend fundamentals without frameworks. Shows understanding of DOM manipulation, event handling, and mathematical logic implementation. Built with pure HTML/CSS/JS to reinforce core skills.

---

## Project Themes & Technical Breadth

**Full-Stack Development:**
- eCommerce Store (complete checkout flow)
- Face Recognition App (ML API integration)
- Transit Planner (API orchestration)

**Blockchain & Web3:**
- Smart Contract implementation
- DeFi analytics and blockchain data

**AI & ML:**
- AI Recruiting Assistant (LLM integration, production application)
- NL-to-SQL Business Intelligence Analytics Platform (paid freelance MVP: FastAPI, ClickHouse, RAG, eval harness)
- Face Recognition (ML API integration)
- Early MCP adopter: Using Model Context Protocol servers for AI workflow orchestration and task management in development environments

**Frontend Fundamentals:**
- Portfolio sites (React, TypeScript)
- Bootstrap Store (framework proficiency)
- Calculator (vanilla JavaScript mastery)

**API Integration:**
- Stripe, Twilio, Google Maps, Clarifai, RoboHash
- RESTful and GraphQL architectures