import { Container } from "@/components/Container";
import AllBlogs from "@/components/AllBlogs";
import { getAllBlogs } from "@/lib/getAllBlogs";

export const metadata = {
  title: "Blogs | Mikkel Ridley",
};

export default async function BlogsPage() {
  const blogs = (await getAllBlogs()).map(({ component, ...meta }) => meta);

  return (
    <Container>
      <div className="max-w-5xl mx-auto px-8 mt-10 md:mt-20 relative ">
        <div>
          <h1 className="font-bold text-3xl md:text-5xl md:leading-tight text-zinc-50 max-w-3xl">
            All of my
            <span className="text-cyan-500"> Technical Knowledge</span> in one
            place
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide">
            I'm obsessed with writing bad code. I'm also obsessed with writing.
            Here, I write about my experiences with code and the things I've
            learned along the way.
          </p>
        </div>
        <div className="mt-20">
          <AllBlogs blogs={blogs} />
        </div>
      </div>
    </Container>
  );
}
