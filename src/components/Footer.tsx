// Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <p>&copy; {new Date().getFullYear()} Mikkel Ridley. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
