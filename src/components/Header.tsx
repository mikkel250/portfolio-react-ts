// Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link to="/">Mikkel Ridley</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/experience">Experience</Link>
          </li>
          <li>
            <Link to="/projects">Projects</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
      <div>
        <p>mikkel250@gmail.com | 4158902735 | <a href="https://www.linkedin.com/in/mikkelridley/">linkedin.com/in/mikkelridley</a></p>
      </div>
    </header>
  );
};

export default Header;
