import HeroSection from "../components/sections/HeroSection";
import ProblemSection from "../components/sections/ProblemSection";
import SolutionSection from "../components/sections/SolutionSection";
import ServicesSection from "../components/sections/ServicesSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ProcessSection from "../components/sections/ProcessSection";
import AiDemoSection from "../components/sections/AiDemoSection";
import ContactSection from "../components/sections/ContactSection";
import FinalCtaSection from "../components/sections/FinalCtaSection";

function HomePage() {
  return (
    <>
      <HeroSection />
      <AiDemoSection />
      <ProblemSection />
      <SolutionSection />
      <ServicesSection />
      <ProjectsSection />
      <ProcessSection />
      <ContactSection />
      <FinalCtaSection />
    </>
  );
}

export default HomePage;
