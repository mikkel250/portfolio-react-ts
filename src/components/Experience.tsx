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
    position: "Jr. Full Stack Software Engineer",
    company: "San Francisco Museum of Modern Art (SFMOMA)",
    duration: "Sep 2023 – May 2025",
    description: (
      <>
        <p>
          Navigated .NET legacy code (C#, Razor, MVC, HTML, CSS, JS) like a spelunker in a cave of spaghetti-minimal guidance, maximum caffeine.
        </p>
        <p>
          Collaborated in agile sprints, prioritized UX/UI, and made the site accessible-because art should be for everyone, even screen readers and keyboard ninjas.
        </p>
        <p>
          Rolled out a new payment system, ensuring the frontend was usable without needing a PhD in cryptography.
        </p>
        <p>
          Managed deployments with Azure, IIS, and FTP-because sometimes “modern” means “please don’t break everything.”
        </p>
        <p>
          Introduced Jest unit testing, because breaking things is fun, but breaking things in production is a nightmare.
        </p>
        <p>
          Laid off in a 7% workforce reduction. Apparently, “junior” means “first to go.” Thanks, budget cuts!
        </p>
      </>
    ),
    skills: ".NET, C#, Razor, MVC, HTML, CSS, JavaScript, Azure, IIS, Jest",
  },  
  {
    position: "UI/UX Developer",
    company: "Intrinsic (an Alphabet company) via Nelson Connects",
    duration: "Jan 2023 - May 2023",
    description: (
      <>
        <p>
          Built modular UI components with Angular and TypeScript, collaborating with backend and design teams. Survived Google's monorepo (and lived to tell the tale). Participated in code reviews and technical discussions-sometimes even understood them.
        </p>
        <p>
          Promised a 9-month contract, cut at 5 months with all contractors. At least I got a cool Google badge.
        </p>
      </>
    ),
    skills: "Angular, HTML5, SCSS, JavaScript",
  },
  {
    position: "Front End Engineer",
    company: "Jefferson Health via TekSystems, Inc.",
    duration: "Nov 2021 - Jan 2023",
    description: (
      <>
        <p>
          Improved Shopify storefront performance by 25% and admin panel responsiveness by 100% (math checks out). Migrated theme to Shopify 2.0, introduced GitHub workflows, and cut developer time by 50%. Built a React ticket routing app that tripled support efficiency-because who doesn't love fewer support tickets?
        </p>
        <p>
          Contract extended, work completed, no drama-just how I like it.
        </p>
      </>
    ),
    skills: "React, JavaScript, HTML5, SCSS, Liquid, Shopify",
  },
  {
    position: "Front End Engineer",
    company: "DGP",
    duration: "Apr 2021 - Dec 2021",
    description: (
      <>
        <p>
          Did good work for nice people. Pay was... let's say “character building.” Owned all Jekyll front-end code, collaborated with designers, and built custom theme templates that made everyone's life easier (except maybe my own). Improved tools, built landing pages, and kept AWS EC2 instances humming.
        </p>
      </>
    ),
    skills: "HTML5, SCSS, JavaScript, Liquid, YAML, Jekyll, AWS",
  },
  {
    position: "Front End Engineer",
    company: "Kul, Inc.",
    duration: "May 2020 - Mar 2021",
    description: (
      <>
        <p>
          Not as cool as it sounds, but I learned a lot and nobody got hurt. Built a Shopify ecommerce site, optimized load times by 75%, and rebranded the whole thing from Kul to QÚL. Managed pop-ups, marketing emails, and collaborated with stakeholders, vendors, and anyone else who would listen.
        </p>
      </>
    ),
    skills: "HTML5, SCSS, Liquid, JavaScript, Shopify",
  },
  {
    position: "Tech Support Lead + General Manager",
    company: "Marathon Products, Inc.",
    duration: "Mar 2015 - May 2020",
    description: (
      <>
        <p>
          Wore every hat in the building-help desk, network admin, technical writer, and coffee machine repair guy. Built and managed help desk and bug tracking systems, slashed lost tickets to zero, and reduced repetitive support time by 500% (yes, really).
        </p>
        <p>
          Promoted quickly, ended up managing production, tech support, and ISO compliance. If it needed fixing, documenting, or organizing, it landed on my desk. Also collaborated with web devs, auditors, and the frequent confused customer.
        </p>
      </>
    ),
    skills:
      "Help desk administration, Technical writing, Project management, Technical training, Customer service, Process improvement, Leadership, Team management.",
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
              <span className='icon' />
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
