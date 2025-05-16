import React from "react";
import "./Home.scss";

const Home = () => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "MikkelRidley2025.pdf";
    link.href = "/MikkelRidley2025.pdf";
    link.click();
    link.remove();
    return;
  };

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
          <div className='home__info'>
            <h1 className='home__headline'>
              I'm a <span className='primary'>Software Engineer</span>
            </h1>
          </div>

          <div className='home__buttons'>
            <button className='home__button' onClick={handleDownload}>
              DOWNLOAD CV
            </button>
          </div>
        </div>
      </div>
      <div className='home__full'>
        <p className='home__description'>
          Full Stack Engineer (mostly front-end, but with a few backend tricks
          up my sleeve) with 5 years of experience building user-centered web
          apps. My secret sauce? The classic web trifecta: JavaScript, HTML, and
          (S)CSS-sprinkled with recent adventures in C#/.NET. I've also dabbled
          in Angular and TypeScript during a brief contract with Intrinsic (a
          GoogleX moonshot), where I learned to survive monorepos and code
          reviews alike. With a good eye for UI/UX and a proven track record in
          accessibility, I've built and shipped projects using React and the
          MERN stack through bootcamp and personal projects. Currently, I'm
          automating my crypto market anxiety with a Python analyzer-because why
          just watch the market crash when you can script it? A self-sufficient
          learner, I'm eager to contribute to front-end or full-stack solutions
          that deliver intuitive, high-impact user experiences. Experienced in
          agile teams and collaborating across product, design, and offshore
          squads.
        </p>
        <p className='home__description'>
          Before diving into software development, I spent five years managing a
          local business and moonlighting as the IT department-so I bring a
          well-rounded, “been-there-done-that” perspective to my dev work. When
          I'm not coding, I'm an excellent cook, I'm usually walking or playing
          with my Golden Retriever Freddie Mercury (he's a master of both Grunt
          and Gulp), gaming, investing or coaching others in crypto, blasting
          Mongolian heavy metal, cycling, geeking out over Neo-Futuristic
          architecture, and traveling the globe-because variety is the spice of
          life (and code).
        </p>
      </div>
    </div>
  );
};

export default Home;
