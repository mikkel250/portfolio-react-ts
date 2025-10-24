"use client";
import React from "react";
import { motion } from "framer-motion";

export const PermanentPreview = ({
  videoSrc,
  fallbackImage,
  className,
}: {
  videoSrc?: string;
  fallbackImage?: string;
  className?: string;
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`${className} bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-cyan-500 text-2xl mb-2">🔗</div>
          <div className="text-zinc-300 text-sm font-medium">Loading Preview</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-lg`}>
      <motion.div
        className="w-full h-full"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {videoSrc && !videoError ? (
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-cyan-500 text-2xl mb-2">🔗</div>
              <div className="text-zinc-300 text-sm font-medium">Live Demo</div>
              <div className="text-zinc-500 text-xs mt-1">Click to visit</div>
            </div>
          </div>
        )}
      </motion.div>
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
