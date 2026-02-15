"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  EASING,
  DURATION,
  VIEWPORT_MARGIN,
  fadeInUpVariants,
} from "@/lib/animations";

/**
 * SupportSection Component
 * 
 * Contact information and support details.
 * Features glassmorphic card with animated contact items.
 */
export default function SupportSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN.default });

  // Container animation for support card
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: DURATION.slow,
        ease: EASING.primary,
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <section id="support" ref={ref} className="py-32 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-soft-xl"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          whileHover={{ 
            scale: 1.02,
            y: -5,
            transition: { duration: 0.3, ease: EASING.primary }
          }}
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-3xl blur-xl opacity-20"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />

          <div className="relative z-10">
            {/* Title */}
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
              variants={fadeInUpVariants}
            >
              Need help? We've got you covered.
            </motion.h2>

            {/* Contact Information */}
            <motion.div
              className="space-y-6 mt-8"
              variants={fadeInUpVariants}
            >
              {/* Phone */}
              <motion.a
                href="tel:+919699617331"
                className="flex items-center gap-4 p-4 glass rounded-xl hover:border-cyan-400/50 transition-all group relative overflow-hidden shadow-soft"
                whileHover={{ 
                  x: 12, 
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: EASING.primary }}
              >
                {/* Gradient shift on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-2xl relative z-10 shadow-soft"
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.5, ease: EASING.primary }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 blur-md"
                    whileHover={{ opacity: 0.6 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">📞</span>
                </motion.div>
                <div className="flex-1 relative z-10">
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors">
                    +91 9699617331
                  </p>
                </div>
                <motion.div
                  className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </motion.a>

              {/* Email */}
              <motion.a
                href="mailto:codezista.support.team@gmail.com"
                className="flex items-center gap-4 p-4 glass rounded-xl hover:border-cyan-400/50 transition-all group relative overflow-hidden shadow-soft"
                whileHover={{ 
                  x: 12, 
                  scale: 1.03,
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: EASING.primary }}
              >
                {/* Gradient shift on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl relative z-10 shadow-soft"
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.5, ease: EASING.primary }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 blur-md"
                    whileHover={{ opacity: 0.6 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">✉️</span>
                </motion.div>
                <div className="flex-1 relative z-10">
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors break-all">
                    codezista.support.team@gmail.com
                  </p>
                </div>
                <motion.div
                  className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity relative z-10"
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </motion.a>
            </motion.div>

            {/* Support message */}
            <motion.p
              className="text-center text-gray-400 mt-8"
              variants={fadeInUpVariants}
            >
              Our support team is available 24/7 to assist you with any questions or issues.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

