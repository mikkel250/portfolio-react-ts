import { Container } from "@/components/Container";
import { Timeline } from "@/components/Timeline";
import { user } from "@/constants/user";
import Image from "next/image";
import {
  AiOutlineGithub,
  AiOutlineLinkedin,
  AiOutlineTwitter,
} from "react-icons/ai";

export const metadata = { title: "About | Mikkel Ridley" };

export default function AboutPage() {
  const socials = [
    {
      name: "twitter",
      icon: (
        <AiOutlineTwitter className="h-5 w-5 hover:text-primary transition duration-150" />
      ),
      link: user.twitter,
    },
    {
      name: "LinkedIn",
      icon: (
        <AiOutlineLinkedin className="h-5 w-5 hover:text-primary transition duration-150" />
      ),
      link: user.linkedin,
    },
    {
      name: "GitHub",
      icon: (
        <AiOutlineGithub className="h-5 w-5 hover:text-primary transition duration-150" />
      ),
      link: user.github,
    },
  ];
  return (
    <Container>
      <div className="max-w-5xl mx-auto px-8 md:mt-20 relative flex flex-col md:flex-row space-y-10 md:space-y-0 md:space-x-10 justify-between">
        <div>
          <h1 className="font-bold text-3xl md:text-5xl md:leading-tight text-zinc-50 max-w-3xl">
            Hey! I'm
            <span className="text-cyan-500"> Mikkel Ridley</span> and I'm a
            software engineer.
          </h1>
          <p className="text-zinc-300 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide">
            It all started with MUDs (Multi-User Dimensions) back in the mid-nineties, 
            when I was just fifteen and the internet wasn't yet part of everyday life. 
            Since then, my journey has taken some twists and turns. From salmon fishing 
            in Alaska to traveling and busking through Central America, I've explored 
            more than just the typical tech world.
          </p>
        </div>

        <div className="order-first md:order-last">
          <Image
            src={`/images/avatar.png`}
            width={200}
            height={200}
            alt="Avatar"
            className="rounded-2xl"
          />
          <div className="flex flex-row justify-start md:justify-center space-x-2 mt-2">
            {socials.map((socialLink: any, idx: number) => (
              <a
                key={`footer-link-${idx}`}
                href={socialLink.link}
                className="text-zinc-400 text-sm relative"
                target="__blank"
              >
                <span className="relative z-10 px-2 py-2 inline-block hover:text-cyan-500">
                  {socialLink.icon}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 mt-10 relative">
        <p className="text-zinc-300 text-sm md:text-base mt-8 md:leading-loose tracking-wide">
          During five years as a manager at a local business before I transitioned 
          into software engineering, I wore many hats. I was the sole Help Desk and 
          Tech Support Manager, spearheading key improvements that significantly boosted 
          support efficiency. These experiences sharpened my leadership, process improvement, 
          and collaboration skills—qualities I bring to every software project.
        </p>
        <p className="text-zinc-300 text-sm md:text-base mt-8 md:leading-loose tracking-wide">
          When I'm not coding, I'm an excellent cook, I'm usually walking or playing 
          with my Golden Retriever Freddie Mercury (he's a master of both Grunt and Gulp), 
          gaming, investing or coaching others in crypto, blasting Mongolian heavy metal, 
          cycling, geeking out over Neo-Futuristic architecture, and traveling the globe.
        </p>
        <p className="text-zinc-300 text-sm md:text-base mt-8 md:leading-loose tracking-wide">
          Here's a timeline of what I've been upto
        </p>
        <Timeline />
      </div>
    </Container>
  );
}
