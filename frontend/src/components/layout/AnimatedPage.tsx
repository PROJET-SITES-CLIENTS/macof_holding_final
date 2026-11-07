import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Transition complexe : 
// - La page sort vers la gauche (x: -100%)
// - La nouvelle page arrive par le bas (y: 100% -> 0)
const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      when: "beforeChildren"
    }
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

// Effet "Rideau" Noir et Or qui balaye l'écran
const curtainVariants = {
  initial: { x: "100%", width: "100%" },
  animate: {
    x: "0%",
    width: "0%",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    x: ["0%", "0%"],
    width: ["0%", "100%"],
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

const curtainBlueVariants = {
  initial: { x: "100%", width: "100%" },
  animate: {
    x: "0%",
    width: "0%",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
  },
  exit: {
    x: ["0%", "0%"],
    width: ["0%", "100%"],
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className = "" }: AnimatedPageProps) {
  return (
    <>
      {/* Rideau Bleu MACOF */}
      <motion.div 
        className="fixed top-0 left-0 h-screen bg-[#0A4287] z-[100] origin-left"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={curtainBlueVariants}
      />
      {/* Rideau Rouge MACOF (qui cache le bleu) puis laisse le fond sombre */}
      <motion.div 
        className="fixed top-0 left-0 h-screen bg-[#D81A21] z-[101] origin-left"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={curtainVariants}
      />
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        className={className}
      >
        {children}
      </motion.div>
    </>
  );
}
