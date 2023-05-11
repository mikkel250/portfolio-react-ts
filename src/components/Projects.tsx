// Projects.tsx

import React from 'react';
import './Projects.scss';
const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h1 className="primary">PROJECTS</h1>
      <div className='projects__container'>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/portfolio-react-ts'>React Portfolio Site</a></h2>
          <p className='projects__item-desc'>
            A portfolio site intended to demonstrate proficiency with React and Typescript. The styling is still a work in progress, and the deployed version can be viewed here: <a className="link" target="_blank" rel="noreferrer" href='https://graceful-cucurucho-be578d.netlify.app'>https://graceful-cucurucho-be578d.netlify.app</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="primary link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/uswds-jekyll'>Jekyll demo site</a></h2>          
          <p className='projects__item-desc'>
            A demo project built for the Census Bureau, the deployed version can be viewed at: <a className="primary link" target="_blank" rel="noreferrer" href='https://gifted-stonebraker-95e99b.netlify.app/'>https://gifted-stonebraker-95e99b.netlify.app/</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/my_portfolio_website'>A personal site built in Svelte</a></h2>          
          <p className='projects__item-desc'>
            I built this project to learn Svelte and see how it stacks up to Angular and React. You can view the deployed version at: <a className="link" target="_blank" rel="noreferrer" href='https://mikkel250.codingconcepts.company'>https://mikkel250.codingconcepts.company</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/react-ecommerce'>React E-commerce store</a></h2>
          <p className='projects__item-desc'>
            A React project built to learn the framework. This is a mock online clothing store built with React, and Redux on the frontend, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments.
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/face-recognition'>Face recognition app</a></h2>
          <p className='projects__item-desc'>
            A Full stack web app that allows users to log in/out, and upload photos via links into the user-input field and will fetch, display the photo, recognize faces, and draw boxes around them. Uses React for the UI and front end (this repo) for its ability to update only the required parts of a page, React Router for efficient navigation in React, Express and Node for the backend (see the /face-recognition-api repo) to have REST APIs available for consumption on the frontend, PostgreSQL for the database, and the Clarifai face recognition API to analyze the photos. Technology used: React, Node, Express, REST APIs, PostgreSQL, and the Clarifai API.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Projects;
