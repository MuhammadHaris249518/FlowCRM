import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { CTABanner } from "@/components/marketing/CTABanner";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesGrid />
      <CTABanner />
    </main>
  );
}
