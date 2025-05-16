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
          My career path hasn't always been smooth sailing, but hey, what's a
          good story without a few plot twists?
        </p>

        <ul>
          <li>
            At SFMOMA, I learned that “junior” is code for “first to go” during
            a 7% workforce reduction. Lesson learned: always keep your resume
            updated and your coffee intake high.
          </li>
          <li>
            At Intrinsic (a GoogleX moonshot), I experienced firsthand how a
            promised 9-month contract can turn into a 5-month surprise party
            where contractors get the boot early. Pro tip: never get too
            attached to contract end dates.
          </li>
          <li>
            Jefferson Health was the unicorn in my journey-work got done, the
            contract got extended and the project ended on time, and nobody
            cried in the break room. Sometimes, the stars align.
          </li>
          <li>
            DGP paid me in “character building” currency, which is great for the
            soul but not so much for rent. On the plus side, the people were
            lovely!
          </li>
          <li>
            Kul… well, let's just say it wasn't quite the rockstar gig the name
            suggests, but I survived and learned a ton.
          </li>
        </ul>

        <p>
          When I'm not coding or debugging the mysteries of legacy code, I'm
          cycling, traveling (I've hit up 13 countries so far-yes, including
          some with questionable Wi-Fi), cooking up a storm, or rocking out to
          Mongolian heavy metal. Oh, and walking my Golden Retriever, Freddie
          Mercury, who's a master of both Grunt and Gulp (task runners, not rock
          bands-though he's got the attitude).
        </p>

        <p>
          If you want a developer who's equal parts tenacious autodidact, team
          player, and occasional snarky commentator on the quirks of tech life,
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
