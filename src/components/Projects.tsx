import React from 'react';
import './Projects.scss';

const Projects: React.FC = () => {
  return (
    <div className="projects">
      <h1 className="primary">PROJECTS</h1>
      <div className='projects__container'>

        {/* New projects from resume */}
        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/analysis_simple'>Market Analysis CLI (Python, In Progress)</a></h2>
          <p className='projects__item-desc'>
            Developing a Python CLI tool to analyze cryptocurrency data-because watching the market isn't stressful enough, might as well automate the panic.
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'><a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/optiride'>Bike-and-BART Transit Planner (React, paused)</a></h2>
          <p className='projects__item-desc'>
            Tried to make Bay Area commutes less confusing by integrating Google Maps and BART by stitching together biking directions and transit directions since you can't do that by default in Google Maps (just the way the transit directions are designed). The idea is to take the user's origin and destination, and then stitch together biking directions and transit directions based on the nearest BART stations to the origin and destination. Paused, but the dream lives on-like a zombie app refusing to die. I'll probably finish this once I replace my bike that was stolen, Freddie keeps me too busy to ride.
          </p>
        </div>

        {/* Existing projects */}
        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/portfolio-react-ts'>
              React Portfolio Site
            </a>
          </h2>
          <p className='projects__item-desc'>
            The very site you're exploring right now! Built with React and Typescript to prove I can indeed build a working app without losing my sanity (just my sleep). Styled? Sure, it's got stylesheets. Polished? We'll call it “authentically styled.”
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="primary link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/uswds-jekyll'>
              Jekyll Demo Site
            </a>
          </h2>          
          <p className='projects__item-desc'>
            A neat little demo project built for the Census Bureau. It's live and kicking here: <a className="primary link" target="_blank" rel="noreferrer" href='https://gifted-stonebraker-95e99b.netlify.app/'>Take a look</a>. Jekyll-powered and ready to serve static goodness. They asked me make specific changes to this template to demonstrate my Jekyll skills, but then they ghosted me after I turned it in :( but the project lives on!
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/my_portfolio_website'>
              Personal Site Built in Svelte
            </a>
          </h2>          
          <p className='projects__item-desc'>
            My experiment to see if Svelte could dethrone Angular and React in my heart. Spoiler: it's pretty cool. 
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/react-ecommerce'>
              React E-commerce Store
            </a>
          </h2>
          <p className='projects__item-desc'>
            A mock online clothing store built to learn React and Redux. It's got Node/Express backend, Firebase for database & auth, and Stripe for pretend payments-because who doesn't want to shop without spending real money?
          </p>
        </div>

        <div className='projects__item'>
          <h2 className='projects__item-title primary'>
            <a className="link" target="_blank" rel="noreferrer" href='https://github.com/mikkel250/face-recognition'>
              Face Recognition App
            </a>
          </h2>
          <p className='projects__item-desc'>
            A full-stack app that lets users log in, upload photos, and watch the magic as faces get recognized and boxed in real-time. Built with React, Express, Node, PostgreSQL, and powered by the Clarifai API. It's like giving your photos a pair of glasses.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Projects;
