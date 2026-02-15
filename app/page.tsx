"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhatIsSection from "@/components/WhatIsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import SupportSection from "@/components/SupportSection";
import Footer from "@/components/Footer";
import { pageLoadVariants } from "@/lib/animations";

/**
 * Home Page Component
 * 
 * Main landing page with all sections.
 * Uses page load animation for smooth initial entrance.
 */

export default function Home() {
  return (
    <motion.main
      className="min-h-screen code-pattern relative"
      variants={pageLoadVariants}
      initial="initial"
      animate="animate"
    >
      {/* Navigation Bar */}
      <Navbar />

      {/* All sections have their own scroll-triggered animations via useInView */}
      <div className="relative z-10">
        <HeroSection />
        <WhatIsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SupportSection />
        <Footer />
      </div>
    </motion.main>
  );
}

