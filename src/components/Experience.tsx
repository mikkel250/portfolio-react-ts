import React, { useState } from "react";
import "./Experience.scss";

interface Job {
  position: string;
  company: string;
  duration: string;
  description: React.ReactNode;
  skills?: string;
}

const jobs: Job[] = [
  {
    position: "Software Engineer - Full Stack",
    company: "San Francisco Museum of Modern Art",
    duration: "Sep 2023 – May 2025",
    description: (
      <>
        <p>
          • Built ticketing platform features (ASP.NET, JavaScript, HTML/SCSS) integrating with Tessitura CRM APIs; maintained existing architecture while adding new functionality
        </p>
        <p>
          • Led WCAG 2.1 AA compliance sprint: zero critical defects in pre-audit QA across entire platform
        </p>
        <p>
          • Supported front end through major infrastructure upgrades (.NET Core, CRM migrations) with minimal disruption
        </p>
        <p>
          • Introduced Jest testing for JavaScript components and readied it for CI/CD pipeline
        </p>
      </>
    ),
    skills: "ASP.NET, JavaScript, HTML/SCSS, Tessitura CRM APIs, WCAG 2.1 AA, Jest",
  },  
  {
    position: "UI/UX Developer (Contract)",
    company: "Intrinsic (Alphabet/Google X)",
    duration: "Jan 2023 – May 2023",
    description: (
      <>
        <p>
          • Built production Angular/TypeScript components in Google's monorepo (Piper/Bazel) consuming internal APIs
        </p>
        <p>
          • Delivered scalable UI features through automated builds and multi-stage testing in cloud infrastructure
        </p>
        <p>
          • Translated Figma designs to functional interfaces; maintained 100% test coverage standards in large-scale environment
        </p>
        <p>
          • Collaborated with engineering teams on API integration requirements; communicated technical constraints and solutions
        </p>
      </>
    ),
    skills: "Angular, TypeScript, Google Piper/Bazel, Figma",
  },
  {
    position: "Software Engineer - Front End (Contract)",
    company: "Jefferson Health",
    duration: "Nov 2021 – Jan 2023",
    description: (
      <>
        <p>
          • Built React/TypeScript/Next.js IT support ticket routing tool; improved support ticket response times 3X
        </p>
        <p>
          • Modernized entire Shopify development workflow: migrated to GitHub integration with protected branches, Shopify CLI for local dev, and automatic deployments—creating a proper dev-to-test-to-prod pipeline; trained the team on new practices
        </p>
        <p>
          • Migrated Shopify 1.x to 2.0: converted all Liquid templates to JSON schema, doubling admin panel speed
        </p>
        <p>
          • Reduced storefront load time ~25% through performance optimization (code-splitting, lazy loading, deferral)
        </p>
      </>
    ),
    skills: "React, TypeScript, Next.js, Shopify, GitHub, Liquid",
  },
  {
    position: "Software Engineer - Front End",
    company: "Dental Game Plan",
    duration: "Apr 2021 – Dec 2021",
    description: (
      <>
        <p>
          • Regularly shipped React/TypeScript/Next.js landing pages for various clients during tenure
        </p>
        <p>
          • Shipped 6 Jekyll Static Site Generator sites for healthcare clients; updated and optimized existing client sites
        </p>
        <p>
          • Extended custom SSG framework architecture; reduced developer time 50% for future site launches
        </p>
      </>
    ),
    skills: "React, TypeScript, Next.js, Jekyll, SSG",
  },
  {
    position: "Software Engineer - Front End",
    company: "Kul Inc.",
    duration: "May 2020 – Mar 2021",
    description: (
      <>
        <p>
          • Second technical hire; owned entire Shopify storefront (Hydrogen/React, Liquid, JS) while company explored multiple revenue models
        </p>
        <p>
          • Led a full rebranding and migration over 3 weeks, with zero downtime, during a strategic pivot
        </p>
        <p>
          • Built front end for rewards system with data visualization and charts (c3.js, d3.js, Three.js)
        </p>
        <p>
          • Experienced startup reality: rapid experimentation, trying multiple business models, competing priorities and rapid strategy shifts
        </p>
        <p>
          • Optimized performance of the storefront, cutting load times by ~18% (code-splitting, lazy loading, deferral)
        </p>
      </>
    ),
    skills: "Shopify, Hydrogen/React, Liquid, JavaScript, c3.js, d3.js, Three.js",
  },
  {
    position: "Manager",
    company: "Marathon Products",
    duration: "2015 – 2020",
    description: (
      <>
        <p>
          • Managed production team, improved efficiency 15%, reduced processing errors 10%
        </p>
        <p>
          • Implemented Help Desk system: ~50% faster response, zero lost tickets after launch
        </p>
        <p>
          • Spearheaded Bug Tracking system adoption, increasing bug fix speed by 25%
        </p>
        <p>
          • Achieved 30% fewer support tickets and a 75% drop in repetitive issues through documentation overhaul
        </p>
        <p>
          • Administered and streamlined ISO 9001 compliance program
        </p>
        <p>
          • Process improvements listed above saved company 100+ hours annually
        </p>
        <p>
          • Transitioned to software engineering for continuous technical challenges
        </p>
      </>
    ),
    skills: "Production management, Help Desk systems, Bug tracking, ISO 9001 compliance, Process improvement",
  },
];

const Experience: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggleExpand = (index: number) => {
    setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className='experience'>
      <h1 className='primary'>EXPERIENCE</h1>
      {jobs.map((job, index) => (
        <section key={index}>
          <div>
            <span className='primary bold'>{job.position}</span> at{" "}
            <span className='bold'>{job.company}</span> - {job.duration}
          </div>
          <div
            className='clickable'
            onClick={() => handleToggleExpand(index)}
            aria-label='click to expand and show the full description'
          >
            <div className='link'>
              <span className='label'>Skills: {job.skills}</span>
              <span className={`icon ${expandedIndex === index ? 'expanded' : ''}`} />
            </div>
            {expandedIndex === index && (
              <div className='description__long'>{job.description}</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Experience;
