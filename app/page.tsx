import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { getUserRepositories } from "@/lib/github";
import { LatestRepos } from "@/components/LatestRepos";
import { Uses } from "@/components/Uses";
import { Experience } from "@/components/Experience";

export default async function Page() {
  const repos = await getUserRepositories("mikkel250");

  const shouldShowMore = () => {
    if (repos && repos.length > 9) {
      return true;
    }
    return false;
  };

  return (
    <Container>
      <Hero />
      <Experience />
      <h1 className='text-2xl md:text-3xl text-white font-bold max-w-5xl mx-auto px-8  mt-40'>
        Projects: From AI assistants to e-commerce platforms
      </h1>

      <Projects />
      <h1 className='text-2xl md:text-3xl text-white font-bold max-w-5xl mx-auto px-8 mt-40'>
        My Repos
      </h1>
      <LatestRepos repos={repos.slice(0, 9)} showMore={shouldShowMore()} />

      <h1 className='text-2xl md:text-3xl text-white font-bold max-w-5xl mx-auto px-8 mt-40'>
        Tools and Technologies
      </h1>
      <div className='max-w-5xl mx-auto px-8'>
        <Uses />
      </div>
    </Container>
  );
}
