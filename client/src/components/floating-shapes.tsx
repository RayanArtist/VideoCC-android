import { motion } from "framer-motion";

export function FloatingShapes() {
  return (
    <div className="floating-shapes">
      <motion.div
        className="shape w-20 h-20 top-[20%] left-[10%]"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="shape w-30 h-30 top-[60%] right-[10%]"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 2,
        }}
      />
      <motion.div
        className="shape w-15 h-15 top-[80%] left-[20%]"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 4,
        }}
      />
    </div>
  );
}
