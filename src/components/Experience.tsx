// Experience.tsx

import React from "react";
import "./Experience.scss";

const Experience: React.FC = () => {
  return (
    <div className='experience'>
      <h1 className='primary'>EXPERIENCE</h1>
      <section>
        <p>
          <span className='primary bold'>UI/UX Developer</span> at <span className="bold">
            Intrinsic (an
            Alphabet company)
          </span> via Nelson Connects - Jan 2023 - Present
        </p>
        <p>
          As a UI/UX Developer at Intrinsic (an Alphabet company) via Nelson
          Connects, my responsibilities include collaborating with product
          managers, designers, and software engineers to transform design
          prototypes into fully functional user interfaces for a large-scale,
          enterprise-level project using Alphabet's version control and build
          tools.
        </p>
        <div className='description__long'>
          <p>
            I contribute to this project using Angular, HTML, SCSS, and
            JavaScript, focusing on developing user-centered solutions that
            cater to clients and end-users from various industries, including
            those who build automation solutions like OEMs, specialty solution
            providers, or system integrators, with the end goal to make it
            easier for robotics and automation experts to build, design, and
            deploy robotic applications.
          </p>
          <p>
            My experience at Intrinsic has allowed me to develop a strong set of
            skills in Angular and collaborate across multiple different teams.
            It has been an incredibly rewarding experience contributing to a
            software platform that aims to democratize access to industrial
            robotics and help businesses adapt quickly and economically to a
            constantly changing global landscape.
          </p>
        </div>
      </section>
      <section>
        <p>
          <span className='primary bold'>Front End Engineer</span> at <span className="bold">
            Jefferson
            Health
          </span> via TekSystems, Inc. - Nov 2021 - Jan 2023
        </p>
        <p>
          As a Front End Developer at Jefferson Health, I created pixel-perfect
          front end code changes to a Shopify storefront based on a design
          system and stakeholder feedback. I maintained, optimized, and improved
          the Shopify code, resulting in 25% decrease in site load times. I set
          up version control, increasing the flexibility of the development
          process so changes were reviewed and approved in development before
          being pushed to production.
        </p>
        <div className='description__long'>
          <p>
            Additionally, I updated the existing theme from Shopify 1.x to
            Shopify 2.0 by converting all templates, resulting in 100% speed
            increase in site’s admin panel load times and responsiveness. I
            investigated, documented, and trained the team on using this system
            and the Shopify CLI, and I also migrated the version control system
            from Gitlab to Shopify’s built-in Github integration, onboarded all
            team members to the new system, tested, updated, and maintained the
            codebase for optimal performance, cleanliness, and accessibility,
            ensuring a seamless user experience. This resulted in a 50% decrease
            in developer time required to implement changes.
          </p>
          <p>
            I also collaborated to build an internal tool using React to route
            support tickets to the correct department, which resulted in a 200%
            increase in ticket response times. Through my work at Jefferson
            Health, I gained valuable experience in Shopify development and
            version control migration and management while honing my skills in
            React, JavaScript, HTML5, SCSS, and Liquid.
          </p>
        </div>
      </section>
      <section>
        <p>
          <span className='primary bold'>Front End Engineer</span> at <span className="bold">DGP</span> - Apr 2021 - Dec 2021
        </p>
        <p>As a Front End Web Developer at DGP, I owned all Jekyll front-end code for this website agency using HTML, CSS, JavaScript, Liquid, YAML, and Jekyll on AWS EC2 instances. Working closely with the Design team, I created custom theme templates which reduced developer time on site creation by 200%, collaborated with senior developers, and improved the existing tools and methods. In addition, I updated existing sites for performance and relevance, and built landing pages for specific clients to drive traffic to their sites.</p>
        <div className='description__long'>
          <p>Through my work at DGP, I developed a strong skill set in front end web development and Jekyll. I also honed my ability to collaborate effectively with many teams across different functions and skill sets, ensuring that client sites met their goals and exceeded expectations.</p>
        </div>
      </section>
      <section>
        <p>
          <span className='primary bold'>Front End Engineer</span> at <span className="bold">Kul, Inc.</span> - May
          2020 - Mar 2021
        </p>
        <p>As a Front End Web Developer at KUL, I built a Shopify ecommerce site using HTML, SCSS, Liquid, JavaScript, installed Shopify apps to enhance the site with advertising, reviews, coupons, and lead generation, set up version control system, a development store, and optimized the site resulting in a 75% decrease in load times.</p>
        <div className='description__long'>
          <p>I also xcollaborated with multiple stakeholders to create attractive and functional pages based on designs or desired behavior, and created and managed pop-up ads and marketing emails using third-party apps. One of my major accomplishments at KUL was spearheading the rebranding of the retail ecommerce site from Kul to QÚL. This involved building a second shop, transferring over all relevant data, adjusting all the copy, logos, and photos, and adding several new pages. </p>
          <p>Through my work at KUL, I gained extensive experience in both front end and Shopify development, as well as in collaborating with stakeholders, vendors, and managing complex projects and changing priorities.</p>
        </div>
      </section>
    </div>
  );
};

export default Experience;
