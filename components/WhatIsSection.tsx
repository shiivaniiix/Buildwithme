"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  EASING,
  DURATION,
  VIEWPORT_MARGIN,
  containerVariants,
  cardVariants,
  cardHover,
  sectionTitleVariants,
  sectionDescriptionVariants,
  iconGlowAnimation,
  iconGlowTransition,
} from "@/lib/animations";

/**
 * WhatIsSection Component
 * 
 * Explains what Buildwithme is through three key feature cards.
 * Uses scroll-triggered animations and glassmorphic design.
 */

/**
 * Feature cards data
 * Each card represents a core value proposition
 */
const cards = [
  {
    title: "AI Pair Programmer",
    description: "Work alongside an intelligent AI that understands your code, suggests improvements, and helps you write better software.",
    icon: "🤖",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Learn by Building",
    description: "Master programming through hands-on experience. Build real projects that you can showcase in your portfolio.",
    icon: "🚀",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Step-by-step Guidance",
    description: "Never get stuck. Get detailed explanations, debugging help, and learning resources tailored to your skill level.",
    icon: "📚",
    gradient: "from-cyan-500 to-teal-500",
  },
];

export default function WhatIsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN.default });

  return (
    <section ref={ref} className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Title with text reveal */}
        <motion.div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
            variants={sectionTitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            What is Buildwithme?
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            variants={sectionDescriptionVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            Transform your coding journey with AI-powered assistance and real-world project experience.
          </motion.p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="glass rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-300 group relative overflow-hidden shadow-soft-lg"
              variants={cardVariants}
              whileHover={cardHover}
              style={{ perspective: 1000 }}
            >
              {/* Gradient background on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              {/* Icon with glow effect */}
              <motion.div
                className="text-6xl mb-4 relative z-10 inline-block"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 blur-2xl rounded-full`}
                  animate={{
                    opacity: iconGlowAnimation.opacity,
                    scale: iconGlowAnimation.scale,
                  }}
                  transition={{
                    ...iconGlowTransition,
                    delay: index * 0.5,
                  }}
                />
                <span className="relative z-10 inline-block">{card.icon}</span>
              </motion.div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Glow effect */}
              <motion.div
                className={`absolute -inset-1 bg-gradient-to-r ${card.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

