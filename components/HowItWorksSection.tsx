"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  EASING,
  DURATION,
  VIEWPORT_MARGIN,
  containerVariants,
  sectionTitleVariants,
  sectionDescriptionVariants,
} from "@/lib/animations";

/**
 * HowItWorksSection Component
 * 
 * Explains the three-step process of using Buildwithme.
 * Features vertical step layout with connecting lines and animated icons.
 */

/**
 * Steps data
 * Sequential process explanation
 */
const steps = [
  {
    number: "01",
    title: "Write code with AI",
    description: "Start coding with AI assistance. Get real-time suggestions, code completions, and best practices as you build.",
    icon: "💻",
  },
  {
    number: "02",
    title: "Understand & Debug",
    description: "When you encounter issues, our AI explains what went wrong and guides you to the solution step by step.",
    icon: "🔍",
  },
  {
    number: "03",
    title: "Build Real Projects",
    description: "Complete full-stack projects from scratch. Each project teaches you new concepts and reinforces your skills.",
    icon: "🏗️",
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN.default });

  // Step animation - slides in from left
  const stepVariants = {
    hidden: { opacity: 0, x: -50, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: DURATION.slow,
        ease: EASING.primary,
      },
    },
  };

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-6 relative bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Section Title with text reveal */}
        <motion.div className="text-center mb-20">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            variants={sectionTitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            variants={sectionDescriptionVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            A simple three-step process to accelerate your coding journey.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <motion.div
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col md:flex-row items-start gap-8 group relative"
              variants={stepVariants}
            >
              {/* Step Number & Icon */}
              <div className="flex-shrink-0 relative">
                <motion.div
                  className="w-24 h-24 rounded-full glass flex items-center justify-center text-4xl relative z-10 group-hover:border-cyan-400 transition-colors shadow-soft-lg"
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: 8,
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-cyan-400 opacity-0 blur-xl"
                    whileHover={{ opacity: 0.4 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">{step.icon}</span>
                </motion.div>
                <motion.div
                  className="absolute -top-4 -left-4 text-8xl font-bold text-gray-800 opacity-50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 0.3, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.25 + 0.4, duration: 0.5, ease: EASING.primary }}
                >
                  {step.number}
                </motion.div>
                {/* Enhanced glow effect */}
                <motion.div
                  className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  }}
                />
              </div>

              {/* Step Content with text reveal */}
              <div className="flex-1 pt-4">
                <motion.h3
                  className="text-3xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors relative inline-block"
                  whileHover={{ 
                    x: 12, 
                    scale: 1.02,
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {step.title}
                  {/* Terminal-style underline on hover */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.h3>
                <motion.p
                  className="text-gray-400 text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ 
                    delay: index * 0.25 + 0.3, 
                    duration: 0.5,
                    ease: EASING.primary,
                  }}
                >
                  {step.description}
                </motion.p>
                
                {/* Step number badge - developer style */}
                <motion.div
                  className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0, rotate: -90 }}
                  whileHover={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <span>Step {index + 1}</span>
                </motion.div>
              </div>

              {/* Connecting Line (except for last item) */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute left-12 top-24 w-0.5 h-20 bg-gradient-to-b from-cyan-400/50 to-transparent"
                  initial={{ scaleY: 0, transformOrigin: "top" }}
                  animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ delay: index * 0.3 + 0.8, duration: 0.5 }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

