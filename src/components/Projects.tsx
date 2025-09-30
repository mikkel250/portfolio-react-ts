import React from 'react';
import './Projects.scss';

const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h1 className="primary">PROJECTS AND PORTFOLIO</h1>
      <div className='projects__container'>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://graceful-cucurucho-be578d.netlify.app/'>
              Personal Portfolio Website
            </a>
          </h2>
          <p className='projects__item-desc'>
            Built a responsive React portfolio site using React, TypeScript, and front end best practices in order to showcase projects.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/react-ecommerce'>
              eCommerce Site Demo
            </a>
          </h2>
          <p className='projects__item-desc'>
            Mock online clothing store built with React and Redux on the front end, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments. See the demo front end here. 
            <a className="link" style={{ margin: '0 0 0 5px' }} target="_blank" rel="noreferrer noopener" href='https://react-ecommerce-production-b661.up.railway.app'>
              eCommerce Store Demo
            </a>
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/optiride'>
              Bike-and-Bart Transit Planner
            </a>
          </h2>
          <p className='projects__item-desc'>
            Integrated Google Maps API and React, TypeScript to combine biking and transit directions, gaining experience in API orchestration and asynchronous data handling.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://dune.com/uniwizards/eth-alt-pool-analytics-v4'>
              DeFi Analytics Dashboards
            </a>
          </h2>
          <p className='projects__item-desc'>
            Created 4 Dune Analytics dashboards analyzing tens of thousands of Ethereum L1/L2 liquidity pools. Built complex data pipelines (28 background queries) for real-time comparative analysis.
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/SoftwareDevSmartContract'>
              Smart Contract For Freelance Work Agreements
            </a>
          </h2>
          <p className='projects__item-desc'>
            Live demo showcasing smart contract integration and blockchain technology implementation with modern React frontend architecture. 
            <a className="link" style={{ margin: '0 0 0 5px' }} target="_blank" rel="noreferrer noopener" href='https://freelancersmartcontract.netlify.app'>
              View Live Demo
            </a>
          </p>
        </div>
        {/* <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://freelancersmartcontract.netlify.app/'>
              AI/ML Integration
            </a>
          </h2>
          <p className='projects__item-desc'>
            Set up Model Context Protocol (MCP) servers for orchestrating AI workflows. Early Stable Diffusion adopter; run local instances for generative AI experiments.
          </p>
        </div> */}

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/face-recognition'>
              Face Recognition App
            </a>
          </h2>
          <p className='projects__item-desc'>
            Full-stack application enabling users to upload photos and perform real-time face recognition and detection. Built with React, Express, Node, PostgreSQL, and powered by the Clarifai API.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/robofriends'>
              Robofriends
            </a>
          </h2>
          <p className='projects__item-desc'>
            Simple React app that uses state to filter based on user input in the search field. Data is populated by pulling dummy data from two open source APIs - RoboHash and JSON placeholder. 
            <a className="link" style={{ margin: '0 0 0 5px' }} target="_blank" rel="noreferrer noopener" href='https://mikkel250.github.io/robofriends'>
              View on GitHub Pages
            </a>
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/calculator-project'>
              Calculator Project
            </a>
          </h2>
          <p className='projects__item-desc'>
            Calculator UI built entirely with HTML, CSS, and JavaScript featuring responsive design and interactive functionality. 
            <a className="link" style={{ margin: '0 0 0 5px' }} target="_blank" rel="noreferrer noopener" href='https://mikkel250.github.io/calculator-project'>
              View Live Demo
            </a>
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/bootstrap-store'>
              Bootstrap Store
            </a>
          </h2>
          <p className='projects__item-desc'>
            Demo online store built using Bootstrap 4 and vanilla JS featuring ceramics. Uses session storage for shopping cart functionality with add, edit, and delete capabilities. 
            <a className="link" style={{ margin: '0 0 0 5px' }} target="_blank" rel="noreferrer noopener" href='https://mikkel250.github.io/bootstrap-store/'>
              View on GitHub Pages
            </a>
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://github.com/mikkel250/twilio_demos'>
              Twilio Demos
            </a>
          </h2>
          <p className='projects__item-desc'>
            Project working with the Twilio API for creating, responding to, and receiving calls and SMS. Demonstrates integration with communication services and API orchestration.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://tickets.sfmoma.org'>
              SFMOMA Ticketing Platform
            </a>
          </h2>
          <p className='projects__item-desc'>
            Production ticketing platform for San Francisco Museum of Modern Art featuring ASP.NET backend integration with Tessitura CRM APIs and WCAG 2.1 AA compliance.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://marcusstore.jeffersonhealth.org'>
              Jefferson Health Marcus Store
            </a>
          </h2>
          <p className='projects__item-desc'>
            Production Shopify e-commerce platform for Jefferson Health featuring optimized performance, modern development workflows, and automated CI/CD pipelines.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://nudentistry.com'>
              Nu Dentistry
            </a>
          </h2>
          <p className='projects__item-desc'>
            Healthcare client website built with Jekyll Static Site Generator, featuring responsive design and optimized performance for dental practice marketing.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://gcdentalriverside.com'>
              Gold Coast Dental
            </a>
          </h2>
          <p className='projects__item-desc'>
            Dental practice website built with Jekyll SSG framework, featuring modern design and optimized performance for Riverside dental practice marketing.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://grossepointevillagedental.com'>
              Village Dental Associates
            </a>
          </h2>
          <p className='projects__item-desc'>
            Grosse Pointe dental practice website showcasing custom Jekyll architecture and responsive design for comprehensive dental services marketing.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://wynnortho.com'>
              Wynn Orthodontics
            </a>
          </h2>
          <p className='projects__item-desc'>
            Orthodontic practice website built with Jekyll SSG, featuring specialized design for orthodontic services and patient education content.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://dentisttreeheights.com'>
              Dentist Tree
            </a>
          </h2>
          <p className='projects__item-desc'>
            Dental practice website featuring custom Jekyll framework implementation with optimized performance and modern design for Tree Heights location.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer noopener" href='https://aviaracenters.com'>
              Aviara Centers
            </a>
          </h2>
          <p className='projects__item-desc'>
            Healthcare client website showcasing custom Jekyll SSG framework architecture and optimized development workflows for healthcare marketing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Projects;
