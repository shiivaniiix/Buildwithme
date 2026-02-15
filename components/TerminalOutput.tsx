"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { EASING, DURATION, cursorBlink } from "@/lib/animations";

/**
 * TerminalOutput Component
 * 
 * Developer-focused terminal-style output display.
 * Features typewriter effect and blinking cursor for authentic feel.
 */
interface TerminalOutputProps {
  commands: string[];
  className?: string;
}

export default function TerminalOutput({ commands, className = "" }: TerminalOutputProps) {
  const [currentCommand, setCurrentCommand] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentCommand < commands.length) {
      setIsTyping(true);
      const command = commands[currentCommand];
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < command.length) {
          setDisplayedText(command.slice(0, charIndex + 1));
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
          
          // Move to next command after delay
          setTimeout(() => {
            setCurrentCommand((prev) => (prev + 1) % commands.length);
            setDisplayedText("");
          }, 2000);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [currentCommand, commands]);

  return (
    <motion.div
      className={`glass rounded-lg p-4 font-mono text-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.normal, ease: EASING.primary }}
    >
      {/* Terminal prompt */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-400">$</span>
        <span className="text-cyan-400">buildwithme</span>
        <span className="text-gray-500">~</span>
      </div>
      
      {/* Command output */}
      <div className="text-gray-300 min-h-[1.5rem]">
        {displayedText}
        {isTyping && (
          <motion.span
            className="inline-block w-2 h-4 bg-cyan-400 ml-1"
            animate={cursorBlink}
          />
        )}
      </div>
      
      {/* Terminal status bar */}
      <motion.div
        className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500 flex items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span>Status: Ready</span>
        <span>•</span>
        <span>AI: Active</span>
      </motion.div>
    </motion.div>
  );
}







