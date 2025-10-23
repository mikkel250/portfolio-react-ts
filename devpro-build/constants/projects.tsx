import { stack } from "./stack";

export const projects = [
  {
    title: "Personal Portfolio Website",
    description:
      "Built a responsive React portfolio site using React, TypeScript, and front end best practices in order to showcase projects.",
    image: "/images/projects/portfolio.png",
    stack: [stack.react, stack.typescript, stack.tailwindcss],
    link: "https://graceful-cucurucho-be578d.netlify.app/",
  },
  {
    title: "eCommerce Site Demo",
    description:
      "Mock online clothing store built with React and Redux on the front end, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments.",
    image: "/images/projects/ecommerce.png",
    stack: [stack.react, stack.typescript, stack.nextjs],
    link: "https://react-ecommerce-production-b661.up.railway.app",
  },
  {
    title: "Bike-and-Bart Transit Planner",
    description:
      "Integrated Google Maps API and React, TypeScript to combine biking and transit directions, gaining experience in API orchestration and asynchronous data handling.",
    image: "/images/projects/transit.png",
    stack: [stack.react, stack.typescript],
    link: "https://github.com/mikkel250/optiride",
  },
  {
    title: "DeFi Analytics Dashboards",
    description:
      "Created 4 Dune Analytics dashboards analyzing tens of thousands of Ethereum L1/L2 liquidity pools. Built complex data pipelines (28 background queries) for real-time comparative analysis.",
    image: "/images/projects/defi.png",
    stack: [stack.typescript],
    link: "https://dune.com/uniwizards/eth-alt-pool-analytics-v4",
  },
  {
    title: "Smart Contract For Freelance Work Agreements",
    description:
      "Live demo showcasing smart contract integration and blockchain technology implementation with modern React frontend architecture.",
    image: "/images/projects/smartcontract.png",
    stack: [stack.react, stack.typescript],
    link: "https://freelancersmartcontract.netlify.app",
  },
  {
    title: "Face Recognition App",
    description:
      "Full-stack application enabling users to upload photos and perform real-time face recognition and detection. Built with React, Express, Node, PostgreSQL, and powered by the Clarifai API.",
    image: "/images/projects/facerecognition.png",
    stack: [stack.react, stack.typescript],
    link: "https://github.com/mikkel250/face-recognition",
  },
  {
    title: "SFMOMA Ticketing Platform",
    description:
      "Production ticketing platform for San Francisco Museum of Modern Art featuring ASP.NET backend integration with Tessitura CRM APIs and WCAG 2.1 AA compliance.",
    image: "/images/projects/sfmoma.png",
    stack: [stack.typescript],
    link: "https://tickets.sfmoma.org",
  },
  {
    title: "Jefferson Health Marcus Store",
    description:
      "Production Shopify e-commerce platform for Jefferson Health featuring optimized performance, modern development workflows, and automated CI/CD pipelines.",
    image: "/images/projects/jefferson.png",
    stack: [stack.react, stack.typescript],
    link: "https://marcusstore.jeffersonhealth.org",
  },
];
