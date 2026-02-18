import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const s = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }));
    setStars(s);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center">
      {/* Star field */}
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}

      {/* Planet */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-2xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-xl px-6">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-7xl font-bold tracking-tight"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-4 text-lg text-gray-300"
        >
          You drifted off course. This page doesn’t exist in this universe.
        </motion.p>

        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block mt-8 rounded-2xl bg-white text-black px-6 py-3 font-semibold shadow-lg"
        >
          Return to Earth
        </motion.a>
      </div>
    </div>
  );
}
