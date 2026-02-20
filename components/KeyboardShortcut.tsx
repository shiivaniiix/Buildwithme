"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { EASING, DURATION } from "@/lib/animations";

/**
 * KeyboardShortcut Component
 * 
 * Displays keyboard shortcuts with developer-focused styling.
 * Shows key combinations in a terminal/IDE style.
 */
interface KeyboardShortcutProps {
  keys: string[];
  description?: string;
  className?: string;
}

export default function KeyboardShortcut({ 
  keys, 
  description,
  className = "" 
}: KeyboardShortcutProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      className={`inline-flex items-center gap-2 ${className}`}
      onHoverStart={() => setIsPressed(true)}
      onHoverEnd={() => setIsPressed(false)}
    >
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <motion.kbd
            key={index}
            className="px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded shadow-soft text-gray-300"
            animate={isPressed ? { 
              scale: 0.95,
              backgroundColor: "rgba(34, 211, 238, 0.2)",
              borderColor: "rgba(34, 211, 238, 0.5)",
            } : {}}
            transition={{ duration: 0.1 }}
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(34, 211, 238, 0.3)",
            }}
          >
            {key}
          </motion.kbd>
        ))}
      </div>
      {description && (
        <span className="text-xs text-gray-400">{description}</span>
      )}
    </motion.div>
  );
}








