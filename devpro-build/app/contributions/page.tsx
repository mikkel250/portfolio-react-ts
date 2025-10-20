import { Container } from "@/components/Container";
import { LatestRepos } from "@/components/LatestRepos";
import { getUserRepositories } from "@/lib/github";
import { user } from "@/constants/user";

export const metadata = { title: "GitHub Contributions | Devpro" };

export default async function Contributions() {
  const repos = await getUserRepositories("manuarora700");
  return (
    <Container>
      <div className="max-w-5xl mx-auto px-8 mt-10 md:mt-20 relative">
        <h1 className="font-bold text-3xl md:text-5xl md:leading-tight text-zinc-50 max-w-3xl">
          Committing Code and Crimes Against{" "}
          <span className="text-cyan-500">Open Source World</span>
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide">
          A place where you can witness my caffeinated coding adventures and see
          just how much coffee it takes to fuel my commits. from my first "Hello
          World" to my latest breakthrough, and everything in between.
        </p>
      </div>
      <LatestRepos repos={repos} />

      <div className="flex justify-center relative z-[70] ">
        <a
          href={user.github}
          target="__blank"
          className="text-zinc-200 border border-zinc-600 bg-zinc-900 px-8 py-2 rounded-lg hover:border-zinc-700 hover:bg-zinc-800/[0.8] transition duration-200"
        >
          View all on GitHub
        </a>
      </div>
    </Container>
  );
}
