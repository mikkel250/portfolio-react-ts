import React from "react";
import "./Home.scss";

const Home = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = 'Mikkel-Ridley-2023.docx';
    link.href = '/Mikkel-Ridley-2023.docx';
    link.click();
    link.remove();
    return;
  }

  return (
    <div className='home'>
      <div className='home__container'>
        <div className='home__left'>
          <img
            className='home__image'
            src='/images/my-profile.png'
            alt='Profile'
          />
        </div>
        <div className='home__right'>
          <div className='home__headline-container'>
            <h2 className='subheadline primary'>Mikkel Ridley</h2>
          </div>
          <div className="home__info">
            <h1 className='home__headline'>I'm a <span className="primary">Software Engineer</span></h1>
            <p className='home__description'>Angular, React, JavaScript, HTML, CSS/ SCSS, Shopify, AWS, and Jekyll.</p>
          </div>
          <div className='home__buttons'>
            <button className='home__button' onClick={handleDownload}>DOWNLOAD CV</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
