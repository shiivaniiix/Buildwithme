"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { codeSnippetHover, EASING, DURATION } from "@/lib/animations";

/**
 * CodeSnippetCard Component
 * 
 * Interactive code snippet card with developer-focused micro-interactions.
 * Features syntax highlighting effect, hover states, and copy-to-clipboard feel.
 */
interface CodeSnippetCardProps {
  code: string;
  language?: string;
  className?: string;
}

export default function CodeSnippetCard({ 
  code, 
  language = "javascript",
  className = "" 
}: CodeSnippetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Simulate copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div
      className={`relative glass rounded-lg p-4 code-snippet group cursor-pointer ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={codeSnippetHover}
      onClick={handleCopy}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATION.normal, ease: EASING.primary }}
    >
      {/* Language badge */}
      <motion.div
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: DURATION.fast }}
      >
        {language}
      </motion.div>

      {/* Code content with syntax highlighting effect */}
      <pre className="text-xs text-green-400/80 mt-6">
        <code>{code}</code>
      </pre>

      {/* Copy indicator */}
      <motion.div
        className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={isCopied ? { scale: [1, 1.2, 1] } : {}}
      >
        {isCopied ? "✓ Copied" : "Click to copy"}
      </motion.div>

      {/* Terminal cursor effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute bottom-2 left-4 w-2 h-4 bg-cyan-400"
          animate={{
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </motion.div>
  );
}







