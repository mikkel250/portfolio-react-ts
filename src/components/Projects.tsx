// Projects.tsx

import React from 'react';

const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h1 className="primary">PROJECTS</h1>
      <p>Here are some of the projects I have worked on:</p>
      <div className='projects__container'>
        <div className='projects__item'>
          <h2 className='projects__item-title'>React Portfolio Site</h2>
          <p className='projects__item-desc'>
            A portfolio site intended to demonstrate proficiency with React and Typescript. The styling is still a work in progress, and the deployed version can be viewed here: 
            <a href='https://graceful-cucurucho-be578d.netlify.app'>https://graceful-cucurucho-be578d.netlify.app</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title'>Jekyll demo site</h2>
          <p className='projects__item-desc'>
            A project built for the Census Bureau, the deployed version can be viewed at: 
            <a href='https://gifted-stonebraker-95e99b.netlify.app/'>https://gifted-stonebraker-95e99b.netlify.app/</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title'>A personal site built in Svelte</h2>
          <p className='projects__item-desc'>
            I built this project to learn Svelte and see how it stacks up to Angular and React. You can view the deployed version at: 
            <a href='https://mikkel250.codingconcepts.company'>https://mikkel250.codingconcepts.company</a>
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title'>React E-commerce store</h2>
          <p className='projects__item-desc'>
            A React project built to learn the framework. This is a mock online clothing store built with React, and Redux on the frontend, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments.
          </p>
        </div>
        <div className='projects__item'>
          <h2 className='projects__item-title'>Face recognition app</h2>
          <p className='projects__item-desc'>
            A Full stack web app that allows users to log in/out, and upload photos via links into the user-input field and will fetch, display the photo, recognize faces, and draw boxes around them. Uses React for the UI and front end (this repo) for its ability to update only the required parts of a page, React Router for efficient navigation in React, Express and Node for the backend (see the /face-recognition-api repo) to have REST APIs available for consumption on the frontend, PostgreSQL for the database, and the Clarifai face recognition API to analyze the photos. Technology used: React, Node, Express, REST APIs, PostgreSQL, and the Clarifai API.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Projects;
