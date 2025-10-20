import { Container } from "@/components/Container";
import { Timeline } from "@/components/Timeline";
import { user } from "@/constants/user";
import Image from "next/image";
import {
  AiOutlineGithub,
  AiOutlineLinkedin,
  AiOutlineTwitter,
} from "react-icons/ai";

export const metadata = { title: "Projects | Devpro" };

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
            <span className="text-cyan-500"> Tyler Durden</span> and I'm a full
            stack soap engineer.
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide">
            I've been obsessed with technology ever since I was a kid. When I
            wasn't taking apart my family's computer (sorry, mom), I was
            teaching myself how to code. Fast forward a few years, and now I'm a
            full-fledged code ninja with an insatiable thirst for creating
            beautiful websites and functional applications.
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
                className="text-zinc-500 text-sm relative"
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
        <p className="text-zinc-400 text-sm md:text-base mt-8 md:leading-loose tracking-wide">
          When I'm not busy slaying bugs and writing code, I'm usually busy
          indulging in my two favorite hobbies: hot sauce and dad jokes. I
          firmly believe that a good laugh and a dash of hot sauce can fix just
          about anything, including bugs in my code (okay, maybe not that last
          part).
        </p>
        <p className="text-zinc-400 text-sm md:text-base mt-8 md:leading-loose tracking-wide">
          Here's a timeline of what I've been upto
        </p>
        <Timeline />
      </div>
    </Container>
  );
}
