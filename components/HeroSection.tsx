"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  EASING,
  DURATION,
  containerVariants,
  fadeInUpVariants,
  buttonHoverPrimary,
  buttonHoverSecondary,
  buttonTap,
  buttonRipple,
} from "@/lib/animations";

/**
 * FloatingCodeSnippet Component
 * 
 * Enhanced animated code snippet with premium floating behavior.
 * Features parallax effect, realistic drift, and developer-focused interactions.
 */
const FloatingCodeSnippet = ({ code, delay = 0 }: { code: string; delay?: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Memoize random values to prevent recalculation on every render
  const animationConfig = useMemo(() => {
    const floatDistance = 40 + Math.random() * 20;
    const floatDuration = 10 + Math.random() * 4;
    const driftAmount = 15 + Math.random() * 10;
    const leftPosition = Math.random() * 100;
    const topPosition = Math.random() * 100;
    
    return {
      floatDistance,
      floatDuration,
      driftAmount,
      leftPosition,
      topPosition,
    };
  }, []); // Empty dependency array - calculate once

  return (
    <motion.div
      className="absolute opacity-20 text-green-400 code-snippet cursor-pointer group"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: [0.1, 0.35, 0.1],
        y: [0, -animationConfig.floatDistance, 0],
        x: [0, animationConfig.driftAmount, -animationConfig.driftAmount, 0],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: animationConfig.floatDuration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
        times: [0, 0.5, 1], // Explicit keyframe times for 3-value arrays
      }}
      style={{
        left: `${animationConfig.leftPosition}%`,
        top: `${animationConfig.topPosition}%`,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        opacity: 0.6,
        scale: 1.1,
        zIndex: 10,
        transition: { duration: 0.3 },
      }}
    >
      <pre className="text-xs relative">
        {code}
        {/* Terminal cursor on hover */}
        {isHovered && (
          <motion.span
            className="inline-block w-2 h-4 bg-cyan-400 ml-1"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        )}
      </pre>
      
      {/* Syntax highlighting glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 rounded blur-sm"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "linear",
        }}
      />
    </motion.div>
  );
};

/**
 * Code snippets displayed in the background
 * Real code examples that represent the platform's functionality
 */
const codeSnippets = [
  `const build = async () => {
  const project = await ai.assist();
  return success;
};`,
  `function learnByBuilding() {
  return realProjects.map(project => 
    masterSkills(project)
  );
}`,
  `import { AI } from 'buildwithme';
const pairProgrammer = new AI();
pairProgrammer.guide();`,
  `async function debug() {
  const solution = await ai.explain();
  return understanding;
}`,
];

/**
 * HeroSection Component
 * 
 * Main hero section with animated headline, CTAs, and floating code snippets.
 * First section users see - sets the tone for the platform.
 */
export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  // Only render code snippets after mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Headline animation - premium spring physics for impact
  const headlineVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        mass: 1,
      },
    },
  };

  // Text reveal for subtitle - refined timing
  const textRevealVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.slow,
        ease: EASING.primary,
      },
    },
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Floating code snippets in background */}
      {mounted &&
        codeSnippets.map((snippet, index) => (
          <FloatingCodeSnippet key={index} code={snippet} delay={index * 0.5} />
        ))}

      {/* Main content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated headline */}
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent"
          variants={headlineVariants}
        >
          Buildwithme
        </motion.h1>

        {/* Subtext with staggered text reveal */}
        <motion.p
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          variants={fadeInUpVariants}
        >
          <motion.span
            variants={textRevealVariants}
            initial="hidden"
            animate="visible"
          >
            Your AI-powered pair programming platform.
          </motion.span>
          <br />
          <motion.span
            variants={textRevealVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <span className="text-cyan-400">Learn by building</span> real projects with
            step-by-step guidance.
          </motion.span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          variants={fadeInUpVariants}
        >
          {/* Primary CTA with premium ripple effect */}
          <Link href="/sign-in">
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl text-lg relative overflow-hidden group shadow-soft-lg"
              whileHover={buttonHoverPrimary}
              whileTap={buttonTap}
            >
              <span className="relative z-10">Get Started</span>
              
              {/* Gradient shift on hover - smoother transition */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl"
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASING.primary }}
              />
              
              {/* Enhanced glow effect with pulse */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 blur-2xl rounded-xl"
                whileHover={{ 
                  opacity: 0.7,
                }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Ripple effect on click */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                initial={{ scale: 0, opacity: 0.5 }}
                whileTap={buttonRipple}
              />
            </motion.button>
          </Link>

          {/* Secondary CTA with glow effect */}
          <Link href="/docs">
            <motion.button
              className="px-8 py-4 glass text-white font-semibold rounded-xl text-lg border border-gray-600 relative overflow-hidden group shadow-soft"
              whileHover={buttonHoverSecondary}
              whileTap={buttonTap}
            >
              <span className="relative z-10">View Docs</span>
              {/* Subtle glow on hover */}
              <motion.div
                className="absolute inset-0 bg-cyan-400/10 opacity-0 blur-md rounded-xl"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              {/* Border glow on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0"
                whileHover={{ 
                  opacity: 1,
                  boxShadow: "0 0 20px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)"
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

