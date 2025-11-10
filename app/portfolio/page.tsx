import { Container } from "@/components/Container";
import { Projects } from "@/components/Projects";
import { portfolio } from "@/constants/portfolio";

export const metadata = { title: "Portfolio | Mikkel Ridley" };

export default function PortfolioPage() {
  return (
    <Container>
      <div className='max-w-5xl mx-auto px-8 mt-10 md:mt-20 relative'>
        <h1 className='font-bold text-3xl md:text-5xl md:leading-tight text-zinc-50 max-w-3xl'>
          Real-world impact through{" "}
          <span className='text-cyan-500'>adaptive engineering</span>
        </h1>
        <p className='text-zinc-300 text-sm md:text-base max-w-2xl mt-8 md:leading-loose tracking-wide'>
          Production work for mission-driven clients spanning cultural
          institutions and healthcare systems. Every engagement required
          learning new technologies while maintaining consistent quality and meeting business objectives.
        </p>
      </div>

      <Projects items={portfolio} />
    </Container>
  );
}
