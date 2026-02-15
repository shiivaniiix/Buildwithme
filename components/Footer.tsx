"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  EASING,
  DURATION,
  VIEWPORT_MARGIN,
  containerVariants,
  fadeInUpVariants,
} from "@/lib/animations";

/**
 * Footer Component
 * 
 * Site footer with company information and links.
 * Features smooth fade-in animation on scroll.
 */
export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN.close });

  // Footer item variants with scale for enhanced effect
  const itemVariants = {
    ...fadeInUpVariants,
    hidden: { ...fadeInUpVariants.hidden, scale: 0.95 },
    visible: {
      ...fadeInUpVariants.visible,
      scale: 1,
    },
  };

  return (
    <footer ref={ref} className="py-16 px-6 border-t border-gray-800 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col md:flex-row justify-between items-center gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Codezista
            </h3>
            <p className="text-gray-400">Buildwithme</p>
          </motion.div>

          {/* Links */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-6 justify-center"
          >
            <motion.a
              href="#"
              className="text-gray-400 hover:text-cyan-400 transition-colors relative"
              whileHover={{ 
                scale: 1.15,
                y: -2,
                textShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASING.primary }}
            >
              Privacy
            </motion.a>
            <motion.a
              href="#"
              className="text-gray-400 hover:text-cyan-400 transition-colors relative"
              whileHover={{ 
                scale: 1.15,
                y: -2,
                textShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASING.primary }}
            >
              Terms
            </motion.a>
            <motion.a
              href="#"
              className="text-gray-400 hover:text-cyan-400 transition-colors relative"
              whileHover={{ 
                scale: 1.15,
                y: -2,
                textShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASING.primary }}
            >
              About
            </motion.a>
          </motion.div>

          {/* Copyright */}
          <motion.div variants={itemVariants} className="text-center md:text-right">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Codezista. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}

