// app/page.tsx
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeatureGrid from "./components/FeatureGrid";
import HowItWorks from "./components/HowItWorks";
import DemoStrip from "./components/DemoStrip";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <DemoStrip />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}