"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  EASING,
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
 * FeaturesSection Component
 * 
 * Showcases platform features in a grid layout.
 * Each feature card highlights a specific capability with animated icons.
 */

/**
 * Features data
 * Comprehensive list of platform capabilities
 */
const features = [
  {
    title: "Real-time AI Assistance",
    description: "Get instant code suggestions and explanations as you type.",
    icon: "⚡",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    title: "Interactive Debugging",
    description: "Understand errors with detailed explanations and visual guides.",
    icon: "🐛",
    gradient: "from-red-500 to-pink-500",
  },
  {
    title: "Project Templates",
    description: "Start with pre-built templates for web apps, APIs, and more.",
    icon: "📦",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Code Review",
    description: "Get AI-powered code reviews to improve your coding style.",
    icon: "✨",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    title: "Learning Paths",
    description: "Follow structured paths from beginner to advanced topics.",
    icon: "🎯",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    title: "Portfolio Building",
    description: "Build projects that showcase your skills to employers.",
    icon: "💼",
    gradient: "from-cyan-500 to-teal-500",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN.default });

  return (
    <section id="features" ref={ref} className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Title with text reveal */}
        <motion.div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
            variants={sectionTitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            Powerful Features
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            variants={sectionDescriptionVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            Everything you need to become a better developer, all in one platform.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 group relative overflow-hidden cursor-pointer shadow-soft"
              variants={cardVariants}
              whileHover={cardHover}
              whileTap={{ scale: 0.97 }}
              style={{ perspective: 1000 }}
            >
              {/* Gradient background on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              {/* Icon with animated glow and premium hover */}
              <motion.div
                className="text-5xl mb-4 relative z-10 inline-block"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                  },
                }}
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 blur-xl rounded-full`}
                  animate={{
                    opacity: iconGlowAnimation.opacity,
                    scale: iconGlowAnimation.scale,
                  }}
                  transition={{
                    ...iconGlowTransition,
                    delay: index * 0.3,
                  }}
                  whileHover={{
                    opacity: 0.6,
                    scale: 1.5,
                  }}
                />
                <span className="relative z-10 inline-block">{feature.icon}</span>
              </motion.div>
              
              {/* Developer badge - appears on hover */}
              <motion.div
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ scale: 0, rotate: -180 }}
                whileHover={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <span className="font-mono">feature</span>
              </motion.div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Animated glow effect */}
              <motion.div
                className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

