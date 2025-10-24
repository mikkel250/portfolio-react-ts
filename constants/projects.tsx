import { stack } from "./stack";

export const projects = [
  {
    title: "AI Recruiting Assistant",
    description:
      "Production AI chat assistant with multi-provider LLM architecture (Google Gemini, Anthropic Claude, OpenAI). Features intelligent fallback, cost optimization (~$0-2.50/month), and WCAG compliance. Built with Next.js, TypeScript, and serverless architecture.",
    image: "/images/projects/placeholder.png",
    stack: [stack.nextjs, stack.typescript, stack.react],
    link: "https://portfolio-react-ts-mocha.vercel.app/",
  },
  {
    title: "Portfolio Website",
    description:
      "Modern portfolio site built with Next.js, TypeScript, and Tailwind CSS. Features responsive design, smooth animations, and integrated AI assistant. Showcases full-stack development skills with production deployment.",
    image: "/images/projects/placeholder.png",
    stack: [stack.nextjs, stack.typescript, stack.tailwindcss],
    link: "https://portfolio-react-ts-mocha.vercel.app/",
  },
  {
    title: "eCommerce Site Demo",
    description:
      "Mock online clothing store built with React and Redux on the front end, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments.",
    image: "/images/projects/placeholder.png",
    stack: [stack.react, stack.typescript, stack.nextjs],
    link: "https://react-ecommerce-production-b661.up.railway.app",
  },
  {
    title: "DeFi Analytics Dashboards",
    description:
      "Created 4 Dune Analytics dashboards analyzing tens of thousands of Ethereum L1/L2 liquidity pools. Built complex data pipelines (28 background queries) for real-time comparative analysis.",
    image: "/images/projects/placeholder.png",
    stack: [stack.typescript],
    link: "https://dune.com/uniwizards/eth-alt-pool-analytics-v4",
  },
  {
    title: "Smart Contract For Freelance Work Agreements",
    description:
      "Live demo showcasing smart contract integration and blockchain technology implementation with modern React frontend architecture.",
    image: "/images/projects/placeholder.png",
    stack: [stack.react, stack.typescript],
    link: "https://freelancersmartcontract.netlify.app",
  },
  {
    title: "Face Recognition App",
    description:
      "Full-stack application enabling users to upload photos and perform real-time face recognition and detection. Built with React, Express, Node, PostgreSQL, and powered by the Clarifai API.",
    image: "/images/projects/placeholder.png",
    stack: [stack.react, stack.typescript],
    link: "https://github.com/mikkel250/face-recognition",
  },
];
