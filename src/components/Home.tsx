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
        It all started with MUDs (Multi-User Dimensions) back in the mid-nineties, when I was just fifteen and the internet wasn't yet part of everyday life. Back then, finding MUDs wasn't as simple as a search—Google and other search engines didn't exist yet. You'd navigate a maze of university databases, gopher services, and Telnet before finally reaching the MUD listings. Those early digital adventures even got us featured in a <a href="https://www.pressdemocrat.com/article/news/a-meeting-of-the-muds/" className="home__link" target="_blank" rel="noopener noreferrer">local newspaper article.</a>
        </p>
        <p className='home__description'>
          Since then, my journey has taken some twists and turns. From salmon fishing in Alaska to traveling and busking through Central America, I've explored more than just the typical tech world.
        </p>
        <p className='home__description'>
        During five years as a manager at a local business before I transitioned into software engineering, I wore many hats. I was the sole Help Desk and Tech Support Manager, spearheading key improvements that significantly boosted support efficiency. I also managed an entire department, provided training, and served as QA Manager. I was promoted quickly because I took initiative, identified and fixed key pain points, and stepped up to take increasing levels of responsibility. 
        </p>
        <p className='home__description'>
        These experiences sharpened my leadership, process improvement, and collaboration skills—qualities I bring to every software project. Ultimately, I found my way to where I really want to be. Today, I'm a Software Engineer with 5 years of experience, primarily on the Front End and recently expanding into Full Stack.
        </p>
        <p className='home__description'>
        I built a React-based ticket routing app at Jefferson Health that tripled the support team's response speed and boosted site performance with a 25% load time reduction. I modernized workflows by creating dev-to-prod pipelines and introducing modern version control to their Shopify store.
        </p>
        <p className='home__description'>
        While contracting at Google, I developed Material UI components using Angular and TypeScript. I've also built multiple eCommerce stores using Shopify and Liquid. JavaScript (ES6+), HTML5, and CSS are my everyday tools.
        </p>
        <p className='home__description'>
        I bring more than just coding skills—I not only thrive in agile, cross-functional teams, but I can lead and/or manage them, too. My management experience sharpened my leadership, adaptability, collaboration, and communication skills. I take initiative and get the job done right, and come at every task with a humble, growth mindset. My academic background in art gives me a good eye for UI and UX design, which naturally draws me toward front end work—where creativity and technology come together.
        </p>
        <p className='home__description'>
        When I'm not coding, I'm an excellent cook, I'm usually walking or playing with my Golden Retriever Freddie Mercury (he's a master of both Grunt and Gulp), gaming, investing or coaching others in crypto, blasting Mongolian heavy metal, cycling, geeking out over Neo-Futuristic architecture, and traveling the globe-because variety is the spice of life (and code).
        </p>
        <p className='home__description'>
        Feel free to reach out at mikkel250@gmail.com.
        </p>
      </div>
    </div>
  );
};

export default Home;
