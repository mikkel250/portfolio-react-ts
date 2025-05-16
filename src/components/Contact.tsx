// Contact.tsx

import React from "react";

const Contact: React.FC = () => {
  return (
    <div className='contact'>
      <h1 className='primary'>CONTACT</h1>
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

export default Contact;
