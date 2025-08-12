// About.tsx

import React from "react";

const About: React.FC = () => {
  return (
    <div className='about'>
      <h1 className='primary'>ABOUT</h1>
      <div className='about-section'>
        <p>
          Hi, I'm Mikkel Ridley-Front End Engineer by day, aspiring crypto
          market whisperer by night. Over the past 5 years, I've navigated the
          wild world of software development, learning Angular, React, Shopify,
          Jekyll, and more along the way. But before I was writing code, I was
          managing a local small business-and its entire IT department (yes,
          that means I was the help desk, the network admin, and the coffee
          machine repair guy).
        </p>

        <p>
          If you want a developer who's equal parts tenacious autodidact, team
          player, and occasional snarky commentator,
          you've found your guy.
        </p>
      </div>

      <div className='contact-section'>
        <h2>Let's Connect</h2>
        <p>
          If you've made it this far, congratulations-you've survived my
          rambling! Whether you want to chat about frontend wizardry, swap
          crypto horror stories, or just say hi, I'm all ears.
        </p>
        <p>
          Feel free to reach out-I promise I don't bite (unless you're a bug in
          the code, then all bets are off).
        </p>
        <ul>
          <li>
            📧 Email:{" "}
            <a className='primary link' href='mailto:mikkel250@gmail.com'>
              mikkel250@gmail.com
            </a>
          </li>
          <li>
            💼 LinkedIn:{" "}
            <a
              className='primary link'
              href='https://linkedin.com/in/mikkelridley'
              target='_blank'
              rel='noopener noreferrer'
            >
              linkedin.com/in/mikkelridley
            </a>
          </li>
          <li>
            🐕 Walks and play dates with Freddie Mercury: By appointment only
          </li>
        </ul>
        <p>
          Let's build something awesome together-or at least have a good time
          trying.
        </p>
      </div>
    </div>
  );
};

export default About;
