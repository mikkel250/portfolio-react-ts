// Projects.tsx

import React from 'react';

const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h1 className="primary">PROJECTS</h1>
      <p>Here are some of the projects I have worked on:</p>
      <ul>
        <li>Intrinsic (an Alphabet company) via Nelson Connects - contributing to a large-scale, enterprise-level project using Angular, HTML, SCSS, and JavaScript</li>
        <li>Jefferson Health - creating pixel-perfect front end code changes to a Shopify storefront based on a design system and stakeholder feedback</li>
        <li>Dental Game Plan - owning all Jekyll front-end code for a website agency using HTML, CSS, JavaScript, Liquid, YAML, and Jekyll on AWS EC2 instances</li>
        <li>Kul, Inc. - building a Shopify ecommerce site using a combination of page builders, the Shopify theme editor, and custom coded pages using HTML, SCSS, Liquid, JavaScript, installed Shopify apps to enhance the site with advertising, reviews, coupons, and lead generation</li>
      </ul>
    </div>
  );
};

export default Projects;
