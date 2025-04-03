"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Header() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-8 py-4 z-50">
      <motion.button
        className="text-lg font-semibold active:scale-95 transition-transform relative overflow-hidden"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="relative">
          <motion.span 
            className="inline-block"
            initial={{ opacity: 0, x: -12 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 11 : 14
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            ai
          </motion.span>
          <motion.span 
            className="inline-block"
            animate={{ 
              x: isHovered ? -16 : 0
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            K
          </motion.span>
          <motion.span 
            className="inline-block ml-[2px]"
          >
            L
          </motion.span>
          <motion.span
            className="inline-block"
            initial={{ x: -10, opacity: 0 }}
            animate={{ 
              x: isHovered ? 0 : -10,
              opacity: isHovered ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            e
          </motion.span>
        </div>
      </motion.button>
      <nav className="flex gap-8">
        <button className="active:scale-95 transition-transform font-bold">
          About
        </button>
        <button className="active:scale-95 transition-transform font-bold">
          Work
        </button>
        <button className="active:scale-95 transition-transform font-bold">
          Contact
        </button>
      </nav>
    </header>
  );
}