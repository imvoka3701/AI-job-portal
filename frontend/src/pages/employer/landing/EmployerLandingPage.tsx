import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";
import { InteractiveAISimulatorSection } from "./InteractiveAISimulatorSection";
import { CoreFunctionsSection } from "./CoreFunctionsSection";
import { ROICalculatorSection } from "./ROICalculatorSection";
import { TopServicesSection } from "./TopServicesSection";
import { FiguresSection } from "./FiguresSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { PricingSection } from "./PricingSection";
import { ContactFormSection } from "./ContactFormSection";
import { LandingFooter } from "./LandingFooter";

export function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Sticky Glassmorphism Header */}
      <LandingHeader />

      <main>
        {/* 2. Hero Section: Live AI candidate scoring mockup + Aurora Mesh */}
        <HeroSection />

        {/* 3. Social Proof: Infinite Animated Logo Marquee */}
        <SocialProofSection />

        {/* 4. Interactive AI Simulator Sandbox (Chấm điểm CV trực quan) */}
        <InteractiveAISimulatorSection />

        {/* 5. Core Functions: Bento Grid 6-Block Ecosystem */}
        <CoreFunctionsSection />

        {/* 6. Interactive ROI Calculator (Máy tính ROI tiết kiệm chi phí & thời gian) */}
        <ROICalculatorSection />

        {/* 7. Top Services: 3 flagship services (Top Jobs, Top Credit, Top Branding) */}
        <TopServicesSection />

        {/* 8. Figures Section: Dark Emerald Big Numbers with Animated Counters */}
        <FiguresSection />

        {/* 9. Testimonials: HR Leadership Reviews & ROI Highlights */}
        <TestimonialsSection />

        {/* 10. Transparent Pricing: Monthly/Yearly Toggle + Free Tier */}
        <PricingSection />

        {/* 11. Contact Form: High-Conversion Lead Capture */}
        <ContactFormSection />
      </main>

      {/* 12. Enterprise Footer & Ecosystem */}
      <LandingFooter />
    </div>
  );
}

export default EmployerLandingPage;
