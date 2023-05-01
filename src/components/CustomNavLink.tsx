import React, { FC } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface CustomNavLinkProps {
  to: string;
  activeClass: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const CustomNavLink: FC<CustomNavLinkProps> = ({ to, activeClass, children, onClick }) => {
  const location = useLocation();
  return (
    <NavLink
      to={to}
      className={(location.pathname === to) ? activeClass : ''}
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
};

export default CustomNavLink;
