import React from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

export const LogoAnimation = ({ onFinished }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg dark:bg-brand-dark-bg transition-colors duration-500"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated outer glowing ring */}
        <motion.div
          className="absolute w-48 h-48 rounded-full border border-primary/20 dark:border-secondary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Brand Logo with drawing/fade effect */}
        <motion.img
          src={logo}
          alt="LELA Logo"
          className="w-40 h-auto object-contain z-10 filter drop-shadow-[0_4px_10px_rgba(142,54,86,0.15)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeOut"
          }}
        />

        {/* Subtitle animation */}
        <motion.div
          className="mt-6 flex flex-col items-center gap-1 z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.0, ease: "easeOut" }}
        >
          <span className="font-english tracking-[0.25em] text-primary dark:text-secondary text-xs uppercase font-semibold">
            LELA
          </span>
          <span className="font-arabic text-sm text-brand-text/60 dark:text-brand-dark-text/60 font-light mt-1">
            بوابتكِ للتسوق الفاخر
          </span>
        </motion.div>

        {/* Premium loading line indicator */}
        <div className="w-24 h-[1px] bg-secondary/30 dark:bg-primary/30 mt-8 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 bottom-0 left-0 bg-primary dark:bg-secondary"
            initial={{ left: "-100%", width: "50%" }}
            animate={{ left: "100%" }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
