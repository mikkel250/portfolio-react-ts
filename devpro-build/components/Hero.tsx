import React from "react";
import { LinkPreview } from "./LinkPreview";

export const Hero = () => {
  return (
    <div className="max-w-5xl mx-auto mt-10 md:mt-20 px-8 ">
      <h1 className="font-bold text-3xl md:text-5xl leading-tight text-zinc-50 max-w-3xl">
        I'm a software engineer who{" "}
        <span className="text-cyan-500">builds things.</span>
      </h1>
      <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-8 leading-loose tracking-wide">
        Meet Mikkel Ridley, a Software Engineer with 5 years of experience primarily 
        on the Front End and recently expanding into Full Stack. From building ticketing 
        platforms at SFMOMA to developing Angular components at Google, I bring both 
        technical expertise and leadership experience to every project.
      </p>
      <div className="mt-8 text-zinc-400 text-sm md:text-base max-w-2xl leading-loose tracking-wide">
        Currently working on{" "}
        <LinkPreview
          className={
            "text-zinc-200 font-bold hover:text-cyan-500 transition duration-150 outline-none"
          }
          url="https://tickets.sfmoma.org"
        >
          SFMOMA Ticketing Platform
        </LinkPreview>{" "}
        and{" "}
        <LinkPreview
          className={
            "text-zinc-200 font-bold hover:text-cyan-500 transition duration-150"
          }
          url="https://freelancersmartcontract.netlify.app"
        >
          Smart Contract Projects
        </LinkPreview>{" "}
        when I'm not working on my day job.
      </div>
    </div>
  );
};
