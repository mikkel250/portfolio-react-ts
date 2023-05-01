// Footer.tsx

import React from 'react';
import './Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div>
        <p>&copy; {new Date().getFullYear()} Mikkel Ridley. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
