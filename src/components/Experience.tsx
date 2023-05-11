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
    position: "UI/UX Developer",
    company: "Intrinsic (an Alphabet company) via Nelson Connects",
    duration: "Jan 2023 - Present",
    description: (
      <>
        <p>
          As a UI/UX Developer at Intrinsic (an Alphabet company) via Nelson
          Connects, my responsibilities include collaborating with product
          managers, designers, and software engineers to transform design
          prototypes into fully functional user interfaces for a large-scale,
          enterprise-level project using Alphabet's version control and build
          tools.
        </p>
        <p>
          I contribute to this project using Angular, HTML5, SCSS, and
          JavaScript, focusing on developing user-centered solutions that cater
          to clients and end-users from various industries, including those who
          build automation solutions like OEMs, specialty solution providers, or
          system integrators, with the end goal to make it easier for robotics
          and automation experts to build, design, and deploy robotic
          applications.
        </p>
        <p>
          My experience at Intrinsic has allowed me to develop a strong set of
          skills in Angular and collaborate across multiple different teams. It
          has been an incredibly rewarding experience contributing to a software
          platform that aims to democratize access to industrial robotics and
          help businesses adapt quickly and economically to a constantly
          changing global landscape.
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
          As a Front End Developer at Jefferson Health, I created pixel-perfect
          front end code changes to a Shopify storefront based on a design
          system and stakeholder feedback. I maintained, optimized, and improved
          the Shopify code, resulting in 25% decrease in site load times. I set
          up version control, increasing the flexibility of the development
          process so changes were reviewed and approved in development before
          being pushed to production.
        </p>
        <p>
          Additionally, I updated the existing theme from Shopify 1.x to Shopify
          2.0 by converting all templates, resulting in 100% speed increase in
          site’s admin panel load times and responsiveness. I investigated,
          documented, and trained the team on using this system and the Shopify
          CLI, and I also migrated the version control system from Gitlab to
          Shopify’s built-in Github integration, onboarded all team members to
          the new system, tested, updated, and maintained the codebase for
          optimal performance, cleanliness, and accessibility, ensuring a
          seamless user experience. This resulted in a 50% decrease in developer
          time required to implement changes.
        </p>
        <p>
          I also collaborated to build an internal tool using React to route
          support tickets to the correct department, which resulted in a 200%
          increase in ticket response times. Through my work at Jefferson
          Health, I gained valuable experience in Shopify development and
          version control migration and management while honing my skills in
          React, JavaScript, HTML5, SCSS, and Liquid.
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
          As a Front End Web Developer at DGP, I owned all Jekyll front-end code
          for this website agency using HTML5, SCSS, JavaScript, Liquid, YAML,
          and Jekyll on AWS EC2 instances. Working closely with the Design team,
          I created custom theme templates which reduced developer time on site
          creation by 200%, collaborated with senior developers, and improved
          the existing tools and methods. In addition, I updated existing sites
          for performance and relevance, and built landing pages for specific
          clients to drive traffic to their sites.
        </p>
        <p>
          Through my work at DGP, I developed a strong skill set in front end
          web development and Jekyll. I also honed my ability to collaborate
          effectively with many teams across different functions and skill sets,
          ensuring that client sites met their goals and exceeded expectations.
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
          As a Front End Web Developer at KUL, I built a Shopify ecommerce site
          using HTML5, SCSS, Liquid, JavaScript, installed Shopify apps to
          enhance the site with advertising, reviews, coupons, and lead
          generation, set up version control system, a development store, and
          optimized the site resulting in a 75% decrease in load times.
        </p>
        <p>
          I also xcollaborated with multiple stakeholders to create attractive
          and functional pages based on designs or desired behavior, and created
          and managed pop-up ads and marketing emails using third-party apps.
          One of my major accomplishments at KUL was spearheading the rebranding
          of the retail ecommerce site from Kul to QÚL. This involved building a
          second shop, transferring over all relevant data, adjusting all the
          copy, logos, and photos, and adding several new pages.
        </p>
        <p>
          Through my work at KUL, I gained extensive experience in both front
          end and Shopify development, as well as in collaborating with
          stakeholders, vendors, and managing complex projects and changing
          priorities.
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
          As the Tech Support Lead, I administered the Help Desk system to help
          clients with Marathon's proprietary hardware (data loggers) and
          accompanying software. I built, tracked, maintained, and managed all
          client-side machines to ensure access to necessary software and
          network tools required for staff to fulfill all job functions. I
          identified and troubleshot issues with computers, printers, or
          network, and escalated to the appropriate vendor or party when needed.
          I acted as the company liaison to the MSP that handled company
          servers, managed all aspects of technical writing, tested and
          documented proprietary software and hardware, trained employees and
          customers on all software and hardware, and collaborated with local
          and overseas engineers to solve challenges.
        </p>
        <p>
          In terms of accomplishments, I implemented and administered a formal
          Help Desk ticketing system where none was previously present, which
          reduced the number of lost tickets from many to zero, and decreased
          the follow-up time by 50%. I also implemented a formal Bug Tracking
          system and acted as a liaison to the hardware and software development
          teams to gather reports, identify, reproduce, and fix bugs in the
          hardware and software. I took ownership of all aspects of technical
          writing within the company and increased the number of documents by
          more than 100%. I established a system for organizing and distributing
          technical writing, exponentially increasing availability to end-users
          and reducing the number of tech support tickets by 30%. Tech support
          tickets for repetitive known issues dropped by 75%, and time spent
          answering them was reduced by 500%.
        </p>
        <p>
          I identified the need for and created new technical manuals, including
          Validation Manuals for FDA 21 CFR compliance. I created
          troubleshooting and assembly guides for recurring challenges, reducing
          hourly time spent on repetitive tasks within the company by triple
          digits yearly. I collaborated with the company Web Developer/Designer
          to update the public-facing website and ensure information presented
          was readable, accurate, visually appealing, and up-to-date. I also
          updated internal document-creation methods to a modern and more
          efficient system less prone to human error. Due to my demonstrated
          ability to take ownership of projects and make needed improvements, I
          was rapidly promoted, and my responsibilities grew to include a
          management role and responsibilities in a total of 3 departments.
        </p>
        <p>
          In addition to my duties as Tech Support Lead, I was the manager for
          all employees in the production department (90% of the company's
          employee pool), hiring, firing, providing technical training,
          oversight for orders, and acted as B2B liaison. I wore many hats and
          also managed the oversight of the ISO 9001 system of standards and
          practices. I administered and updated ISO paperwork, performed,
          reviewed, and approved internal audits, and collaborated with external
          auditors on an annual basis.
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
