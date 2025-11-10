# Portfolio Website with AI Recruiting Assistant

This is a [Next.js](https://nextjs.org/) portfolio website featuring a production-grade AI recruiting assistant built to demonstrate advanced LLM integration skills and provide recruiters with an interactive way to learn about Mikkel's background.

## Key Features

### 🤖 AI Recruiting Assistant
- **Multi-Provider LLM Architecture**: Unified abstraction layer supporting Google Gemini, Anthropic Claude, and OpenAI
- **Intelligent Fallback**: Automatic provider switching for reliability and cost optimization
- **Production Observability**: LangSmith integration for real-time tracing, token monitoring, and performance analytics
- **Keyword-Based RAG**: Lightweight knowledge retrieval system optimized for small content bases
- **Cost-Optimized**: ~$0-2.50/month operating costs using free tiers and intelligent provider selection

### 🛠 Technical Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Serverless Functions
- **AI/LLM**: Google Gemini 2.5, Anthropic Claude, OpenAI GPT-4o
- **Observability**: LangSmith for production monitoring
- **Deployment**: Vercel

### 📊 LangSmith Integration
The project includes enterprise-grade LLM observability with LangSmith:
- Real-time tracing of all AI interactions
- Token usage and cost tracking across providers
- Performance monitoring and latency analysis
- Response quality metrics
- Data-driven optimization insights

See [knowledge-base/meta-project.md](./knowledge-base/meta-project.md) for detailed technical documentation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
