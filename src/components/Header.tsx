import React, { FC, useState } from 'react';
import './Header.scss';
import { slide as Menu } from 'react-burger-menu';
import CustomNavLink from './CustomNavLink';

const Header: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = (state: { isOpen: boolean }) => {
    setMenuOpen(state.isOpen);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  const renderMenu = () => {
    if (window.innerWidth < 1025) {
      return (
        <Menu className="menu__mobile" right isOpen={menuOpen} onStateChange={handleMenuToggle}>
          <CustomNavLink to="/" activeClass="active" onClick={handleLinkClick}>
            Home
          </CustomNavLink>
          <CustomNavLink to="/about" activeClass="active" onClick={handleLinkClick}>
            About
          </CustomNavLink>
          <CustomNavLink to="/contact" activeClass="active" onClick={handleLinkClick}>
            Contact
          </CustomNavLink>
          <CustomNavLink to="/experience" activeClass="active" onClick={handleLinkClick}>
            Experience
          </CustomNavLink>
          <CustomNavLink to="/projects" activeClass="active" onClick={handleLinkClick}>
            Projects
          </CustomNavLink>
        </Menu>
      );
    }
  };

  return (
    <header className="app-header">
      <p className="title primary">Mikkel Ridley</p>
      <div className="menu-container">
        {renderMenu()}
        <nav className="app-header__nav">
          <CustomNavLink to="/" activeClass="active" onClick={handleLinkClick}>
            Home
          </CustomNavLink>
          <CustomNavLink to="/about" activeClass="active" onClick={handleLinkClick}>
            About
          </CustomNavLink>
          <CustomNavLink to="/contact" activeClass="active" onClick={handleLinkClick}>
            Contact
          </CustomNavLink>
          <CustomNavLink to="/experience" activeClass="active" onClick={handleLinkClick}>
            Experience
          </CustomNavLink>
          <CustomNavLink to="/projects" activeClass="active" onClick={handleLinkClick}>
            Projects
          </CustomNavLink>
        </nav>
        <div className={`burger-menu ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <div className="burger-menu__line"></div>
          <div className="burger-menu__line"></div>
          <div className="burger-menu__line"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
