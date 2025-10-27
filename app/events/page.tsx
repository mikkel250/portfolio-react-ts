import { Container } from "@/components/Container";
import Talks from "@/components/Talks";
import { talks } from "@/constants/events";

export const metadata = { title: "Events | Mikkel Ridley" };

export default function EventsPage() {
  return (
    <Container>
      <div className="max-w-5xl mx-auto px-8 mt-10 md:mt-20 relative">
        <h1 className="font-bold text-3xl md:text-5xl md:leading-tight text-zinc-50 max-w-3xl">
          I speak at conferences about how
          <span className="text-cyan-500"> PHP is the best</span>
        </h1>
        <p className="text-zinc-300 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide">
          I don't understand why people are after Angular and React when PHP is
          still the OG of web development. I've been building a lot of things,
          from small experiments to full-blown web applications, each project
          showcases my love for coding and design.
        </p>
        <div className="mt-20 max-w-3xl mx-auto">
          {talks.map((talk, idx) => (
            <Talks
              key={`talk-${idx}`}
              title={talk.title}
              description={talk.description}
              company={talk.company}
              image={talk.image}
              url={talk.url}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
