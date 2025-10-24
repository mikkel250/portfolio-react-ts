import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { getUserRepositories } from "@/lib/github";
import { LatestRepos } from "@/components/LatestRepos";
import AllBlogs from "@/components/AllBlogs";
import { Uses } from "@/components/Uses";
import { getAllBlogs } from "@/lib/getAllBlogs";
import { Experience } from "@/components/Experience";

export default async function Page() {
  const repos = await getUserRepositories("mikkel250");
  const blogs = (await getAllBlogs())
    .slice(0, 4)
    .map(({ component, ...meta }) => meta);

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
      <h1 className="text-2xl md:text-3xl text-white font-bold max-w-5xl mx-auto px-8  mt-40">
        From AI assistants to e-commerce platforms
      </h1>

      <Projects />
      <h1 className="text-2xl md:text-3xl text-white font-bold max-w-5xl mx-auto px-8 mt-40">
        Latest contributions to open source
      </h1>
      <LatestRepos repos={repos.slice(0, 9)} showMore={shouldShowMore()} />

      <div className="max-w-5xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-10 mt-40 ">
        <div className="col-span-2">
          <AllBlogs blogs={blogs} />
        </div>
        <Uses />
      </div>
    </Container>
  );
}
