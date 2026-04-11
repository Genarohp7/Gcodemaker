import HeroSection from "../components/sections/HeroSection";
import ProblemSection from "../components/sections/ProblemSection";
import AboutSection from "../components/sections/AboutSection";
import ServicesSection from "../components/sections/ServicesSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ProcessSection from "../components/sections/ProcessSection";
import ContactSection from "../components/sections/ContactSection";
import FinalCtaSection from "../components/sections/FinalCtaSection";

function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <ServicesSection />
      <ProjectsSection />
      <AboutSection />
      <ProcessSection />
      <ContactSection />
      <FinalCtaSection />
    </>
  );
}

export default HomePage;